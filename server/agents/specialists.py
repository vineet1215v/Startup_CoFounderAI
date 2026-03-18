import asyncio
from core.base_agent import CognitiveAgent
from core.bus import EventType
from core.openrouter_client import ask_qwen


class SpecialistAgent(CognitiveAgent):
    def __init__(
        self,
        agent_id: int,
        name: str,
        role: str,
        color: str,
        persona: str,
        domain_keywords: list[str],
    ):
        super().__init__(
            agent_id=agent_id,
            name=name,
            role=role,
            color=color,
            persona=persona,
            domain_keywords=domain_keywords,
        )

    def _fallback_idea_insight(self, data: str) -> str:
        return (
            f"{self.role} fallback analysis: I could not reach the AI model, so here is a quick manual review. "
            f"For the idea '{data}', define one clear target customer, one revenue model, and one MVP scope "
            f"for a 2-4 week build. Then validate with 5-10 real users before adding complexity."
        )

    def _fallback_peer_insight(self, data: dict) -> str:
        peer_name = data.get("agent_name", "peer")
        return (
            f"{self.role} add-on: Building on {peer_name}'s point, we should prioritize execution risk reduction "
            f"with measurable checkpoints, cost constraints, and a launch timeline."
        )

    async def _generate_text(self, prompt: str, fallback_text: str) -> str:
        try:
            text = await asyncio.to_thread(
                ask_qwen,
                prompt,
                "You are Friday AI, a helpful assistant.",
                0.4,
            )
            text = (text or "").strip()
            if text:
                return text
            return fallback_text
        except Exception as exc:
            print(f"[{self.name}] Model call failed: {exc}")
            return fallback_text

    async def process_new_idea(self, data: str, perception: dict):
        print(f"[{self.name}] Processing new idea in mode={self.mode}")
        research = await self.research(data, perception)
        if not research.get("domain_signals"):
            # Strict domain ownership: no domain signal, no speaking.
            return
        prompt = (
            f"Role: {self.persona}\n"
            f"Mode: {self.mode}\n"
            f"Idea: {data}\n"
            f"Research findings: {research}\n"
            f"Respond ONLY from {self.role} perspective. "
            "Do not comment as other departments. Be critical but constructive."
        )
        insight = await self._generate_text(prompt, self._fallback_idea_insight(data))
        decision = await self.decide_participation(perception, research, insight)
        if decision["should_speak"]:
            await self.speak(insight)

    async def process_peer_insight(self, data: dict, perception: dict):
        if data.get("role") == self.role:
            return
        research = await self.research(data, perception)
        if not research.get("domain_signals"):
            # Skip cross-talk outside the agent's owned domain.
            return
        prompt = (
            f"Role: {self.persona}\n"
            f"Mode: {self.mode}\n"
            f"Peer ({data['agent_name']}) said: {data['content']}\n"
            f"Research findings: {research}\n"
            "Context: Startup debate.\n"
            f"Respond ONLY from {self.role} perspective. "
            "Decision: Do you have a unique expert perspective to add or a logical challenge? "
            "Respond with 'SILENCE' if no value to add, otherwise provide your insight."
        )
        insight = await self._generate_text(prompt, self._fallback_peer_insight(data))
        if insight.strip().upper() != "SILENCE":
            decision = await self.decide_participation(perception, research, insight)
            if decision["should_speak"]:
                await self.speak(insight)


class CoreModeratorAgent(CognitiveAgent):
    def __init__(self):
        super().__init__(
            agent_id=99,
            name="Core",
            role="MODERATOR",
            color="#f59e0b",
            persona="Neutral moderator who synthesizes expert inputs, identifies consensus, and prepares execution transitions.",
            domain_keywords=["consensus", "risk", "decision", "timeline", "owner", "next step"],
        )
        self.collected_points: list[dict] = []
        self.summary_interval = 6

    async def process_new_idea(self, data: str, perception: dict):
        self.collected_points = []
        kickoff = (
            "Boardroom initialized. Agents will evaluate market, product, technical feasibility, "
            "risk, and execution strategy before proposing a decision."
        )
        await self.speak(kickoff, EventType.STATUS_UPDATE)

    async def process_peer_insight(self, data: dict, perception: dict):
        self.collected_points.append(data)
        if len(self.collected_points) % self.summary_interval != 0:
            return
        summary = self._summarize_points(self.collected_points[-self.summary_interval :])
        await self.speak(summary, EventType.STATUS_UPDATE)
        if self._has_consensus_signal(summary):
            await self.speak(
                "Consensus trend detected: move to founder confirmation for execution mode.",
                EventType.CONSENSUS_SIGNAL,
            )

    def _summarize_points(self, points: list[dict]) -> str:
        speakers = sorted({point.get("agent_name", "Agent") for point in points})
        return (
            "Core moderation update: multiple perspectives were recorded from "
            + ", ".join(speakers)
            + ". Awaiting further specialist inputs before founder decision."
        )

    def _has_consensus_signal(self, summary: str) -> bool:
        summary_l = summary.lower()
        consensus_tokens = ("agree", "consensus", "priority", "mvp", "timeline")
        hits = sum(1 for token in consensus_tokens if token in summary_l)
        return hits >= 2


class CTOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(
            agent_id=1,
            name="Tech",
            role="CTO",
            color="#3b82f6",
            persona="Pragmatic CTO focused on architecture, scalability, and technical feasibility. You hate fluff and love efficiency.",
            domain_keywords=["architecture", "scalability", "latency", "infra", "stack", "backend"],
        )


class CMOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(
            agent_id=5,
            name="Marketing",
            role="CMO",
            color="#ec4899",
            persona="Trend-aware CMO focused on brand story, market positioning, and user demand. You want to know if people will actually buy this.",
            domain_keywords=["market", "acquisition", "brand", "positioning", "competitor", "demand"],
        )


class ProductAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(
            agent_id=4,
            name="Product",
            role="CPO",
            color="#06b6d4",
            persona="User-centric CPO focused on UX, feature prioritization, and product-market fit. You care about the 'why' behind the features.",
            domain_keywords=["ux", "retention", "onboarding", "feature", "journey", "mvp"],
        )


class CFOAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(
            agent_id=3,
            name="Strategy",
            role="CFO",
            color="#8b5cf6",
            persona="Risk-aware finance leader focused on burn rate, unit economics, runway, and downside risk.",
            domain_keywords=["burn", "runway", "margin", "risk", "cost", "finance"],
        )


class OpsAgent(SpecialistAgent):
    def __init__(self):
        super().__init__(
            agent_id=2,
            name="Growth",
            role="COO",
            color="#10b981",
            persona="Operations execution manager focused on delivery sequencing, ownership clarity, and execution velocity.",
            domain_keywords=["execution", "timeline", "owner", "dependencies", "ops", "sprint"],
        )
