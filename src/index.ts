import app from './app.js'
import { configDotenv } from 'dotenv'
import { connectDB } from './services/prisma.service.js'

configDotenv()

const port = process.env.PORT || 3000

async function startServer() {
  try {
    await connectDB()
    console.log('Database connected successfully')

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
