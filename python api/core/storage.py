from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import motor.motor_asyncio
from dotenv import load_dotenv

from core.embeddings import cosine_similarity, embed_text


load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "cofounder_ai")


class Storage:
    def __init__(self, uri: str = MONGO_URI, db_name: str = DB_NAME):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        self.db = self.client[db_name]

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    async def create_session(
        self,
        title: str,
        founder_context: str = "",
        founder_id: str = "default-founder",
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        session_id = session_id or str(uuid.uuid4())
        now = self._now_iso()
        session_doc = {
            "_id": session_id,
            "id": session_id,
            "founder_id": founder_id,
            "title": title,
            "status": "analysis",
            "founder_context": founder_context,
            "idea_text": founder_context,
            "consensus": None,
            "created_at": now,
            "updated_at": now,
        }
        await self.db.sessions.insert_one(session_doc)
        return session_doc

    async def list_sessions(self, founder_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"founder_id": founder_id} if founder_id else {}
        cursor = self.db.sessions.find(query).sort("updated_at", -1)
        return await cursor.to_list(length=200)

    async def get_session(self, session_id: str, founder_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query = {"_id": session_id}
        if founder_id:
            query["founder_id"] = founder_id
        return await self.db.sessions.find_one(query)

    async def update_session(self, session_id: str, updates: Dict[str, Any], founder_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query = {"_id": session_id}
        if founder_id:
            query["founder_id"] = founder_id
        await self.db.sessions.update_one(query, {"$set": {**updates, "updated_at": self._now_iso()}})
        return await self.get_session(session_id, founder_id)

    async def update_session_status(self, session_id: str, status: str, founder_id: Optional[str] = None) -> None:
        await self.update_session(session_id, {"status": status}, founder_id)

    async def add_conversation(
        self,
        session_id: str,
        content: str,
        founder_id: str = "default-founder",
        role: str = "",
        agent_name: str = "",
        message_type: str = "message",
        confidence: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
        event_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        now = self._now_iso()
        doc_id = str(uuid.uuid4())
        conv_doc = {
            "_id": doc_id,
            "id": doc_id,
            "session_id": session_id,
            "founder_id": founder_id,
            "event_id": event_id,
            "role": role,
            "agent_name": agent_name,
            "message_type": message_type,
            "content": content,
            "confidence": confidence,
            "metadata": metadata or {},
            "created_at": now,
        }
        await self.db.conversations.insert_one(conv_doc)
        await self.db.sessions.update_one({"_id": session_id}, {"$set": {"updated_at": now}})
        return conv_doc

    async def list_conversations(self, session_id: str, founder_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"session_id": session_id}
        if founder_id:
            query["founder_id"] = founder_id
        cursor = self.db.conversations.find(query).sort("created_at", 1)
        return await cursor.to_list(length=500)

    async def save_decision(
        self,
        session_id: str,
        founder_id: str,
        summary: str,
        confidence: float,
        consensus: Dict[str, Any],
        status: str = "pending",
    ) -> Dict[str, Any]:
        now = self._now_iso()
        doc_id = str(uuid.uuid4())
        decision_doc = {
            "_id": doc_id,
            "id": doc_id,
            "session_id": session_id,
            "founder_id": founder_id,
            "summary": summary,
            "confidence": confidence,
            "consensus": consensus,
            "status": status,
            "created_at": now,
        }
        await self.db.decisions.insert_one(decision_doc)
        await self.update_session(session_id, {"consensus": consensus}, founder_id)
        return decision_doc

    async def list_decisions(self, session_id: str, founder_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"session_id": session_id}
        if founder_id:
            query["founder_id"] = founder_id
        cursor = self.db.decisions.find(query).sort("created_at", 1)
        return await cursor.to_list(length=100)

    async def create_execution_task(
        self,
        session_id: str,
        founder_id: str,
        session_title: str,
        title: str,
        owner_role: str,
        status: str = "queued",
        priority: str = "medium",
        progress: int = 0,
        blocker: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        now = self._now_iso()
        doc_id = str(uuid.uuid4())
        task_doc = {
            "_id": doc_id,
            "id": doc_id,
            "session_id": session_id,
            "founder_id": founder_id,
            "session_title": session_title,
            "title": title,
            "owner_role": owner_role,
            "status": status,
            "priority": priority,
            "progress": progress,
            "blocker": blocker,
            "metadata": metadata or {},
            "created_at": now,
            "updated_at": now,
        }
        await self.db.execution_tasks.insert_one(task_doc)
        return task_doc

    async def list_execution_tasks(
        self,
        session_id: Optional[str] = None,
        founder_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if session_id:
            query["session_id"] = session_id
        if founder_id:
            query["founder_id"] = founder_id
        cursor = self.db.execution_tasks.find(query).sort("updated_at", -1)
        return await cursor.to_list(length=200)

    async def update_execution_task(self, task_id: str, founder_id: Optional[str], updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        query = {"_id": task_id}
        if founder_id:
            query["founder_id"] = founder_id
        await self.db.execution_tasks.update_one(query, {"$set": {**updates, "updated_at": self._now_iso()}})
        return await self.db.execution_tasks.find_one(query)

    async def store_memory(
        self,
        session_id: str,
        agent_role: str,
        memory_type: str,
        content: str,
        weight: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        now = self._now_iso()
        memory_doc = {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "agent_role": agent_role,
            "memory_type": memory_type,
            "content": content,
            "embedding": embed_text(content),
            "weight": weight,
            "metadata": metadata or {},
            "created_at": now,
        }
        await self.db.agent_memory.insert_one(memory_doc)

    async def search_memory(self, session_id: str, agent_role: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        query_embedding = embed_text(query)
        cursor = self.db.agent_memory.find({"session_id": session_id, "agent_role": agent_role}).sort("created_at", -1)
        docs = await cursor.to_list(length=100)

        scored = []
        for doc in docs:
            score = cosine_similarity(query_embedding, doc.get("embedding") or [])
            doc["similarity"] = round(score + float(doc.get("weight", 0.0)), 3)
            if "embedding" in doc:
                del doc["embedding"]
            scored.append(doc)

        return sorted(scored, key=lambda item: item["similarity"], reverse=True)[:limit]

    async def upsert_founder_profile(
        self,
        founder_id: str,
        risk_tolerance: float = 0.5,
        decision_style: str = "balanced",
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        update_doc = {
            "risk_tolerance": risk_tolerance,
            "decision_style": decision_style,
            "preferences": preferences or {},
            "updated_at": self._now_iso(),
        }
        await self.db.founder_profiles.update_one({"founder_id": founder_id}, {"$set": update_doc}, upsert=True)
        return await self.get_founder_profile(founder_id)

    async def get_founder_profile(self, founder_id: str) -> Dict[str, Any]:
        profile = await self.db.founder_profiles.find_one({"founder_id": founder_id})
        return profile or {
            "founder_id": founder_id,
            "risk_tolerance": 0.5,
            "decision_style": "balanced",
            "preferences": {},
        }

    async def record_metric(
        self,
        session_id: Optional[str],
        metric_key: str,
        metric_value: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        metric_doc = {
            "_id": str(uuid.uuid4()),
            "session_id": session_id,
            "metric_key": metric_key,
            "metric_value": metric_value,
            "metadata": metadata or {},
            "created_at": self._now_iso(),
        }
        await self.db.analytics.insert_one(metric_doc)

    async def analytics_summary(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        pipeline = []
        if session_id:
            pipeline.append({"$match": {"session_id": session_id}})

        pipeline.append(
            {
                "$group": {
                    "_id": "$metric_key",
                    "avg": {"$avg": "$metric_value"},
                    "events": {"$sum": 1},
                }
            }
        )

        cursor = self.db.analytics.aggregate(pipeline)
        results = await cursor.to_list(length=100)
        return {result["_id"]: {"avg": round(result["avg"], 3), "events": result["events"]} for result in results}

    async def add_notification(
        self,
        session_id: Optional[str],
        level: str,
        title: str,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        notif_doc = {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "level": level,
            "title": title,
            "body": body,
            "metadata": metadata or {},
            "created_at": self._now_iso(),
        }
        await self.db.notifications.insert_one(notif_doc)
        return notif_doc

    async def list_notifications(self, session_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        query = {"session_id": session_id} if session_id else {}
        cursor = self.db.notifications.find(query).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def store_artifact(
        self,
        session_id: str,
        artifact_type: str,
        title: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        artifact_doc = {
            "_id": str(uuid.uuid4()),
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "artifact_type": artifact_type,
            "title": title,
            "content": content,
            "metadata": metadata or {},
            "created_at": self._now_iso(),
        }
        await self.db.artifacts.insert_one(artifact_doc)
        return artifact_doc

    async def list_artifacts(self, session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        cursor = self.db.artifacts.find({"session_id": session_id}).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)


storage = Storage()
