import asyncio
import websockets
import json

async def test():
    uri = "ws://127.0.0.1:8080/ws/boardroom"
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected to WebSocket!")
            await websocket.send(json.dumps({"type": "PROPOSE_IDEA", "payload": "Test idea"}))
            print("Sent test message.")
            response = await websocket.recv()
            print(f"Received response: {response}")
    except Exception as e:
        print(f"Failed to connect: {e}")

asyncio.run(test())
