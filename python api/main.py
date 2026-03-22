from __future__ import annotations

import json
from collections import Counter, defaultdict
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.specialists import CEOAgent, CFOAgent, CMOAgent, CTOAgent, CoreModeratorAgent, OpsAgent, ProductAgent
from core.bus import EventType, bus
from core.storage import storage
import os

SHARED_SESSION_ID = "boardroom-persistent-sync"


class SessionCreateRequest(BaseModel):
    title: str
    founder_context: str = ""


class FounderPreferenceRequest(BaseModel):
    founder_id: str
    risk_tolerance: float = 0.5
    decision_style: str = "balanced"
    preferences: dict = {}


class SimulationRequest(BaseModel):
    prompt: str = ""


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


async def system_event_recorder(event: Dict):
    session_id = event.get("session_id")
    event_type = event.get("type")
    data = event.get("data") or {}
    if event_type == EventType.RISK_ALERT.value:
        await storage.add_notification(session_id, "risk", f"{data.get('role', 'Agent')} raised a risk alert", data.get("content", ""), data)
    elif event_type == EventType.CONSENSUS_SIGNAL.value:
        await storage.add_notification(session_id, "consensus", "Consensus signal detected", data.get("content", ""), data)
        await storage.store_artifact(session_id, "decision-brief", "Consensus Brief", data.get("content", ""), data)
    elif event_type == EventType.TASK_UPDATE.value:
        await storage.add_notification(session_id, "execution", "Execution tasks updated", "Task board changed in execution mode.", data)
    elif event_type == EventType.AGENT_CHALLENGE.value:
        await storage.record_metric(session_id, "agent_challenges", 1, {"role": data.get("role")})
    elif event_type == EventType.BACKGROUND_THOUGHT.value:
        await storage.record_metric(session_id, "background_thoughts", 1, {"role": data.get("role")})


@app.on_event("startup")
async def startup_event():
    print("--- STARTING NEURAL INITIALIZATION ---")
    await bus.initialize()
    bus.subscribe(system_event_recorder)
    for agent in agents:
        await agent.initialize()
        print(f"--- Brain Specialist {agent.name} ({agent.role}) Online ---")
    print("--- ALL SYSTEMS OPERATIONAL ---")


async def get_active_session_id(explicit_session_id: Optional[str] = None) -> Optional[str]:
    sessions = await storage.list_sessions()
    if explicit_session_id:
        return explicit_session_id
    return sessions[0]["id"] if sessions else None


async def compute_trust_scores(session_id: str) -> Dict:
    conversations = await storage.list_conversations(session_id)
    by_role = defaultdict(list)
    for item in conversations:
        role = item.get("role")
        if role and role != "FOUNDER":
            by_role[role].append(item)

    trust = []
    for role, items in by_role.items():
        avg_confidence = sum(item.get("confidence", 0) for item in items) / max(len(items), 1)
        challenge_penalty = sum(1 for item in items if item.get("message_type") == "AGENT_CHALLENGE") * 0.04
        risk_bonus = sum(1 for item in items if item.get("message_type") == "RISK_ALERT") * 0.02
        reliability = max(0.3, min(0.98, avg_confidence + risk_bonus - challenge_penalty + 0.25))
        influence = max(0.2, min(1.0, reliability + (len(items) * 0.01)))
        trust.append({
            "role": role,
            "reliability": round(reliability, 3),
            "influence": round(influence, 3),
            "messages": len(items),
        })
    return {"trust": sorted(trust, key=lambda item: item["influence"], reverse=True)}


async def compute_decision_intelligence(session_id: str) -> Dict:
    decisions = await storage.list_decisions(session_id)
    conversations = await storage.list_conversations(session_id)
    disagreements = [item for item in conversations if item.get("message_type") == "AGENT_CHALLENGE"]
    avg_conf = sum(item.get("confidence", 0) for item in conversations if item.get("role") != "FOUNDER")
    count_conf = sum(1 for item in conversations if item.get("role") != "FOUNDER")
    return {
        "decision_confidence": round((avg_conf / count_conf) if count_conf else 0.0, 3),
        "decision_count": len(decisions),
        "disagreement_count": len(disagreements),
        "history_graph": [
            {"label": f"Decision {index + 1}", "confidence": item.get("confidence", 0), "status": item.get("status")}
            for index, item in enumerate(decisions)
        ],
        "predicted_outcome": "Promising but execution-sensitive" if decisions else "Insufficient data",
    }


