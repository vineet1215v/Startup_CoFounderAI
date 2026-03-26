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

function cleanJsonText(text) {
  return text
    .replace(/```json\s*|\s*```/g, '')
    .replace(/```/g, '')
    .trim()
    .replace(/\\n/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control chars
}

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
    
    let text = cleanJsonText(completion.choices[0].message.content);

    let analyses = [];
    let scores = {};
    let consensus = '';
    try {
      const parsed = JSON.parse(text);
      analyses = [
        {
          agent_name: 'Market Analyst',
          role: 'market',
          content: parsed.market?.analysis || '',
          score: parsed.market?.score || 5,
          message_type: 'analysis'
        },
        {
          agent_name: 'Tech Architect',
          role: 'tech',
          content: parsed.tech?.analysis || '',
          score: parsed.tech?.score || 5,
          message_type: 'analysis'
        },
        {
          agent_name: 'Finance Expert',
          role: 'finance',
          content: parsed.finance?.analysis || '',
          score: parsed.finance?.score || 5,
          message_type: 'analysis'
        }
      ];
      scores = {
        market: parsed.market?.score || 5,
        tech: parsed.tech?.score || 5,
        finance: parsed.finance?.score || 5
      };
      consensus = [parsed.market, parsed.tech, parsed.finance].map(a => a ? a.analysis : '').filter(Boolean).join('\n\n');
    } catch (e) {
      console.warn('JSON parse failed:', e);
      console.error('Error details:', e.message);
      console.error('Response preview (pos 1150-1250):', text.substring(Math.max(0,1150),1250));
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
    
    let taskText = cleanJsonText(taskCompletion.choices[0].message.content);

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

export const generateProductCode = async (messages) => {
  try {
    if (!messages || messages.length === 0) {
      return `<!DOCTYPE html>
<html>
<head><title>Empty Project</title></head>
<body><h1>No chat context - add your idea!</h1></body>
</html>`;
    }

    const chatSummary = messages.map(m => `${m.agent_name || m.role}: ${m.content.substring(0, 200)}`).join('\n');
    const ideaText = chatSummary.substring(0, 1000);

    const prompt = `Generate COMPLETE working HTML/CSS/JS website code based on this chat discussion:

${ideaText}

REQUIREMENTS:
- SINGLE HTML file (inline CSS/JS)
- Fully responsive, modern UI
- Core functionality based on startup idea
- Professional, production-ready code
- Comments explaining features

EXAMPLE OUTPUT (Ecommerce):
<!DOCTYPE html> ... full page

RESPOND WITH CODE ONLY - no explanations.`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });

    let code = cleanJsonText(completion.choices[0].message.content).trim();
    
    // Ensure it's HTML
    if (!code.startsWith('<!DOCTYPE html>')) {
      code = `<!DOCTYPE html>
<html><head><title>AI Generated - ${ideaText.substring(0,50)}</title></head><body><pre>${code}</pre></body></html>`;
    }

    return code;
  } catch (error) {
    console.error('Code Gen Error:', error);
    return `<!DOCTYPE html>
<html><head><title>Error</title></head><body><h1>Code generation failed</h1></body></html>`;
  }
};

export const analyzeChatContext = async (messages) => {
  try {
    if (!messages || messages.length === 0) {
      return {
        tam_low: null,
        tam_high: null,
        saturation_pct: null,
        trend_score: null,
        competitors: [],
        insights: 'No chat context available for analysis.',
        last_updated: new Date()
      };
    }

    const chatContext = messages.map(m => `${m.agent_name || m.role}: ${m.content.substring(0, 500)}`).join('\n\n');

    const prompt = `RESPOND WITH JSON ONLY. NO OTHER TEXT.

Analyze this ongoing chat conversation about a startup for MARKET INTELLIGENCE:

${chatContext}

EXTRACTION FORMAT - Use realistic numbers based on discussion:
{
  "tam_low": 50000000,
  "tam_high": 500000000,
  "saturation_pct": 65,
  "trend_score": 8.2,
  "competitors": ["Competitor A", "Competitor B"],
  "insights": "2-3 sentences of key market takeaways from conversation."
}

NOTES:
- TAM: Total Addressable Market range in USD (low-high estimate)
- Saturation: % (0-100) how crowded space is
- Trend: Upward momentum score /10
- Competitors: Top 1-5 mentioned or implied
- Insights: Concise bullets from chat

JSON:`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });

    let text = cleanJsonText(completion.choices[0].message.content);
    
    let intel;
    try {
      intel = JSON.parse(text);
    } catch (e) {
      console.warn('Chat context JSON parse failed:', e);
      intel = {
        tam_low: null,
        tam_high: null,
        saturation_pct: null,
        trend_score: null,
        competitors: [],
        insights: text.substring(0, 500),
      };
    }

    intel.last_updated = new Date();

    return intel;
  } catch (error) {
    console.error('Groq Chat Analysis Error:', error);
    return {
      tam_low: null,
      tam_high: null,
      saturation_pct: null,
      trend_score: null,
      competitors: [],
      insights: 'Analysis failed.',
      last_updated: new Date()
    };
  }
};

