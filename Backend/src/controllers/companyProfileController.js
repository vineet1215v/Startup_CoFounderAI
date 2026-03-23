import CompanyProfile from '../models/CompanyProfile.js'

const serializeProfile = (profile) => ({
  id: profile._id,
  startup_name: profile.startupName,
  tagline: profile.tagline,
  industry: profile.industry,
  stage: profile.stage,
  problem: profile.problem,
  solution: profile.solution,
  target_audience: profile.targetAudience,
  website: profile.website,
  fundraising_stage: profile.fundraisingStage,
  team_size: profile.teamSize,
  updated_at: profile.updatedAt,
})

const buildProfileUpdates = (body) => {
  const updates = {}

  if (body.startup_name !== undefined) updates.startupName = String(body.startup_name).trim()
  if (body.startupName !== undefined) updates.startupName = String(body.startupName).trim()
  if (body.tagline !== undefined) updates.tagline = String(body.tagline).trim()
  if (body.industry !== undefined) updates.industry = String(body.industry).trim()
  if (body.stage !== undefined) updates.stage = String(body.stage).trim()
  if (body.problem !== undefined) updates.problem = String(body.problem).trim()
  if (body.solution !== undefined) updates.solution = String(body.solution).trim()
  if (body.target_audience !== undefined) updates.targetAudience = String(body.target_audience).trim()
  if (body.targetAudience !== undefined) updates.targetAudience = String(body.targetAudience).trim()
  if (body.website !== undefined) updates.website = String(body.website).trim()
  if (body.fundraising_stage !== undefined) updates.fundraisingStage = String(body.fundraising_stage).trim()
  if (body.fundraisingStage !== undefined) updates.fundraisingStage = String(body.fundraisingStage).trim()
  if (body.team_size !== undefined) updates.teamSize = Number(body.team_size)
  if (body.teamSize !== undefined) updates.teamSize = Number(body.teamSize)

  return updates
}

export const getCompanyProfile = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOne({ userId: req.user._id })

    return res.status(200).json({
      profile: profile ? serializeProfile(profile) : null,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while loading company profile' })
  }
}

export const createCompanyProfile = async (req, res) => {
  try {
    const existingProfile = await CompanyProfile.findOne({ userId: req.user._id })

    if (existingProfile) {
      return res.status(400).json({ message: 'Company profile already exists for this user' })
    }

    const profile = await CompanyProfile.create({
      userId: req.user._id,
      ...buildProfileUpdates(req.body),
    })

    return res.status(201).json({
      message: 'Company profile created successfully',
      profile: serializeProfile(profile),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while creating company profile' })
  }
}

export const updateCompanyProfile = async (req, res) => {
  try {
    const profile = await CompanyProfile.findOneAndUpdate(
      { userId: req.user._id },
      buildProfileUpdates(req.body),
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    )

    return res.status(200).json({
      message: 'Company profile saved successfully',
      profile: serializeProfile(profile),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while saving company profile' })
  }
}
