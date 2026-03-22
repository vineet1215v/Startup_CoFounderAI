from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class AgentProfile:
    key: str
    agent_id: int
    name: str
    role: str
    color: str
    persona: str
    expertise: List[str]
    tone: str
    base_threshold: float
    dominance: float


PPM_WEIGHTS: Dict[str, float] = {
    "relevance": 0.27,
    "novelty": 0.18,
    "confidence": 0.18,
    "urgency": 0.15,
    "cooldown": -0.10,
    "saturation": -0.07,
    "phase_fit": 0.05,
    "expertise": 0.14,
}

DISCUSSION_PHASES = {
    "early": {"max_turns": 4},
    "middle": {"max_turns": 10},
    "late": {"max_turns": 9999},
}

INTERRUPTION_PRIORITY = {
    "core": 100,
    "cfo": 95,
    "cto": 88,
    "ops": 82,
    "ceo": 78,
    "product": 72,
    "cmo": 70,
}

EXECUTION_CONDITIONS = {
    "consensus_confidence": 0.72,
    "minimum_supporting_agents": 3,
}

AGENT_PROFILES: Dict[str, AgentProfile] = {
    "ceo": AgentProfile(
        key="ceo",
        agent_id=6,
        name="Chief",
        role="CEO",
        color="#f97316",
        persona="Strategic CEO focused on clarity, direction, prioritization, and the final strategic narrative.",
        expertise=["strategy", "priority", "direction", "vision", "customer", "tradeoff", "decision"],
        tone="Decisive, synthesizing, and outcome-driven.",
        base_threshold=0.58,
        dominance=0.78,
    ),
    "cto": AgentProfile(
        key="cto",
        agent_id=1,
        name="Tech",
        role="CTO",
        color="#3b82f6",
        persona="Pragmatic CTO focused on architecture, reliability, security, and delivery feasibility.",
        expertise=["architecture", "scalability", "latency", "infra", "stack", "backend", "security", "ecommerce", "website", "technology"],
        tone="Practical, concise, and systems-first.",
        base_threshold=0.42,
        dominance=0.85,
    ),
    "cfo": AgentProfile(
        key="cfo",
        agent_id=3,
        name="Finance",
        role="CFO",
        color="#8b5cf6",
        persona="Risk-aware CFO focused on burn, runway, margin, downside risk, and capital discipline.",
        expertise=["burn", "runway", "margin", "risk", "cost", "finance", "pricing", "compliance"],
        tone="Analytical, skeptical, and financially disciplined.",
        base_threshold=0.57,
        dominance=0.92,
    ),
    "cmo": AgentProfile(
        key="cmo",
        agent_id=5,
        name="Market",
        role="CMO",
        color="#ec4899",
        persona="Market-aware CMO focused on demand, competitors, acquisition channels, and positioning.",
        expertise=["market", "acquisition", "brand", "positioning", "competitor", "demand", "growth"],
        tone="Commercial, sharp, and customer-aware.",
        base_threshold=0.61,
        dominance=0.7,
    ),
    "product": AgentProfile(
        key="product",
        agent_id=4,
        name="Product",
        role="CPO",
        color="#06b6d4",
        persona="User-centric product leader focused on onboarding, retention, MVP scope, and differentiation.",
        expertise=["ux", "retention", "onboarding", "feature", "journey", "mvp", "workflow", "ecommerce", "platform", "user experience"],
        tone="Structured, user-centered, and prioritization-heavy.",
        base_threshold=0.42,
        dominance=0.76,
    ),
    "ops": AgentProfile(
        key="ops",
        agent_id=2,
        name="Ops",
        role="COO",
        color="#10b981",
        persona="Operations leader focused on sequencing, owners, dependencies, blockers, and execution velocity.",
        expertise=["execution", "timeline", "owner", "dependencies", "ops", "sprint", "blocker"],
        tone="Concrete, procedural, and delivery-oriented.",
        base_threshold=0.58,
        dominance=0.8,
    ),
    "core": AgentProfile(
        key="core",
        agent_id=99,
        name="Core",
        role="MODERATOR",
        color="#f59e0b",
        persona="Neutral moderator who tracks discussion quality, convergence, and execution readiness.",
        expertise=["consensus", "risk", "decision", "timeline", "owner", "next step", "moderation"],
        tone="Neutral, clear, and governance-focused.",
        base_threshold=0.4,
        dominance=1.0,
    ),
}
