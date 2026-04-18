import express from 'express'
import authRoutes from './authRoutes.js'
import caseRoutes from './caseRoutes.js'
import chatRoutes from './chatRoutes.js'
import {
  analisarContratoSelecionado,
  listarContratosEmAndamento,
} from '../controllers/analiseController.js'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/', authRoutes)
router.use('/cases', caseRoutes)
router.use('/chat', chatRoutes)
router.get('/analise/contratos-em-andamento', listarContratosEmAndamento)
router.post('/analise/analisar-contrato', analisarContratoSelecionado)

export default router
