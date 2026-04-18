import express from 'express'
import { getCaseById, listCases } from '../controllers/caseController.js'

const router = express.Router()

router.get('/', listCases)
router.get('/:id', getCaseById)

export default router
