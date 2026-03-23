import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Add it to Backend/.env or the root .env file.')
  }

  return process.env.JWT_SECRET
}

export const createToken = (userId) =>
  jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: '7d',
  })

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const [scheme, token] = authHeader.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, getJwtSecret())
    const user = await User.findById(decoded.userId).select('_id name email')

    if (!user) {
      return res.status(401).json({ message: 'User not found for this token' })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
