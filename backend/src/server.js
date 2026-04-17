import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import routes from './routes/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rotas
app.get('/health', (req, res) => {
  res.json({ status: 'OK' })
})

app.use('/api', routes)

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
