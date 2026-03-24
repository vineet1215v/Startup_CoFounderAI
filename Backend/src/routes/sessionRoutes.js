import express from 'express'
import {
  createSession,
  getSessionById,
  getVaultSummary,
  listSessions,
  analyzeSessionChat
} from '../controllers/sessionController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/boardroom/analyze-idea', createSession)

router.use(requireAuth)

router.get('/vault/summary', getVaultSummary)
router.get('/sessions', listSessions)
router.post('/sessions', createSession)
router.get('/sessions/:id', getSessionById)
router.post('/sessions/:sessionId/analyze-chat', analyzeSessionChat);

export default router