async def compute_session_replay(session_id: str) -> Dict:
    conversations = await storage.list_conversations(session_id)
    phases = Counter()
    for item in conversations:
        meta = item.get("metadata") or {}
        if isinstance(meta, dict) and meta.get("phase"):
            phases[meta["phase"]] += 1
    return {
        "conversation": conversations,
        "phase_distribution": dict(phases),
    }


async def build_simulations(session_id: str, prompt: str = "") -> Dict:
    session = await storage.get_session(session_id)
    conversations = await storage.list_conversations(session_id)
    decisions = await storage.list_decisions(session_id)
    seed_text = prompt or (decisions[-1]["summary"] if decisions else session.get("founder_context", "") if session else "")
    risk_profile = "higher risk" if "marketplace" in seed_text.lower() else "balanced risk"
    simulations = [
        {
            "name": "Conservative Launch",
            "summary": f"Ship a narrow MVP first and validate one customer segment. This path emphasizes runway protection and lower execution complexity around: {seed_text[:90]}",
            "risk": 32,
            "reward": 58,
        },
        {
            "name": "Balanced Wedge",
            "summary": f"Focus on the strongest wedge, keep differentiation visible, and stage capability rollout. This path preserves momentum with {risk_profile}.",
            "risk": 48,
            "reward": 76,
        },
        {
            "name": "Aggressive Expansion",
            "summary": f"Invest early in brand, feature breadth, and acquisition scale. This path maximizes upside but increases burn and operational strain.",
            "risk": 73,
            "reward": 90,
        },
    ]
    await storage.store_artifact(session_id, "scenario-map", "Scenario Simulation Map", json.dumps(simulations), {"prompt": seed_text})
    await storage.record_metric(session_id, "simulations_generated", len(simulations), {"prompt": seed_text})
    return {"prompt": seed_text, "simulations": simulations, "signals": {"conversation_count": len(conversations), "decision_count": len(decisions)}}


@app.get("/")
async def root():
    return {"status": "Cofounder AI Engine Running"}


@app.get("/healthz")
async def healthz():
    return {
        "status": "ok",
        "services": {
            "event_bus": "ready",
            "storage": "ready",
            "agents": len(agents),
        },
    }


@app.get("/api/system/status")
async def system_status():
    sessions = await storage.list_sessions()
    notifications = await storage.list_notifications(None)
    return {
        "status": "ok",
        "agent_count": len(agents),
        "session_count": len(sessions),
        "notifications": len(notifications),
    }


@app.get("/api/vault/summary")
async def idea_vault_summary():
    sessions = await storage.list_sessions()
    vault_data = []
    
    for s in sessions:
        # Get consensus and activity for each idea
        decisions = await storage.list_decisions(s["id"])
        latest_decision = decisions[-1] if decisions else None
        
        # Determine status pill
        status = "draft"
        if latest_decision:
            status = "validated" if latest_decision["confidence"] > 0.8 else "analyzing"
        
        # Get active agents for stack
        conversations = await storage.list_conversations(s["id"])
        roles = list(set([c["role"] for c in conversations if c["role"] != "FOUNDER"]))[:4]
        
        vault_data.append({
            "id": s["id"],
            "title": s["title"],
            "verdict": latest_decision["confidence"] * 10 if latest_decision else None,
            "status": status,
            "agents": roles,
            "activity": s["updated_at"], # ISO date
            "context": s["founder_context"]
        })
    
    return vault_data


@app.get("/api/sessions")
async def list_sessions():
    return await storage.list_sessions()


@app.post("/api/sessions")
async def create_session(payload: SessionCreateRequest):
    session = await storage.create_session(payload.title, payload.founder_context)
    await storage.add_notification(session["id"], "system", "Session created", f"New session '{payload.title}' is ready.", session)
    return session


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    session = await storage.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.get("/api/sessions/{session_id}/conversations")
async def get_conversations(session_id: str):
    return await storage.list_conversations(session_id)


@app.get("/api/sessions/{session_id}/replay")
async def get_replay(session_id: str):
    return await compute_session_replay(session_id)


@app.get("/api/sessions/{session_id}/decisions")
async def get_decisions(session_id: str):
    return await storage.list_decisions(session_id)


@app.get("/api/tasks/global")
async def global_tasks_summary():
    sessions = await storage.list_sessions()
    all_tasks = []
    for s in sessions:
        tasks = await storage.list_execution_tasks(s["id"])
        # Annotate tasks with session title for context
        for t in tasks:
            t["session_title"] = s["title"]
            all_tasks.append(t)
    
    # Sort: active first, then by priority/date
    return sorted(all_tasks, key=lambda x: (x["status"] == "active", x["created_at"]), reverse=True)


