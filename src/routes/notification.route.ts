import express from 'express'
import { getAllNotifications } from '../controllers/notification.controller.js'

const router = express.Router()

router.post('/get-all', getAllNotifications)

export default router
