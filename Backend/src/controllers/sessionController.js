import mongoose from 'mongoose';
import Session from '../models/Session.js'
import SessionMessage from '../models/SessionMessage.js'
import Task from '../models/Task.js'
import { analyzeIdeaGroq } from '../utils/sessionAnalysis.js';

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

    // Sync minimal session metadata to Node MongoDB for UI listings
    await Session.findOneAndUpdate(
      { userId: founderId, title: data.session.title },
      {
        userId: founderId,
        title: data.session.title,
        ideaText: data.session.idea_text,
        status: data.session.status,
        agents: data.session.agents,
        activity: data.session.activity,
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
      .select('title context verdict agents status activity')
      .sort({ activity: -1, updatedAt: -1 })

    return res.status(200).json(sessions.map(serializeSessionSummary))
  } catch (error) {
    return res.status(500).json({ message: 'Server error while loading vault summary' })
  }
}

