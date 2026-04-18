import express from 'express'
import {
  finalizeCaseDecision,
  getCaseById,
  getCaseRecommendation,
  listCases,
} from '../controllers/caseController.js'

const router = express.Router()

router.get('/', listCases)
router.get('/:id/recommendation', getCaseRecommendation)
router.post('/:id/finalize', finalizeCaseDecision)
router.get('/:id', getCaseById)

export default router
