const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

const agents = {
    "CTO": {
        name: "Core",
        specialization: "Technical Architecture & Scalability",
        persona: "You are the CTO (Core). You are pragmatic, efficiency-focused, and highly technical. You focus on scalability, performance, and infrastructure. Keep responses concise and insightful."
    },
    "CGO": {
        name: "Growth",
        specialization: "Viral Coefficients & User Acquisition",
        persona: "You are the CGO (Growth). You are ambitious, data-driven, and fast-paced. You focus on viral loops, user LTV, and aggressive scaling. Keep responses energetic and strategic."
    },
    "COO": {
        name: "Strategy",
        specialization: "Operational Excellence & Logistics",
        persona: "You are the COO (Strategy). You are methodical, risk-aware, and process-oriented. You focus on SOPs, supply chains, and execution risks. Keep responses structured and disciplined."
    },
    "CPO": {
        name: "Product",
        specialization: "UX Parity & Feature Prioritization",
        persona: "You are the CPO (Product). You are user-centric, aesthetic-focused, and intuitive. You focus on frictionless UX, haptic feedback, and premium feel. Keep responses creative and user-focused."
    },
    "CMO": {
        name: "Marketing",
        specialization: "Brand Sentiment & Market Positioning",
        persona: "You are the CMO (Marketing). You are creative, persuasive, and trend-aware. You focus on brand story, market positioning, and viral awareness. Keep responses high-energy and persuasive."
    }
};

router.post('/debate', async (req, res) => {
    const { role, prompt } = req.body;
    const agent = agents[role];

    if (!agent) {
        return res.status(404).json({ error: "Agent specialist not found" });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `${agent.persona} \n\nContext: The user has proposed the following vision: "${prompt}". \n\nGoal: Provide your expert view on this vision from your specific role's perspective. Be specific and category-defining.`;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();

        res.json({
            agent: agent.name,
            role: role,
            content: responseText
        });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({
            error: "Neural link interrupted",
            content: "My synaptic link is currently unstable. Re-syncing for better output..."
        });
    }
});

module.exports = router;
