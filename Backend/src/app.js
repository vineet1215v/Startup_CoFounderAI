import './config/loadEnv.js'
import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import authRoutes from './routes/authRoutes.js'
import companyProfileRoutes from './routes/companyProfileRoutes.js'
import sessionRoutes from './routes/sessionRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const app = express()
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running' })
})

// Gemini direct integration (Python proxy removed)
  // /api/boardroom/analyze-idea handled by sessionRoutes /api/sessions

const server = createServer(app)

app.use('/api/auth', authRoutes)
app.use('/api', sessionRoutes)
app.use('/api', taskRoutes)
app.use('/api', companyProfileRoutes)

export default app
export { server }
