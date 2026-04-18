import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI

const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI (ou MONGO_URI) nao configurada no .env.')
  }

  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000
  })
  console.log('MongoDB conectado com sucesso')
}

export default connectDB
