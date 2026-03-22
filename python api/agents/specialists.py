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
            f"Role: {self.persona}\n"
            f"Mode: {self.mode}\n"
            f"Discussion phase: {perception['phase']}\n"
            f"Founder idea: {data}\n"
            f"Research findings: {research}\n"
            f"Tone: professional realism.\n"
            f"Respond only from the {self.role} perspective.\n"
            "If you disagree with the likely direction, make that disagreement explicit and concrete.\n"
            "Keep the response concise and decision-useful."
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
        if not research.get("domain_signals") and perception["risk_pressure"] < 0.75:
            return
        prompt = (
            f"Role: {self.persona}\n"
            f"Mode: {self.mode}\n"
            f"Discussion phase: {perception['phase']}\n"
            f"Peer said: {data.get('content', '')}\n"
            f"Research findings: {research}\n"
            "Decide whether you should support, refine, or challenge the statement.\n"
            "Respond with SILENCE if there is no unique value to add."
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
            "Boardroom initialized. We are in strategic analysis mode. Specialists will examine strategy, market, product, risk, and execution before we move to a founder-confirmed decision.",
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
        if consensus["consensus"]:
            decision = await storage.save_decision(
                session_id,
                "Boardroom reached sufficient consensus to request founder confirmation for execution.",
                consensus["aggregate_confidence"],
                consensus,
                status="awaiting_founder",
            )
            await self.speak(
                "Consensus trend detected. Founder confirmation is recommended before entering execution mode.",
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
