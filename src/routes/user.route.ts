import express from 'express'
import { createUser, followUser, getRandomUsers, getUserByUsername } from '../controllers/user.controller.js'

const router = express.Router()

router.post('/update', createUser)

router.post('/get-random-users', getRandomUsers)

router.post('/follow-user', followUser)

router.post('/get-user-by-username', getUserByUsername)

export default router
