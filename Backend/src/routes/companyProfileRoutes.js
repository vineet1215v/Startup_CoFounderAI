import express from 'express'
import {
  createCompanyProfile,
  getCompanyProfile,
  updateCompanyProfile,
} from '../controllers/companyProfileController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/company-profile', getCompanyProfile)
router.post('/company-profile', createCompanyProfile)
router.patch('/company-profile', updateCompanyProfile)

export default router