@app.get("/api/sessions/{session_id}/tasks")
async def get_tasks(session_id: str):
    return await storage.list_execution_tasks(session_id)


@app.get("/api/sessions/{session_id}/analytics")
async def get_session_analytics(session_id: str):
    return await storage.analytics_summary(session_id)


@app.get("/api/sessions/{session_id}/trust")
async def get_session_trust(session_id: str):
    return await compute_trust_scores(session_id)


@app.get("/api/sessions/{session_id}/decision-intelligence")
async def get_decision_intelligence(session_id: str):
    return await compute_decision_intelligence(session_id)


@app.get("/api/sessions/{session_id}/notifications")
async def get_notifications(session_id: str):
    return await storage.list_notifications(session_id)


@app.get("/api/sessions/{session_id}/artifacts")
async def get_artifacts(session_id: str):
    return await storage.list_artifacts(session_id)


@app.post("/api/sessions/{session_id}/report")
async def generate_strategy_report(session_id: str):
    session = await storage.get_session(session_id)
    conversations = await storage.list_conversations(session_id)
    decisions = await storage.list_decisions(session_id)
    
    if not session or not conversations:
        raise HTTPException(status_code=404, detail="Insufficient data to generate report")

    # Synthesize boardroom debate into a Strategy Brief
    transcript = "\n".join([f"{c['role']}: {c['content']}" for c in conversations[-15:]])
    prompt = f"""Synthesize this Boardroom Strategy Debate for the startup "{session['title']}".
Transcript: {transcript}

Goal: Create a High-Density Strategic Brief (Pre-Seed Tier).
Include:
1. Executive Vision: Core differentiation and primary wedge.
2. Technical Architecture: FE/BE stack, scale milestones, and dev complexity.
3. Market & Finance: Acquisition thesis, burn assumptions, and target users.
4. Risk & Final Verdict: Critical dependencies and a confidence score (0-100).

Respond in professional investor-ready Markdown."""

    from core.openrouter_client import ask_qwen
    report = ask_qwen(prompt, "You are a world-class startup strategist. Generate a structured investment-ready brief.", 0.2)
    
    artifact = await storage.store_artifact(session_id, "strategy-brief", f"Strategy Brief: {session['title']}", report)
    await storage.add_notification(session_id, "system", "Strategy Brief Generated", f"Founders can now review the depth analysis for {session['title']}.")
    
    return {
        "status": "Finalized",
        "artifact_id": artifact["_id"],
        "summary": report[:500] + "..."
    }


@app.post("/api/sessions/{session_id}/simulate")
async def simulate(session_id: str, payload: SimulationRequest):
    return await build_simulations(session_id, payload.prompt)


@app.post("/api/founder/preferences")
async def update_founder_preferences(payload: FounderPreferenceRequest):
    profile = await storage.upsert_founder_profile(
        founder_id=payload.founder_id,
        risk_tolerance=payload.risk_tolerance,
        decision_style=payload.decision_style,
        preferences=payload.preferences,
    )
    await storage.add_notification(None, "profile", "Founder preferences updated", f"Decision style set to {payload.decision_style}.", profile)
    return profile


@app.get("/api/telemetry")
async def telemetry(session_id: Optional[str] = None):
    active_session_id = await get_active_session_id(session_id)
    tasks = await storage.list_execution_tasks(active_session_id) if active_session_id else []
    decisions = await storage.list_decisions(active_session_id) if active_session_id else []
    analytics = await storage.analytics_summary(active_session_id)
    conviction = int(((decisions[-1]["confidence"] if decisions else 0.62) * 100))
    return {
        "neuralLoad": f"{48 + len(tasks) * 2:.1f} TFLOPs",
        "synapticSpeed": f"{1.1 + min(len(decisions), 5) * 0.08:.1f}ms",
        "simulationAccuracy": f"{96.8 + min(len(tasks), 6) * 0.3:.1f}%",
        "activeStreams": len(tasks),
        "conviction": conviction,
        "analytics": analytics,
    }


@app.get("/api/notifications")
async def all_notifications():
    return await storage.list_notifications(None)


