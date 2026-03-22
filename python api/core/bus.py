from __future__ import annotations

import asyncio
import json
import os
import uuid
from enum import Enum
from typing import Any, Awaitable, Callable, Dict, List, Optional

try:
    import redis.asyncio as redis
except Exception:
    redis = None


class EventType(Enum):
    IDEA_PROPOSED = "IDEA_PROPOSED"
    AGENT_ANALYSIS = "AGENT_ANALYSIS"
    AGENT_CHALLENGE = "AGENT_CHALLENGE"
    RISK_ALERT = "RISK_ALERT"
    CONSENSUS_SIGNAL = "CONSENSUS_SIGNAL"
    EXECUTION_MODE = "EXECUTION_MODE"
    STATUS_UPDATE = "STATUS_UPDATE"
    PARTICIPATION_UPDATE = "PARTICIPATION_UPDATE"
    TASK_UPDATE = "TASK_UPDATE"
    BACKGROUND_THOUGHT = "BACKGROUND_THOUGHT"
    MEMORY_UPDATE = "MEMORY_UPDATE"
    FOUNDER_PREFERENCE = "FOUNDER_PREFERENCE"


Callback = Callable[[Dict[str, Any]], Awaitable[None]]


class EventBus:
    def __init__(self) -> None:
        self.subscribers: List[Callback] = []
        self.sequence = 0
        self.redis_url = os.getenv("REDIS_URL", "").strip()
        self.redis_client = None

    async def initialize(self) -> None:
        if self.redis_url and redis is not None:
            try:
                self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
                await self.redis_client.ping()
            except Exception:
                self.redis_client = None

    def subscribe(self, callback: Callback) -> None:
        self.subscribers.append(callback)

    def unsubscribe(self, callback: Callback) -> None:
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    async def publish(
        self,
        event_type: EventType,
        data: Any,
        session_id: str = "default",
        source: str = "system",
        parent_id: Optional[str] = None,
        priority: int = 0,
    ) -> Dict[str, Any]:
        self.sequence += 1
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type.value,
            "session_id": session_id,
            "sequence": self.sequence,
            "timestamp": asyncio.get_event_loop().time(),
            "priority": priority,
            "source": source,
            "parent_id": parent_id,
            "data": data,
        }
        if self.redis_client:
            try:
                await self.redis_client.publish(f"boardroom:{session_id}", json.dumps(event))
            except Exception:
                pass

        tasks = [self._safe_callback(callback, event) for callback in self.subscribers[:]]
        if tasks:
            await asyncio.gather(*tasks)
        return event

    async def _safe_callback(self, callback: Callback, event: Dict[str, Any]) -> None:
        try:
            await callback(event)
        except Exception as exc:
            cb_name = callback.__name__ if hasattr(callback, "__name__") else "unknown"
            print(f"Callback Error in {cb_name}: {exc}")


bus = EventBus()
