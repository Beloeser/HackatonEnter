import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import routes from './routes/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const REQUIRE_DB = String(process.env.REQUIRE_DB || 'false').toLowerCase() === 'true'

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rotas
app.get('/health', (req, res) => {
  res.json({ status: 'OK' })
})

app.use('/api', routes)

const startServer = async () => {
  try {
    await connectDB()
  } catch (error) {
    if (REQUIRE_DB) {
      throw error
    }

    console.warn(`Aviso: backend iniciado sem conexao com MongoDB (${error.message}).`)
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Erro ao iniciar servidor:', error)
  process.exit(1)
})
