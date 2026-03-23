from __future__ import annotations

import json
import os
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.specialists import CEOAgent, CFOAgent, CMOAgent, CTOAgent, CoreModeratorAgent, OpsAgent, ProductAgent
from core.bus import EventType, bus
from core.openrouter_client import describe_image
from core.storage import storage


def safe_title(text: str) -> str:
    cleaned = " ".join((text or "").split())
    return cleaned[:72] if cleaned else "Untitled Session"


def normalize_founder_id(founder_id: Optional[str]) -> str:
    return (founder_id or "default-founder").strip() or "default-founder"


class SessionCreateRequest(BaseModel):
    title: Optional[str] = None
    founder_context: str = ""
    ideaText: Optional[str] = None
    founder_id: str = "default-founder"


class TaskUpdateRequest(BaseModel):
    founder_id: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None


class FounderPreferenceRequest(BaseModel):
    founder_id: str
    risk_tolerance: float = 0.5
    decision_style: str = "balanced"
    preferences: dict = {}


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_URL", "*"), "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

agents = [
    CoreModeratorAgent(),
    CEOAgent(),
    CTOAgent(),
    CMOAgent(),
    ProductAgent(),
    CFOAgent(),
    OpsAgent(),
]


def serialize_message(message: Dict) -> Dict:
    return {
        "id": message["id"],
        "role": message.get("role", ""),
        "agent_name": message.get("agent_name", ""),
        "content": message.get("content", ""),
        "message_type": message.get("message_type", "message"),
        "metadata": message.get("metadata", {}),
        "created_at": message.get("created_at"),
        "confidence": message.get("confidence", 0),
    }


def serialize_task(task: Dict) -> Dict:
    return {
        "id": task["id"],
        "session_id": task.get("session_id"),
        "session_title": task.get("session_title", ""),
        "title": task.get("title", ""),
        "owner_role": task.get("owner_role", ""),
        "status": task.get("status", "queued"),
        "priority": task.get("priority", "medium"),
        "created_at": task.get("created_at"),
        "updated_at": task.get("updated_at"),
    }


async def serialize_session(session: Dict) -> Dict:
    founder_id = session.get("founder_id")
    conversations = await storage.list_conversations(session["id"], founder_id)
    decisions = await storage.list_decisions(session["id"], founder_id)
    latest_decision = decisions[-1] if decisions else None

    roles = []
    seen_roles = set()
    for item in conversations:
        role = item.get("role")
        if role and role not in {"FOUNDER", "MODERATOR"} and role not in seen_roles:
            seen_roles.add(role)
            roles.append(role)

    return {
        "id": session["id"],
        "title": session.get("title", "Untitled Session"),
        "idea_text": session.get("idea_text") or session.get("founder_context", ""),
        "context": session.get("founder_context", ""),
        "status": session.get("status", "analysis"),
        "verdict": round(float(latest_decision["confidence"]) * 10, 1) if latest_decision else None,
        "agents": roles,
        "activity": session.get("updated_at"),
        "consensus": latest_decision.get("consensus") if latest_decision else session.get("consensus"),
        "founder_id": founder_id,
    }


