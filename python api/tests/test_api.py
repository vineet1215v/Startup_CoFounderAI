import unittest

from fastapi.testclient import TestClient

from main import app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/healthz")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_session_and_simulation_flow(self):
        session_response = self.client.post(
            "/api/sessions",
            json={"title": "API Test Session", "founder_context": "AI workflow studio"},
        )
        self.assertEqual(session_response.status_code, 200)
        session = session_response.json()

        simulation_response = self.client.post(
            f"/api/sessions/{session['id']}/simulate",
            json={"prompt": "What if we launched with a narrower wedge?"},
        )
        self.assertEqual(simulation_response.status_code, 200)
        payload = simulation_response.json()
        self.assertEqual(len(payload["simulations"]), 3)

    def test_system_status_and_notifications(self):
        response = self.client.get("/api/system/status")
        self.assertEqual(response.status_code, 200)
        self.assertIn("agent_count", response.json())

        notifications = self.client.get("/api/notifications")
        self.assertEqual(notifications.status_code, 200)
        self.assertIsInstance(notifications.json(), list)


if __name__ == "__main__":
    unittest.main()
