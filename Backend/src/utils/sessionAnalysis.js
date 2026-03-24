import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const model = "llama-3.1-8b-instant";

const AGENTS = {
  market: {
    name: 'Market Analyst',
    prompt: "You are Market Analyst AI. Analyze startup idea for market potential, TAM/SAM/SOM, competition, timing. Give score: <number>/10 at end.",
  },
  tech: {
    name: 'Tech Architect',
    prompt: "You are Tech Architect AI. Analyze technical feasibility, tech stack, scalability, risks. Give score: <number>/10 at end.",
  },
  finance: {
    name: 'Finance Expert',
    prompt: "You are Finance Expert AI. Analyze business model, revenue streams, unit economics, burn rate, funding needs. Give score: <number>/10 at end.",
  }
};

export const analyzeIdeaGroq = async (ideaText) => {
  try {
    const sessionId = "groq-" + Date.now();
    const sessionTitle = ideaText.substring(0, 50) + '...';

const prompt = `RESPOND WITH JSON ONLY. NO OTHER TEXT.

Analyze this startup idea from 3 perspectives:

${ideaText}

FORMAT:
{
  "market": {
    "analysis": "Market potential, TAM/SAM/SOM, competition analysis, timing (1-2 paragraphs)",
    "score": 8
  },
  "tech": {
    "analysis": "Technical feasibility, recommended stack, scalability, risks (1-2 paragraphs)",
    "score": 8
  },
  "finance": {
    "analysis": "Business model, revenue streams, unit economics, funding needs (1-2 paragraphs)",
    "score": 8
  }
}

JSON:`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    
    const text = completion.choices[0].message.content.trim();

    let analyses = [];
    let scores = {};
    let consensus = '';
    try {
      const parsed = JSON.parse(text);
      analyses = [
        {
          agent_name: 'Market Analyst',
          role: 'market',
          content: parsed.market ? parsed.market.analysis : '',
          score: parsed.market ? parsed.market.score : 5,
          message_type: 'analysis'
        },
        {
          agent_name: 'Tech Architect',
          role: 'tech',
          content: parsed.tech ? parsed.tech.analysis : '',
          score: parsed.tech ? parsed.tech.score : 5,
          message_type: 'analysis'
        },
        {
          agent_name: 'Finance Expert',
          role: 'finance',
          content: parsed.finance ? parsed.finance.analysis : '',
          score: parsed.finance ? parsed.finance.score : 5,
          message_type: 'analysis'
        }
      ];
      scores = {
        market: parsed.market ? parsed.market.score : 5,
        tech: parsed.tech ? parsed.tech.score : 5,
        finance: parsed.finance ? parsed.finance.score : 5
      };
      consensus = [parsed.market, parsed.tech, parsed.finance].map(a => a ? a.analysis : '').filter(Boolean).join('\n\n');
    } catch (e) {
      console.warn('JSON parse failed:', e);
      consensus = text;
      analyses = [{
        agent_name: 'AI Assistant', 
        role: 'general',
        content: text,
        score: 5,
        message_type: 'analysis'
      }];
      scores = { market: 5, tech: 5, finance: 5 };
    }

    // Generate tasks
    const taskPrompt = `Idea: ${ideaText}

Generate 3-5 actionable next-step tasks. Return ONLY valid JSON array:
[{"title": "Do research", "owner_role": "Founder", "priority": "high", "status": "todo"}]`;

    const taskCompletion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: taskPrompt }],
    });
    
    const taskText = taskCompletion.choices[0].message.content.trim();

    let tasks = [];
    try {
      const jsonMatch = taskText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("Task JSON parsing failed:", e);
    }

    return {
      session: {
        id: sessionId,
        title: sessionTitle,
        idea_text: ideaText,
        status: 'complete',
        agents: ['Market Analyst', 'Tech Architect', 'Finance Expert'],
        activity: Date.now(),
        verdict: scores,
        consensus,
        market_score: scores.market || 5,
        tech_score: scores.tech || 5,
        finance_score: scores.finance || 5
      },
      history: analyses,
      tasks: tasks.map(t => ({
        ...t,
        session_id: sessionId,
        session_title: sessionTitle
      }))
    };
  } catch (error) {
    console.error('Groq Analysis Error:', error);
    throw new Error('Groq analysis failed');
  }
};