async def session_bundle(session_id: str, founder_id: str) -> Dict:
    session = await storage.get_session(session_id, founder_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    history = await storage.list_conversations(session_id, founder_id)
    tasks = await storage.list_execution_tasks(session_id=session_id, founder_id=founder_id)
    return {
        "session": await serialize_session(session),
        "history": [serialize_message(item) for item in history],
        "tasks": [serialize_task(item) for item in tasks],
    }


async def seed_execution_plan(session_id: str, founder_id: str) -> Dict:
    existing_tasks = await storage.list_execution_tasks(session_id=session_id, founder_id=founder_id)
    if existing_tasks:
        return {"tasks": [serialize_task(task) for task in existing_tasks]}

    session = await storage.get_session(session_id, founder_id)
    if not session:
        return {"tasks": []}

    session_title = session.get("title", "Startup Session")
    created_tasks = [
        await storage.create_execution_task(
            session_id=session_id,
            founder_id=founder_id,
            session_title=session_title,
            title="Validate the strongest customer pain point with 10 founder interviews",
            owner_role="CPO",
            status="active",
            priority="high",
        ),
        await storage.create_execution_task(
            session_id=session_id,
            founder_id=founder_id,
            session_title=session_title,
            title="Define the MVP system architecture and first delivery milestones",
            owner_role="CTO",
            priority="high",
        ),
        await storage.create_execution_task(
            session_id=session_id,
            founder_id=founder_id,
            session_title=session_title,
            title="Model runway, pricing assumptions, and first revenue checkpoints",
            owner_role="CFO",
            priority="medium",
        ),
        await storage.create_execution_task(
            session_id=session_id,
            founder_id=founder_id,
            session_title=session_title,
            title="Build channel positioning and launch sequencing for the initial wedge",
            owner_role="CMO",
            priority="medium",
        ),
        await storage.create_execution_task(
            session_id=session_id,
            founder_id=founder_id,
            session_title=session_title,
            title="Map execution dependencies, owners, and the first two operating sprints",
            owner_role="COO",
            priority="medium",
        ),
    ]
    return {"tasks": [serialize_task(task) for task in created_tasks]}


async def system_event_recorder(event: Dict):
    session_id = event.get("session_id")
    event_type = event.get("type")
    data = event.get("data") or {}
    session = await storage.get_session(session_id) if session_id else None
    founder_id = session.get("founder_id") if session else "default-founder"

    if event_type == EventType.RISK_ALERT.value:
        await storage.add_notification(session_id, "risk", f"{data.get('role', 'Agent')} raised a risk alert", data.get("content", ""), data)
    elif event_type == EventType.CONSENSUS_SIGNAL.value:
        await storage.add_notification(session_id, "consensus", "Consensus signal detected", data.get("content", ""), data)
        await storage.store_artifact(session_id, "decision-brief", "Consensus Brief", data.get("content", ""), data)
        if session:
            await storage.update_session_status(session_id, "execution", founder_id)
            await storage.update_session(session_id, {"consensus": (data.get("metadata") or {}).get("consensus")}, founder_id)
            task_payload = await seed_execution_plan(session_id, founder_id)
            await bus.publish(EventType.EXECUTION_MODE, {"activated_by": "consensus"}, session_id=session_id, source="SYSTEM")
            await bus.publish(EventType.TASK_UPDATE, task_payload, session_id=session_id, source="SYSTEM")
    elif event_type == EventType.TASK_UPDATE.value:
        await storage.add_notification(session_id, "execution", "Execution tasks updated", "Task board changed in execution mode.", data)


@app.on_event("startup")
async def startup_event():
    await bus.initialize()
    bus.subscribe(system_event_recorder)
    for agent in agents:
        await agent.initialize()


@app.get("/")
async def root():
    return {"status": "CoFounder AI Boardroom Engine Running"}


@app.get("/healthz")
async def healthz():
    return {"status": "ok", "services": {"event_bus": "ready", "storage": "ready", "agents": len(agents)}}


@app.get("/api/vault/summary")
async def idea_vault_summary(founder_id: str = Query(default="default-founder")):
    founder_id = normalize_founder_id(founder_id)
    sessions = await storage.list_sessions(founder_id)
    vault_data = []

    for session in sessions:
        decisions = await storage.list_decisions(session["id"], founder_id)
        latest_decision = decisions[-1] if decisions else None
        conversations = await storage.list_conversations(session["id"], founder_id)
        roles = list({item["role"] for item in conversations if item.get("role") not in {"FOUNDER", "MODERATOR"}})[:5]
        status = session.get("status", "analysis")
        if latest_decision and status == "analysis":
            status = "validated" if latest_decision["confidence"] >= 0.8 else "analyzing"

        vault_data.append(
            {
                "id": session["id"],
                "title": session.get("title", "Untitled Session"),
                "verdict": round(latest_decision["confidence"] * 10, 1) if latest_decision else None,
                "status": status,
                "agents": roles,
                "activity": session.get("updated_at"),
                "context": session.get("founder_context", ""),
            }
        )

    return vault_data


@app.get("/api/sessions")
async def list_sessions(founder_id: str = Query(default="default-founder")):
    founder_id = normalize_founder_id(founder_id)
    sessions = await storage.list_sessions(founder_id)
    return [await serialize_session(session) for session in sessions]


@app.post("/api/sessions")
async def create_session(payload: SessionCreateRequest):
    founder_id = normalize_founder_id(payload.founder_id)
    founder_context = (payload.ideaText or payload.founder_context or "").strip()
    title = (payload.title or safe_title(founder_context)).strip()
    session = await storage.create_session(title=title, founder_context=founder_context, founder_id=founder_id)
    await storage.add_notification(session["id"], "system", "Session created", f"New session '{title}' is ready.", session)
    return await session_bundle(session["id"], founder_id)


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, founder_id: str = Query(default="default-founder")):
    return await session_bundle(session_id, normalize_founder_id(founder_id))


@app.get("/api/tasks/global")
async def global_tasks_summary(founder_id: str = Query(default="default-founder")):
    tasks = await storage.list_execution_tasks(founder_id=normalize_founder_id(founder_id))
    return sorted([serialize_task(task) for task in tasks], key=lambda item: (item["status"] == "active", item["updated_at"]), reverse=True)


