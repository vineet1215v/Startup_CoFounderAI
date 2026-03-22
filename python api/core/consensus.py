from __future__ import annotations

from collections import defaultdict
from typing import Dict, List

from core.behavior import EXECUTION_CONDITIONS


SUPPORT_WORDS = ("agree", "priority", "recommend", "should", "focus", "ship", "mvp")
BLOCK_WORDS = ("blocker", "risk", "cannot", "should not", "unsafe", "too expensive", "not feasible")


def evaluate_consensus(messages: List[Dict]) -> Dict:
    support_agents = set()
    blocker_agents = set()
    weighted_confidence = 0.0
    confidence_count = 0
    role_messages = defaultdict(int)

    for message in messages:
        text = (message.get("content") or "").lower()
        role = message.get("role") or "UNKNOWN"
        role_messages[role] += 1
        if any(word in text for word in SUPPORT_WORDS):
            support_agents.add(role)
        if any(word in text for word in BLOCK_WORDS):
            blocker_agents.add(role)
        confidence = float(message.get("confidence", 0.0) or 0.0)
        if confidence > 0:
            weighted_confidence += confidence
            confidence_count += 1

    aggregate_confidence = weighted_confidence / confidence_count if confidence_count else 0.0
    supporting_agents = len(support_agents)
    critical_blockers = [role for role in blocker_agents if role in {"CFO", "CTO"}]
    consensus = (
        supporting_agents >= EXECUTION_CONDITIONS["minimum_supporting_agents"]
        and aggregate_confidence >= EXECUTION_CONDITIONS["consensus_confidence"]
        and not critical_blockers
    )

    return {
        "consensus": consensus,
        "supporting_agents": sorted(support_agents),
        "aggregate_confidence": round(aggregate_confidence, 3),
        "critical_blockers": critical_blockers,
        "message_distribution": dict(role_messages),
    }
