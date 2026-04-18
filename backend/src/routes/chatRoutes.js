import express from 'express'
import { postChatMessage } from '../controllers/chatController.js'

const router = express.Router()

router.post('/', postChatMessage)

export default router
