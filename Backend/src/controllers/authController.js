import '../config/loadEnv.js'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { createToken } from '../middleware/auth.js'

const normalizeName = (name = '') => String(name).trim()
const normalizeEmail = (email = '') => String(email).trim().toLowerCase()

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
})

export const registerUser = async (req, res) => {
  try {
    const normalizedName = normalizeName(req.body.name)
    const normalizedEmail = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Please fill all fields' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    })

    return res.status(201).json({
      message: 'Account created successfully',
      token: createToken(user._id),
      user: buildUserResponse(user),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while registering user' })
  }
}

export const loginUser = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    return res.status(200).json({
      message: 'Login successful',
      token: createToken(user._id),
      user: buildUserResponse(user),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error while logging in' })
  }
}

export const getCurrentUser = async (req, res) =>
  res.status(200).json({
    user: buildUserResponse(req.user),
  })
