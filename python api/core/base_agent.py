from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from core.behavior import AGENT_PROFILES, DISCUSSION_PHASES, INTERRUPTION_PRIORITY, PPM_WEIGHTS
from core.bus import EventType, bus
from core.storage import storage


class CognitiveAgent(ABC):
    def __init__(self, profile_key: str):
        profile = AGENT_PROFILES[profile_key]
        self.profile_key = profile_key
        self.agent_id = profile.agent_id
        self.name = profile.name
        self.role = profile.role
        self.color = profile.color
        self.persona = profile.persona
        self.domain_keywords = [keyword.lower() for keyword in profile.expertise]
        self.mode = "analysis"
        self.participation_threshold = profile.base_threshold
        self.recent_speaking_penalty = 0.0
        self.memory: List[Dict[str, Any]] = []
        self.last_research: Dict[str, Any] = {}
        self.reliability = 0.72
        self.background_hypotheses: List[Dict[str, Any]] = []
        self.turn_count = 0

    async def initialize(self) -> None:
        bus.subscribe(self.on_event)

    async def on_event(self, event: Dict[str, Any]) -> None:
        event_type = event["type"]
        data = event["data"]
        session_id = event.get("session_id", "default")
        perception = await self.perceive(event)
        await self.remember("perception", {"event_type": event_type, "perception": perception}, session_id)

        if event_type == EventType.EXECUTION_MODE.value:
            self.mode = "execution"
            await storage.update_session_status(session_id, "execution")
            return

        if perception["relevance"] < 0.2:
            await self.background_think(data, perception, session_id)
            return

        if event_type == EventType.IDEA_PROPOSED.value:
            self.turn_count += 1
            await self.process_new_idea(data, perception, session_id, event)
            return

        if event_type == EventType.AGENT_ANALYSIS.value and data.get("agent_id") != self.agent_id:
            await self.process_peer_insight(data, perception, session_id, event)
            return

    async def perceive(self, event: Dict[str, Any]) -> Dict[str, Any]:
        event_type = event["type"]
        data = event["data"]
        text = self._extract_text(data).lower()
        keyword_hits = sum(1 for keyword in self.domain_keywords if keyword in text)
        relevance = min(1.0, 0.3 + (keyword_hits * 0.18))
        if event_type == EventType.IDEA_PROPOSED.value:
            relevance = max(relevance, 0.82)
        urgency = 0.85 if any(token in text for token in ("urgent", "now", "immediately", "critical")) else 0.42
        risk_pressure = 0.9 if any(token in text for token in ("risk", "runway", "compliance", "security")) else 0.35
        intent = "analysis"
        if any(token in text for token in ("launch", "ship", "execute", "timeline")):
            intent = "execution"
        elif risk_pressure > 0.7:
            intent = "risk"
        elif any(token in text for token in ("market", "customer", "positioning")):
            intent = "market"
        return {
            "topic": text[:200],
            "intent": intent,
            "keyword_hits": keyword_hits,
            "relevance": relevance,
            "urgency": urgency,
            "risk_pressure": risk_pressure,
            "phase": self._discussion_phase(),
        }

    async def research(self, context: Any, perception: Dict[str, Any], session_id: str) -> Dict[str, Any]:
        text = self._extract_text(context).lower()
        memory_hits = await storage.search_memory(session_id, self.role, text, limit=3)
        domain_signals = [keyword for keyword in self.domain_keywords if keyword in text][:6]
        confidence = self._confidence_score(domain_signals, memory_hits, perception)
        findings = {
            "domain_signals": domain_signals,
            "memory_hits": memory_hits,
            "confidence": confidence,
            "intent": perception["intent"],
            "mode": self.mode,
            "phase": perception["phase"],
        }
        self.last_research = findings
        await self.remember("research", findings, session_id)
        return findings

    async def decide_participation(
        self,
        perception: Dict[str, Any],
        research: Dict[str, Any],
        candidate_insight: str,
        session_id: str,
    ) -> Dict[str, Any]:
        relevance = perception["relevance"]
        novelty = self._novelty_score(candidate_insight)
        confidence = research.get("confidence", 0.55)
        urgency = perception["urgency"]
        saturation_penalty = min(0.2, max(0, len(self.memory) - 24) * 0.01)
        cooldown_penalty = self.recent_speaking_penalty
        expertise = min(1.0, 0.45 + (0.1 * len(research.get("domain_signals", []))))
        phase_fit = self._phase_fit_score(perception["phase"], perception["intent"])

        score = (
            PPM_WEIGHTS["relevance"] * relevance
            + PPM_WEIGHTS["novelty"] * novelty
            + PPM_WEIGHTS["confidence"] * confidence
            + PPM_WEIGHTS["urgency"] * urgency
            + PPM_WEIGHTS["phase_fit"] * phase_fit
            + PPM_WEIGHTS["expertise"] * expertise
            + PPM_WEIGHTS["cooldown"] * cooldown_penalty
            + PPM_WEIGHTS["saturation"] * saturation_penalty
        )
        threshold = self._dynamic_threshold(perception)
        should_speak = score >= threshold and not self._should_stay_silent(perception, novelty, confidence)
        decision = {
            "should_speak": should_speak,
            "score": round(score, 3),
            "threshold": round(threshold, 3),
            "confidence": confidence,
            "phase": perception["phase"],
            "novelty": round(novelty, 3),
        }
        await self.remember("decision", decision, session_id)
        await bus.publish(
            EventType.PARTICIPATION_UPDATE,
            {"agent_id": self.agent_id, "agent_name": self.name, "role": self.role, **decision},
            session_id=session_id,
            source=self.role,
        )
        await storage.record_metric(session_id, f"participation_{self.role.lower()}", score, decision)
        return decision

    async def speak(
        self,
        content: str,
        session_id: str,
        event_type: EventType = EventType.AGENT_ANALYSIS,
        parent_id: Optional[str] = None,
        confidence: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        # Keep the discussion flowing. Lower speaking penalty and increase recovery speed.
        self.recent_speaking_penalty = min(0.4, self.recent_speaking_penalty + 0.12)
        payload = {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "role": self.role,
            "content": content,
            "color": self.color,
            "mode": self.mode,
            "confidence": round(confidence or 0.0, 3),
            "phase": self._discussion_phase(),
            "interruption_priority": INTERRUPTION_PRIORITY.get(self.profile_key, 50),
            "metadata": metadata or {},
        }
        await self.remember("statement", payload, session_id)
        event = await bus.publish(
            event_type,
            payload,
            session_id=session_id,
            source=self.role,
            parent_id=parent_id,
            priority=payload["interruption_priority"],
        )

        session = await storage.get_session(session_id)
        founder_id = session.get("founder_id") if session else "default-founder"
        await storage.add_conversation(
            session_id,
            content,
            founder_id=founder_id,
            role=self.role,
            agent_name=self.name,
            message_type=event_type.value,
            confidence=payload["confidence"],
            metadata=payload,
            event_id=event["id"],
        )
        asyncio.create_task(self.cool_down())

    async def background_think(self, context: Any, perception: Dict[str, Any], session_id: str) -> None:
        hypothesis = {
            "topic": self._extract_text(context)[:160],
            "phase": perception["phase"],
            "intent": perception["intent"],
        }
        self.background_hypotheses.append(hypothesis)
        self.background_hypotheses = self.background_hypotheses[-8:]
        await bus.publish(
            EventType.BACKGROUND_THOUGHT,
            {"agent_name": self.name, "role": self.role, "hypothesis": hypothesis},
            session_id=session_id,
            source=self.role,
        )

    async def cool_down(self) -> None:
        # Allow multiple follow-ups in the same discussion window by accelerating recovery.
        await asyncio.sleep(4)
        self.recent_speaking_penalty = max(0.0, self.recent_speaking_penalty - 0.08)

    async def remember(self, memory_type: str, data: Dict[str, Any], session_id: str) -> None:
        self.memory.append({"type": memory_type, "data": data, "ts": asyncio.get_event_loop().time()})
        self.memory = self.memory[-60:]
        await storage.store_memory(
            session_id=session_id,
            agent_role=self.role,
            memory_type=memory_type,
            content=self._extract_text(data),
            weight=data.get("confidence", 0.0) if isinstance(data, dict) else 0.0,
            metadata=data if isinstance(data, dict) else {"value": str(data)},
        )

    def _novelty_score(self, insight: str) -> float:
        if not insight:
            return 0.0
        recent_text = " ".join(self._extract_text(memory["data"]).lower() for memory in self.memory[-8:])
        overlap = sum(1 for token in insight.lower().split()[:30] if token in recent_text)
        return max(0.2, 1.0 - (overlap / 26.0))

    def _confidence_score(self, domain_signals: List[str], memory_hits: List[Dict[str, Any]], perception: Dict[str, Any]) -> float:
        base = 0.38 + (len(domain_signals) * 0.08)
        memory_support = min(0.18, len(memory_hits) * 0.05)
        reliability = self.reliability * 0.18
        pressure = 0.08 if perception["intent"] == "risk" and self.role in {"CFO", "CTO"} else 0.0
        return round(min(0.96, base + memory_support + reliability + pressure), 3)

    def _dynamic_threshold(self, perception: Dict[str, Any]) -> float:
        threshold = self.participation_threshold
        if perception["phase"] == "late":
            threshold += 0.05
        if perception["intent"] == "risk" and self.role in {"CFO", "CTO"}:
            threshold -= 0.08
        if self.mode == "execution":
            threshold -= 0.03
        return max(0.42, min(0.82, threshold))

    def _discussion_phase(self) -> str:
        if self.turn_count <= DISCUSSION_PHASES["early"]["max_turns"]:
            return "early"
        if self.turn_count <= DISCUSSION_PHASES["middle"]["max_turns"]:
            return "middle"
        return "late"

    def _phase_fit_score(self, phase: str, intent: str) -> float:
        if phase == "early" and intent in {"analysis", "market"}:
            return 0.82
        if phase == "middle":
            return 0.76
        if phase == "late" and intent in {"execution", "risk"}:
            return 0.90
        return 0.62

    def _should_stay_silent(self, perception: Dict[str, Any], novelty: float, confidence: float) -> bool:
        if perception["relevance"] < 0.28:
            return True
        if novelty < 0.32 and confidence < 0.7:
            return True

        # In early and middle discussion phases, encourage sustained debate even when agents have spoken recently.
        if perception["phase"] in {"early", "middle"}:
            if self.recent_speaking_penalty > 0.45 and perception["urgency"] < 0.75:
                return True
            return False

        # In late phase, apply stronger throttling to avoid repetitive noise.
        if self.recent_speaking_penalty > 0.28 and perception["urgency"] < 0.75:
            return True
        return False

    def _extract_text(self, data: Any) -> str:
        if isinstance(data, str):
            return data
        if isinstance(data, dict):
            for key in ("content", "idea", "summary", "topic", "payload", "title"):
                if key in data and isinstance(data[key], str):
                    return data[key]
            return " ".join(str(value) for value in data.values() if isinstance(value, str))
        return str(data)

    @abstractmethod
    async def process_new_idea(self, data: Any, perception: Dict[str, Any], session_id: str, event: Dict[str, Any]) -> None:
        raise NotImplementedError

    @abstractmethod
    async def process_peer_insight(self, data: Dict[str, Any], perception: Dict[str, Any], session_id: str, event: Dict[str, Any]) -> None:
        raise NotImplementedError
