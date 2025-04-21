import express from 'express'
import { createPost, getAllPosts, toggleLike, createComment, deletePost } from '../controllers/post.controller.js'

const router = express.Router()

router.post('/create', createPost)

router.post('/get-all', getAllPosts)

router.post('/toggle-like', toggleLike)

router.post('/create-comment', createComment)

router.post('/delete-post', deletePost)

export default router
