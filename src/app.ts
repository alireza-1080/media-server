import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import userRouter from './routes/user.route.js'
import postRouter from './routes/post.route.js'
import notificationRouter from './routes/notification.route.js'
const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Error handler for JSON parsing
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON format' })
    return
  }
  next(err)
})

app.get('/', (req, res) => {
  res.json('Server is 🏃‍♂️‍➡️🏃‍♂️‍➡️🏃‍♂️‍➡️')
})

app.use('/user', userRouter)

app.use('/post', postRouter)

app.use('/notification', notificationRouter)

export default app
