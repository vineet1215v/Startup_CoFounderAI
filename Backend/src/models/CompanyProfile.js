import mongoose from 'mongoose'

const companyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    startupName: {
      type: String,
      trim: true,
      default: '',
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    stage: {
      type: String,
      trim: true,
      default: 'idea',
    },
    problem: {
      type: String,
      trim: true,
      default: '',
    },
    solution: {
      type: String,
      trim: true,
      default: '',
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    fundraisingStage: {
      type: String,
      trim: true,
      default: '',
    },
    teamSize: {
      type: Number,
      min: 1,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
)

const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema)

export default CompanyProfile
