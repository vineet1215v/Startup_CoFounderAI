import Session from '../models/Session.js'
import SessionMessage from '../models/SessionMessage.js'
import Task from '../models/Task.js'
import {
  analyzeIdea,
  buildSessionMessages,
  buildSessionTitle,
  buildSuggestedTasks,
} from '../utils/sessionAnalysis.js'

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

    if (!ideaText) {
      return res.status(400).json({ message: 'Idea text is required' })
    }

    const title = (req.body.title || buildSessionTitle(ideaText)).trim()
    const analysis = analyzeIdea(ideaText)

    const session = await Session.create({
      userId: req.user._id,
      title,
      ideaText,
      context: analysis.context,
      status: analysis.status,
      verdict: analysis.verdict,
      agents: analysis.agents,
      marketScore: analysis.marketScore,
      techScore: analysis.techScore,
      financeScore: analysis.financeScore,
      activity: new Date(),
      consensus: analysis.consensus,
    })

    const messages = await SessionMessage.insertMany(
      buildSessionMessages({ title, ideaText, analysis }).map((message) => ({
        sessionId: session._id,
        ...message,
      })),
    )

    const tasks = await Task.insertMany(
      buildSuggestedTasks({ title }).map((task) => ({
        userId: req.user._id,
        sessionId: session._id,
        ...task,
      })),
    )

    return res.status(201).json({
      message: 'Session created successfully',
      session: {
        id: session._id,
        title: session.title,
        idea_text: session.ideaText,
        context: session.context,
        status: session.status,
        verdict: session.verdict,
        agents: session.agents,
        market_score: session.marketScore,
        tech_score: session.techScore,
        finance_score: session.financeScore,
        activity: session.activity,
        consensus: session.consensus,
      },
      history: messages.map(serializeMessage),
      tasks: tasks.map(serializeTask),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while creating session' })
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
