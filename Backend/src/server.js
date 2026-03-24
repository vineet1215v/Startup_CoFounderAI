import './config/loadEnv.js'
import app, { server } from './app.js'
import connectDB from './config/db.js'

const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

startServer()
