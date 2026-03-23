import mongoose from 'mongoose'

const consensusSchema = new mongoose.Schema(
  {
    aggregateConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    recommendation: {
      type: String,
      trim: true,
      default: '',
    },
    recommendedRaise: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
)

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    ideaText: {
      type: String,
      required: true,
      trim: true,
    },
    context: {
      type: String,
      trim: true,
      default: 'Strategic deep-dive session',
    },
    status: {
      type: String,
      enum: ['draft', 'analyzing', 'validated', 'archived'],
      default: 'draft',
    },
    verdict: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    agents: {
      type: [String],
      default: [],
    },
    marketScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    techScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    financeScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    activity: {
      type: Date,
      default: Date.now,
    },
    consensus: {
      type: consensusSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
)

const Session = mongoose.model('Session', sessionSchema)

export default Session
