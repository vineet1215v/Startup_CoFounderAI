from __future__ import annotations

import asyncio
from typing import Dict

from core.base_agent import CognitiveAgent
from core.bus import EventType
from core.consensus import evaluate_consensus
from core.openrouter_client import ask_qwen
from core.storage import storage


class SpecialistAgent(CognitiveAgent):
    def __init__(self, profile_key: str):
        super().__init__(profile_key)

    async def _generate_text(self, prompt: str, fallback_text: str) -> str:
        try:
            text = await asyncio.to_thread(
                ask_qwen,
                prompt,
                f"You are {self.role}. {self.persona}",
                0.35,
            )
            text = (text or "").strip()
            return text or fallback_text
        except Exception as exc:
            print(f"[{self.name}] Model call failed: {exc}")
            return fallback_text

    def _fallback_idea_insight(self, data: str) -> str:
        return (
            f"{self.role} view: for '{data}', reduce the scope to one clear wedge, one measurable proof point, "
            "and one risk to validate immediately before expanding the plan."
        )

    def _fallback_peer_insight(self, data: dict) -> str:
        return (
            f"{self.role} challenge: building on {data.get('agent_name', 'peer')}, the board should confirm "
            "the assumption, the constraint, and the owner before treating this as a decision."
        )

    def _should_interrupt(self, perception: Dict[str, float]) -> bool:
        if self.role == "CFO" and perception["risk_pressure"] > 0.78:
            return True
        if self.role == "CTO" and perception["intent"] == "execution" and perception["urgency"] > 0.8:
            return True
        if self.role == "COO" and perception["intent"] == "execution" and perception["phase"] == "late":
            return True
        return False

    async def process_new_idea(self, data: str, perception: dict, session_id: str, event: Dict[str, str]) -> None:
        research = await self.research(data, perception, session_id)
        prompt = (
            f"You are {self.name}, the {self.role} in a startup boardroom.\n"
            f"Persona: {self.persona}\n"
            f"Discussion phase: {perception['phase']}\n"
            f"Founder idea: {data}\n"
            f"Research findings: {research}\n"
            "Speak naturally as if in a live boardroom meeting. Start with your name and role, then give your expert opinion.\n"
            "Be direct, use business language, and if you see risks or opportunities, call them out.\n"
            "Keep it to 2-3 sentences, actionable and realistic."
        )
        insight = await self._generate_text(prompt, self._fallback_idea_insight(data))
        decision = await self.decide_participation(perception, research, insight, session_id)
        if not decision["should_speak"]:
            return
        event_type = EventType.RISK_ALERT if self._should_interrupt(perception) else EventType.AGENT_ANALYSIS
        await self.speak(
            insight,
            session_id=session_id,
            event_type=event_type,
            parent_id=event.get("id"),
            confidence=decision["confidence"],
            metadata={"participation_score": decision["score"]},
        )

    async def process_peer_insight(self, data: dict, perception: dict, session_id: str, event: Dict[str, str]) -> None:
        if data.get("role") == self.role:
            return
        research = await self.research(data, perception, session_id)

        # Allow broader debate; specialists should engage in discussion even when domain signals are weak,
        # as long as the statement is relevant and we can add new value.
        if perception["relevance"] < 0.2:
            return

        prompt = (
            f"You are {self.name}, the {self.role} in a startup boardroom.\n"
            f"Persona: {self.persona}\n"
            f"Discussion phase: {perception['phase']}\n"
            f"Peer {data.get('role')} ({data.get('agent_name')}) said: {data.get('content', '')}\n"
            f"Research findings: {research}\n"
            "Respond naturally in the boardroom. Address the peer by name if relevant, agree, disagree, or build on their point.\n"
            "Include a specific suggestion or question to advance the discussion.\n"
            "Keep it conversational, 2-3 sentences, like real experts debating."
        )
        insight = await self._generate_text(prompt, self._fallback_peer_insight(data))
        if insight.strip().upper() == "SILENCE":
            return
        decision = await self.decide_participation(perception, research, insight, session_id)
        if not decision["should_speak"]:
            return
        disagreement = any(token in insight.lower() for token in ("however", "but", "disagree", "risk", "challenge"))
        event_type = EventType.AGENT_CHALLENGE if disagreement else EventType.AGENT_ANALYSIS
        await self.speak(
            insight,
            session_id=session_id,
            event_type=event_type,
            parent_id=event.get("id"),
            confidence=decision["confidence"],
            metadata={"challenge": disagreement, "participation_score": decision["score"]},
        )


class CoreModeratorAgent(CognitiveAgent):
    def __init__(self):
        super().__init__("core")
        self.summary_interval = 4

    async def process_new_idea(self, data: str, perception: dict, session_id: str, event: Dict[str, str]) -> None:
        await storage.update_session_status(session_id, "analysis")
        await self.speak(
            "Boardroom initialized. Specialists will independently inspect market, product, finance, technology, and execution risk before converging on a decision.",
            session_id=session_id,
            event_type=EventType.STATUS_UPDATE,
            parent_id=event.get("id"),
            confidence=0.92,
        )

    async def process_peer_insight(self, data: dict, perception: dict, session_id: str, event: Dict[str, str]) -> None:
        messages = await storage.list_conversations(session_id)
        if len(messages) % self.summary_interval != 0:
            return

        consensus = evaluate_consensus(messages)
        summary = self._summarize(consensus)
        await self.speak(
            summary,
            session_id=session_id,
            event_type=EventType.STATUS_UPDATE,
            parent_id=event.get("id"),
            confidence=max(0.7, consensus["aggregate_confidence"]),
            metadata={"consensus": consensus},
        )

        if not consensus["consensus"]:
            return

        session = await storage.get_session(session_id)
        founder_id = session.get("founder_id") if session else "default-founder"
        decisions = await storage.list_decisions(session_id, founder_id)
        if decisions:
            return

        decision = await storage.save_decision(
            session_id=session_id,
            founder_id=founder_id,
            summary="Boardroom consensus reached. The system is ready to shift into execution planning.",
            confidence=consensus["aggregate_confidence"],
            consensus=consensus,
            status="execution_started",
        )
        await self.speak(
            "Consensus reached. Moving from validation into execution planning with specialist-owned next steps.",
            session_id=session_id,
            event_type=EventType.CONSENSUS_SIGNAL,
            confidence=consensus["aggregate_confidence"],
            metadata={"decision_id": decision["id"], "consensus": consensus},
        )

    def _summarize(self, consensus: Dict) -> str:
        supporters = ", ".join(consensus["supporting_agents"]) or "no specialists yet"
        blockers = ", ".join(consensus["critical_blockers"]) or "no critical blockers"
        return (
            f"Core moderation update: supporting roles currently include {supporters}. "
            f"Critical blockers: {blockers}. Aggregate confidence is {consensus['aggregate_confidence']:.2f}."
        )


class CEOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__("ceo")


class CTOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__("cto")


class CFOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__("cfo")


class CMOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__("cmo")


class ProductAgent(SpecialistAgent):
    def __init__(self):
        super().__init__("product")


class OpsAgent(SpecialistAgent):
    def __init__(self):
        super().__init__("ops")
