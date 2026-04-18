import express from 'express'
import { login } from '../controllers/authController.js'
import {
  analisarContratoSelecionado,
  listarContratosEmAndamento,
} from '../controllers/analiseController.js'

const router = express.Router()

router.post('/login', login)
router.get('/analise/contratos-em-andamento', listarContratosEmAndamento)
router.post('/analise/analisar-contrato', analisarContratoSelecionado)

export default router
