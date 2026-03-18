import asyncio
from enum import Enum
from typing import List, Callable, Any

class EventType(Enum):
    IDEA_PROPOSED = "IDEA_PROPOSED"
    AGENT_ANALYSIS = "AGENT_ANALYSIS"
    CHALLENGE = "CHALLENGE"
    RISK_ALERT = "RISK_ALERT"
    CONSENSUS_SIGNAL = "CONSENSUS_SIGNAL"
    EXECUTION_MODE = "EXECUTION_MODE"
    STATUS_UPDATE = "STATUS_UPDATE"

class EventBus:
    def __init__(self):
        self.subscribers: List[Callable] = []

    def subscribe(self, callback: Callable):
        self.subscribers.append(callback)

    def unsubscribe(self, callback: Callable):
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    async def publish(self, event_type: EventType, data: Any):
        event = {
            "type": event_type.value,
            "data": data,
            "timestamp": asyncio.get_event_loop().time()
        }
        print(f"[EventBus] Publishing: {event_type.value}")
        
        # Concurrent fan-out so no single agent blocks the boardroom.
        tasks = [self._safe_callback(callback, event) for callback in self.subscribers[:]]
        if tasks:
            await asyncio.gather(*tasks)

    async def _safe_callback(self, callback: Callable, event: dict):
        try:
            await callback(event)
        except Exception as e:
            cb_name = callback.__name__ if hasattr(callback, "__name__") else "unknown"
            print(f"Callback Error in {cb_name}: {e}")

# Global bus instance for internal communication
bus = EventBus()
