import express from 'express'
import helmet from 'helmet'
import cors from 'cors'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.json('Server is 🏃‍♂️‍➡️🏃‍♂️‍➡️🏃‍♂️‍➡️')
})

export default app
