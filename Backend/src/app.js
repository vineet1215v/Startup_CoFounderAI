import './config/loadEnv.js'
import cors from 'cors'
import express from 'express'
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

app.use('/api/auth', authRoutes)
app.use('/api', sessionRoutes)
app.use('/api', taskRoutes)
app.use('/api', companyProfileRoutes)

export default app
