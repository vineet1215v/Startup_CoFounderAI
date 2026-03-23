import express from 'express'
import { getGlobalTasks, updateTask } from '../controllers/taskController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/tasks/global', getGlobalTasks)
router.patch('/tasks/:id', updateTask)

export default router
