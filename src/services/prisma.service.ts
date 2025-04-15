import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('🔌 Connected to MongoDB database')
  } catch (error) {
    console.log('❌ Unable to connect to the database:', error)
    process.exit(1)
  }
}

export { connectDB }
export default prisma
