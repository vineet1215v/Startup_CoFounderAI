import mongoose from 'mongoose'

const sessionMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    agentName: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      trim: true,
      default: 'AGENT_ANALYSIS',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

const SessionMessage = mongoose.model('SessionMessage', sessionMessageSchema)

export default SessionMessage
