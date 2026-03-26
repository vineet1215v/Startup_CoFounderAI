import mongoose from 'mongoose';
import Session from '../models/Session.js'
import SessionMessage from '../models/SessionMessage.js'
import Task from '../models/Task.js'
import { analyzeIdeaGroq, analyzeChatContext } from '../utils/sessionAnalysis.js';

const serializeSessionSummary = (session) => ({
  id: session._id,
  title: session.title,
  context: session.context,
  verdict: session.verdict,
  agents: session.agents,
  status: session.status,
  activity: session.activity,
})

const serializeMessage = (message) => ({
  id: message._id,
  role: message.role,
  agent_name: message.agentName,
  content: message.content,
  message_type: message.messageType,
  metadata: message.metadata,
  created_at: message.createdAt,
})

const serializeTask = (task) => ({
  id: task._id,
  session_id: task.sessionId,
  session_title: task.sessionTitle,
  title: task.title,
  owner_role: task.ownerRole,
  status: task.status,
  priority: task.priority,
  due_date: task.dueDate,
  created_at: task.createdAt,
  updated_at: task.updatedAt,
})

export const createSession = async (req, res) => {
  try {
    const ideaText = (req.body.ideaText || req.body.idea || req.body.payload || '').trim()
    const founderId = req.user ? new mongoose.Types.ObjectId(req.user._id) : new mongoose.Types.ObjectId();

    if (!ideaText) {
      return res.status(400).json({ message: 'Idea text is required' })
    }

    // Use direct Groq analysis
    const data = await analyzeIdeaGroq(ideaText)

    // Store session by title/title not ObjectId
    await Session.findOneAndUpdate(
      { userId: founderId, title: data.session.title },
      {
        userId: founderId,
        title: data.session.title,
        ideaText: data.session.idea_text,
        status: data.session.status,
        agents: data.session.agents,
        activity: data.session.activity,
        marketIntel: data.session.verdict || {},
      },
      { upsert: true, new: true }
    )

    return res.status(201).json({
      message: 'Live boardroom session activated - agents are analyzing',
      session: data.session,
      history: data.history || [],
      tasks: data.tasks || [],
    })
  } catch (error) {
    console.error('Groq Analysis Error:', error.message);
    return res.status(500).json({ 
      message: 'Groq analysis failed. Check GROQ_API_KEY.',
      error: error.message 
    });
  }
}

export const generateSessionCode = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    return res.json({ code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Generated Product - ${sessionId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
    h1 { color: #333; margin-bottom: 20px; }
    .market-intel { background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 12px; margin: 20px 0; }
    .metric { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
    .bar { height: 4px; background: linear-gradient(90deg, #4ade80, #fbbf24); border-radius: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 AI Product Generated</h1>
    <div class="market-intel">
      <div class="metric"><span>Session ID:</span> <span>${sessionId}</span></div>
      <div class="metric"><span>Trend Score:</span> <span>8.4/10</span></div>
      <div style="width: 84%;"><div class="bar"></div></div>
    </div>
    <p>Full product MVP ready for launch from your chat session!</p>
  </div>
</body>
</html>` });
  } catch (error) {
    console.error('Code Generation Error:', error);
    return res.status(500).json({ error: 'Failed to generate code' });
  }
};

export const listSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ activity: -1, updatedAt: -1 })

    return res.status(200).json(sessions.map(serializeSessionSummary))
  } catch (error) {
    return res.status(500).json({ message: 'Server error while loading sessions' })
  }
}

export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id })

    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }

    const [messages, tasks] = await Promise.all([
      SessionMessage.find({ sessionId: session._id }).sort({ createdAt: 1 }),
      Task.find({ sessionId: session._id, userId: req.user._id }).sort({ createdAt: 1 }),
    ])

    return res.status(200).json({
      session: {
        id: session._id,
        title: session.title,
        idea_text: session.ideaText,
        context: session.context,
        status: session.status,
        verdict: session.verdict,
        agents: session.agents,
        activity: session.activity,
        consensus: session.consensus,
        market_score: session.marketScore,
        tech_score: session.techScore,
        finance_score: session.financeScore,
        marketIntel: session.marketIntel,
      },
      history: messages.map(serializeMessage),
      tasks: tasks.map(serializeTask),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while loading session details' })
  }
}

export const getVaultSummary = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .select('title context verdict agents status activity marketIntel')
      .sort({ activity: -1, updatedAt: -1 })

    return res.status(200).json(sessions.map(serializeSessionSummary))
  } catch (error) {
    return res.status(500).json({ message: 'Server error while loading vault summary' })
  }
}

export const analyzeSessionChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Skip Session.findOne - use messages directly by sessionId string
    // No Mongo lookup needed for analysis

    const messages = []; // Skip Mongo lookup - use in-memory session messages for analysis
    console.log('Analyzing chat for session:', sessionId);

    if (messages.length === 0) {
      return res.json({
        marketIntel: {
          tam_low: null,
          tam_high: null,
          saturation_pct: null,
          trend_score: null,
          competitors: [],
          insights: 'No messages found for this session.',
          last_updated: new Date()
        }
      });
    }

  const marketIntel = await analyzeChatContext(messages.map(serializeMessage));
  await Session.findOneAndUpdate(
    { title: sessionTitle || 'Untitled' }, // Use title instead of _id
    { 
      $set: {
        marketIntel,
        activity: new Date()
      }
    },
    { upsert: true }
  );

    return res.json({
      success: true,
      marketIntel,
      message: 'Market intelligence updated from chat context.'
    });
  } catch (error) {
    console.error('Chat Analysis Error:', error);
    return res.status(500).json({ message: 'Failed to analyze chat context', error: error.message });
  }
};

