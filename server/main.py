import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from core.bus import bus, EventType
from agents.specialists import (
    CTOAgent,
    CMOAgent,
    ProductAgent,
    CFOAgent,
    OpsAgent,
    CoreModeratorAgent,
)
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Full Leadership Team
agents = [
    CoreModeratorAgent(),
    CTOAgent(),
    CMOAgent(),
    ProductAgent(),
    CFOAgent(),
    OpsAgent()
]

@app.on_event("startup")
async def startup_event():
    print("--- STARTING AGENT INITIALIZATION ---")
    for agent in agents:
        await agent.initialize()
        print(f"--- Agent {agent.name} Initialized and Subscribed ---")
    print("--- ALL AGENTS READY ---")

@app.get("/")
async def root():
    return {"status": "Cofounder AI Engine Running"}

@app.websocket("/ws/boardroom")
async def boardroom_socket(websocket: WebSocket):
    print("--- NEW WS CONNECTION ATTEMPT ---")
    await websocket.accept()
    print("--- WS CONNECTION ACCEPTED ---")
    
    # Subscribe websocket to the bus
    async def bus_to_ws(event):
        try:
            print(f"-> Pushing to UI: {event['type']}")
            await websocket.send_json(event)
        except Exception as e:
            print(f"!! Push failed: {e}")
            pass # Socket closed

    bus.subscribe(bus_to_ws)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"<- Received from UI: {message.get('type')}")
            
            if message.get("type") == "PROPOSE_IDEA":
                payload = (message.get("payload") or "").strip()
                print(f"   Payload: {payload[:50]}...")
                await bus.publish(EventType.IDEA_PROPOSED, payload)
            elif message.get("type") == "CONFIRM_EXECUTION":
                await bus.publish(EventType.EXECUTION_MODE, {
                    "confirmed_by": "founder",
                    "note": message.get("payload") or "Founder approved execution mode."
                })
    except Exception as e:
        print(f"!! WS Runtime Error: {e}")
    finally:
        print("--- WS CLEANUP ---")
        bus.unsubscribe(bus_to_ws)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
