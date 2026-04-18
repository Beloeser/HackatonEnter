import express from 'express'
import authRoutes from './authRoutes.js'
import {
  analisarContratoSelecionado,
  listarContratosEmAndamento,
} from '../controllers/analiseController.js'
import { postChatMessage } from '../controllers/chatController.js'

const router = express.Router()

router.use('/', authRoutes)
router.get('/analise/contratos-em-andamento', listarContratosEmAndamento)
router.post('/analise/analisar-contrato', analisarContratoSelecionado)
router.post('/chat', postChatMessage)

export default router