@app.get("/api/insights")
async def insights(session_id: Optional[str] = None):
    active_session_id = await get_active_session_id(session_id)
    conversations = await storage.list_conversations(active_session_id) if active_session_id else []
    latest = conversations[-6:]
    return [
        {
            "id": item["_id"],
            "text": item["content"],
            "time": item["created_at"],
            "type": item["message_type"],
            "role": item["role"],
        }
        for item in latest
    ]


@app.websocket("/ws/boardroom")
async def boardroom_socket(websocket: WebSocket):
    await websocket.accept()
    
    # Establish persistent shared session
    active_session = await storage.get_session(SHARED_SESSION_ID)
    if not active_session:
        active_session = await storage.create_session("Live Boardroom", session_id=SHARED_SESSION_ID)
    
    # Load history
    history = await storage.list_conversations(SHARED_SESSION_ID)
    
    async def bus_to_ws(event):
        # Allow all shared events or system events
        if event.get("session_id") not in [SHARED_SESSION_ID, "system", "default"]:
            return
        try:
            await websocket.send_json(event)
        except Exception:
            pass

    bus.subscribe(bus_to_ws)

    try:
        # Send ready signal with history
        await websocket.send_json({
            "type": "SESSION_READY", 
            "session_id": SHARED_SESSION_ID, 
            "data": active_session,
            "history": history
        })
        while True:
            raw_data = await websocket.receive_text()
            message = json.loads(raw_data)
            session_id = message.get("session_id") or active_session["id"]

            if message.get("type") == "PROPOSE_IDEA":
                payload = (message.get("payload") or "").strip()
                if not payload:
                    continue
                await storage.add_conversation(session_id, payload, role="FOUNDER", agent_name="Founder", message_type="PROPOSE_IDEA")
                await storage.record_metric(session_id, "founder_messages", 1, {"payload_length": len(payload)})
                
                # Visual feedback: Boardroom initializing
                await websocket.send_json({"type": "STATUS_UPDATE", "data": "Neural link stable. Boardroom initializing..."})
                
                await bus.publish(EventType.IDEA_PROPOSED, payload, session_id=session_id, source="FOUNDER")

            elif message.get("type") == "ANALYZE_PITCH":
                # Friday AI Vision integration
                image_data = message.get("image_data") # base64
                if not image_data:
                    continue
                
                # Temporary save for vision model
                temp_path = f"data/pitch_{session_id}.png"
                os.makedirs("data", exist_ok=True)
                with open(temp_path, "wb") as f:
                    import base64 as b64
                    header, data = image_data.split(",", 1) if "," in image_data else (None, image_data)
                    f.write(b64.b64decode(data))
                
                from core.openrouter_client import describe_image
                description = describe_image(temp_path, "Analyze this startup pitch. Identify the core vision, business model, and primary technical challenge.")
                
                await storage.add_conversation(session_id, f"[PITCH ANALYSIS] {description}", role="FOUNDER", agent_name="Founder", message_type="PITCH_DECK")
                await bus.publish(EventType.IDEA_PROPOSED, f"Review pitch deck summary: {description}", session_id=session_id, source="FOUNDER")

            elif message.get("type") == "CONFIRM_EXECUTION":
                await storage.update_session_status(session_id, "execution")
                decision_summary = message.get("payload") or "Founder approved execution mode."
                await storage.create_execution_task(session_id, "Convert boardroom decision into execution plan", "COO", "active", 20)
                await storage.create_execution_task(session_id, "Validate technical execution scope", "CTO", "queued", 0)
                await storage.create_execution_task(session_id, "Stress-test financial assumptions", "CFO", "queued", 0)
                await storage.add_notification(session_id, "execution", "Execution mode activated", decision_summary)
                await bus.publish(EventType.EXECUTION_MODE, {"confirmed_by": "founder", "note": decision_summary}, session_id=session_id, source="FOUNDER")
                tasks = await storage.list_execution_tasks(session_id)
                await bus.publish(EventType.TASK_UPDATE, {"tasks": tasks}, session_id=session_id, source="SYSTEM")

            elif message.get("type") == "FOUNDER_PREFERENCE":
                founder_id = message.get("founder_id") or "default-founder"
                profile = await storage.upsert_founder_profile(
                    founder_id=founder_id,
                    risk_tolerance=float(message.get("risk_tolerance", 0.5)),
                    decision_style=message.get("decision_style", "balanced"),
                    preferences=message.get("preferences", {}),
                )
                await bus.publish(EventType.FOUNDER_PREFERENCE, profile, session_id=session_id, source="FOUNDER")
    finally:
        bus.unsubscribe(bus_to_ws)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
