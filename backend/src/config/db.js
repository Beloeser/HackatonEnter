import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('MongoDB conectado com sucesso')
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message)
    process.exit(1)
  }
}

export default connectDB