@app.patch("/api/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskUpdateRequest):
    founder_id = normalize_founder_id(payload.founder_id)
    updates = {}
    if payload.status:
        updates["status"] = payload.status
    if payload.priority:
        updates["priority"] = payload.priority
    if payload.title:
        updates["title"] = payload.title.strip()
    if not updates:
        raise HTTPException(status_code=400, detail="No task updates provided")

    task = await storage.update_execution_task(task_id, founder_id, updates)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await bus.publish(EventType.TASK_UPDATE, {"tasks": [serialize_task(task)]}, session_id=task["session_id"], source="SYSTEM")
    return {"message": "Task updated successfully", "task": serialize_task(task)}


@app.get("/api/sessions/{session_id}/tasks")
async def get_tasks(session_id: str, founder_id: str = Query(default="default-founder")):
    tasks = await storage.list_execution_tasks(session_id=session_id, founder_id=normalize_founder_id(founder_id))
    return [serialize_task(task) for task in tasks]


@app.post("/api/founder/preferences")
async def update_founder_preferences(payload: FounderPreferenceRequest):
    profile = await storage.upsert_founder_profile(
        founder_id=normalize_founder_id(payload.founder_id),
        risk_tolerance=payload.risk_tolerance,
        decision_style=payload.decision_style,
        preferences=payload.preferences,
    )
    await storage.add_notification(None, "profile", "Founder preferences updated", f"Decision style set to {payload.decision_style}.", profile)
    return profile


@app.websocket("/ws/boardroom")
async def boardroom_socket(websocket: WebSocket):
    await websocket.accept()
    founder_id = normalize_founder_id(websocket.query_params.get("founder_id"))
    session_id = websocket.query_params.get("session_id")

    if not session_id:
        await websocket.send_json({"type": "ERROR", "data": {"message": "session_id is required"}})
        await websocket.close()
        return

    session = await storage.get_session(session_id, founder_id)
    if not session:
        await websocket.send_json({"type": "ERROR", "data": {"message": "Session not found"}})
        await websocket.close()
        return

    history = await storage.list_conversations(session_id, founder_id)

    async def bus_to_ws(event):
        if event.get("session_id") != session_id:
            return
        try:
            await websocket.send_json(event)
        except Exception:
            pass

    bus.subscribe(bus_to_ws)

    try:
        await websocket.send_json(
            {
                "type": "SESSION_READY",
                "session_id": session_id,
                "data": await serialize_session(session),
                "history": [serialize_message(item) for item in history],
            }
        )

        while True:
            raw_data = await websocket.receive_text()
            message = json.loads(raw_data)
            message_type = message.get("type")

            if message_type == "PROPOSE_IDEA":
                payload = (message.get("payload") or "").strip()
                if not payload:
                    continue

                await storage.update_session(
                    session_id,
                    {"founder_context": payload, "idea_text": payload, "title": safe_title(payload)},
                    founder_id,
                )
                await storage.add_conversation(
                    session_id,
                    payload,
                    founder_id=founder_id,
                    role="FOUNDER",
                    agent_name="Founder",
                    message_type="PROPOSE_IDEA",
                )
                await storage.record_metric(session_id, "founder_messages", 1, {"payload_length": len(payload)})
                await websocket.send_json(
                    {
                        "type": "STATUS_UPDATE",
                        "session_id": session_id,
                        "data": {
                            "role": "SYSTEM",
                            "agent_name": "Core",
                            "content": "Boardroom activated. Specialists are thinking...",
                            "phase": "early",
                        },
                    }
                )
                await bus.publish(EventType.IDEA_PROPOSED, payload, session_id=session_id, source="FOUNDER")

            elif message_type == "ANALYZE_PITCH":
                image_data = message.get("image_data")
                if not image_data:
                    continue

                temp_path = f"data/pitch_{session_id}.png"
                os.makedirs("data", exist_ok=True)
                with open(temp_path, "wb") as file_handle:
                    import base64 as b64

                    _, data = image_data.split(",", 1) if "," in image_data else ("", image_data)
                    file_handle.write(b64.b64decode(data))

                description = describe_image(temp_path, "Analyze this startup pitch. Identify the core vision, business model, and primary technical challenge.")
                await storage.add_conversation(
                    session_id,
                    f"[PITCH ANALYSIS] {description}",
                    founder_id=founder_id,
                    role="FOUNDER",
                    agent_name="Founder",
                    message_type="PITCH_DECK",
                )
                await bus.publish(EventType.IDEA_PROPOSED, f"Review pitch deck summary: {description}", session_id=session_id, source="FOUNDER")
    finally:
        bus.unsubscribe(bus_to_ws)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
