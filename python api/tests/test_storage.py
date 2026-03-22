import os
import tempfile
import unittest

from core.consensus import evaluate_consensus
from core.storage import Storage


class StorageTests(unittest.TestCase):
    def setUp(self):
        fd, path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        self.tmp_path = path
        self.storage = Storage(self.tmp_path)

    def tearDown(self):
        if os.path.exists(self.tmp_path):
            try:
                os.unlink(self.tmp_path)
            except PermissionError:
                pass

    def test_session_and_conversation_roundtrip(self):
        session = self.storage.create_session("Test Session", "Founder wants a fintech assistant")
        self.assertEqual(session["title"], "Test Session")

        self.storage.add_conversation(
            session["id"],
            "We should validate MVP scope first.",
            role="CPO",
            agent_name="Product",
            confidence=0.7,
        )
        conversations = self.storage.list_conversations(session["id"])
        self.assertEqual(len(conversations), 1)
        self.assertEqual(conversations[0]["role"], "CPO")

    def test_memory_search_returns_relevant_item(self):
        session = self.storage.create_session("Memory Session")
        self.storage.store_memory(session["id"], "CTO", "research", "The system requires scalable backend queues", 0.2)
        self.storage.store_memory(session["id"], "CTO", "research", "Brand positioning needs stronger differentiation", 0.1)
        results = self.storage.search_memory(session["id"], "CTO", "backend scalability")
        self.assertGreaterEqual(len(results), 1)
        self.assertIn("backend", results[0]["content"].lower())

    def test_consensus_logic_detects_alignment(self):
        consensus = evaluate_consensus(
            [
                {"role": "CEO", "content": "We should focus on one MVP priority.", "confidence": 0.8},
                {"role": "CTO", "content": "I agree. We should ship the MVP with a simpler architecture.", "confidence": 0.78},
                {"role": "CMO", "content": "I agree. The market positioning is stronger with one wedge.", "confidence": 0.79},
            ]
        )
        self.assertTrue(consensus["consensus"])

    def test_notifications_and_artifacts_roundtrip(self):
        session = self.storage.create_session("Ops Session")
        self.storage.add_notification(session["id"], "risk", "Budget warning", "Runway fell below threshold")
        self.storage.store_artifact(session["id"], "scenario-map", "Launch Scenarios", "Conservative vs aggressive launch")
        notifications = self.storage.list_notifications(session["id"])
        artifacts = self.storage.list_artifacts(session["id"])
        self.assertEqual(notifications[0]["title"], "Budget warning")
        self.assertEqual(artifacts[0]["artifact_type"], "scenario-map")


if __name__ == "__main__":
    unittest.main()
