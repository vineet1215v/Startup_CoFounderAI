import asyncio
import random
from abc import ABC, abstractmethod
from typing import Any, Dict, List

from core.bus import EventType, bus


class CognitiveAgent(ABC):
    def __init__(
        self,
        agent_id: int,
        name: str,
        role: str,
        color: str,
        persona: str,
        domain_keywords: List[str],
    ):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.color = color
        self.persona = persona
        self.domain_keywords = [k.lower() for k in domain_keywords]
        self.mode = "analysis"
        self.participation_threshold = 0.62
        self.recent_speaking_penalty = 0.0
        self.memory: List[Dict[str, Any]] = []
        self.last_research: Dict[str, Any] = {}

    async def initialize(self):
        bus.subscribe(self.on_event)

    async def on_event(self, event: Dict[str, Any]):
        event_type = event["type"]
        data = event["data"]
        perception = await self.perceive(event)
        self.remember("perception", {"event_type": event_type, "perception": perception})

        if perception["relevance"] < 0.25:
            return

        if event_type == EventType.EXECUTION_MODE.value:
            self.mode = "execution"
            return

        if event_type == EventType.IDEA_PROPOSED.value:
            await self.process_new_idea(data, perception)
            return

        if event_type == EventType.AGENT_ANALYSIS.value and data.get("agent_id") != self.agent_id:
            await self.process_peer_insight(data, perception)

    async def perceive(self, event: Dict[str, Any]) -> Dict[str, Any]:
        event_type = event["type"]
        data = event["data"]
        text = self._extract_text(data).lower()
        keyword_hits = sum(1 for k in self.domain_keywords if k in text)
        relevance = min(1.0, 0.2 + (keyword_hits * 0.25))
        intent = "analysis"
        if any(token in text for token in ("risk", "burn", "cost", "compliance")):
            intent = "risk"
        if any(token in text for token in ("launch", "ship", "execute", "timeline")):
            intent = "execution"
        if event_type == EventType.IDEA_PROPOSED.value:
            relevance = max(relevance, 0.6)
        return {
            "topic": text[:200],
            "intent": intent,
            "keyword_hits": keyword_hits,
            "relevance": relevance,
            "urgency": 0.8 if "urgent" in text or "now" in text else 0.45,
        }

    async def research(self, context: Any, perception: Dict[str, Any]) -> Dict[str, Any]:
        text = self._extract_text(context).lower()
        competitors = []
        if "ecommerce" in text or "e-commerce" in text:
            competitors = ["Shopify", "WooCommerce", "BigCommerce"]
        findings = {
            "domain_signals": [k for k in self.domain_keywords if k in text][:5],
            "competitors": competitors,
            "confidence": 0.65 if competitors else 0.55,
            "intent": perception["intent"],
            "mode": self.mode,
        }
        self.last_research = findings
        self.remember("research", findings)
        return findings

    async def decide_participation(
        self,
        perception: Dict[str, Any],
        research: Dict[str, Any],
        candidate_insight: str,
    ) -> Dict[str, Any]:
        relevance = perception["relevance"]
        novelty = self._novelty_score(candidate_insight)
        expertise = min(1.0, 0.45 + (0.12 * len(research.get("domain_signals", []))))
        confidence = research.get("confidence", 0.55)
        urgency = perception["urgency"]
        saturation_penalty = 0.15 if len(self.memory) > 24 else 0.0
        cooldown_penalty = self.recent_speaking_penalty
        noise = random.uniform(-0.03, 0.03)
        score = (
            0.27 * relevance
            + 0.23 * novelty
            + 0.2 * expertise
            + 0.15 * confidence
            + 0.15 * urgency
            - saturation_penalty
            - cooldown_penalty
            + noise
        )
        should_speak = score >= self.participation_threshold
        decision = {
            "should_speak": should_speak,
            "score": round(score, 3),
            "threshold": self.participation_threshold,
        }
        self.remember("decision", decision)
        return decision

    async def speak(self, content: str, event_type: EventType = EventType.AGENT_ANALYSIS):
        self.recent_speaking_penalty = min(0.5, self.recent_speaking_penalty + 0.2)
        payload = {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "role": self.role,
            "content": content,
            "color": self.color,
            "mode": self.mode,
        }
        self.remember("statement", payload)
        await bus.publish(event_type, payload)
        asyncio.create_task(self.cool_down())

    async def cool_down(self):
        await asyncio.sleep(8)
        self.recent_speaking_penalty = max(0.0, self.recent_speaking_penalty - 0.15)

    def remember(self, memory_type: str, data: Dict[str, Any]):
        self.memory.append({"type": memory_type, "data": data, "ts": asyncio.get_event_loop().time()})
        if len(self.memory) > 60:
            self.memory.pop(0)

    def _novelty_score(self, insight: str) -> float:
        if not insight:
            return 0.0
        recent_text = " ".join(self._extract_text(m["data"]).lower() for m in self.memory[-8:])
        overlap = sum(1 for token in insight.lower().split()[:30] if token in recent_text)
        return max(0.2, 1.0 - (overlap / 30.0))

    def _extract_text(self, data: Any) -> str:
        if isinstance(data, str):
            return data
        if isinstance(data, dict):
            for key in ("content", "idea", "summary", "topic", "payload"):
                if key in data and isinstance(data[key], str):
                    return data[key]
            return " ".join(str(v) for v in data.values() if isinstance(v, str))
        return str(data)

    @abstractmethod
    async def process_new_idea(self, data: Any, perception: Dict[str, Any]):
        pass

    @abstractmethod
    async def process_peer_insight(self, data: Any, perception: Dict[str, Any]):
        pass
