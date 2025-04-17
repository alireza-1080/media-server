import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

type createPostRequestBodyType = {
  authorId: string
  content: string
  image: string
}

const createPost = async (req: Request<object, object, createPostRequestBodyType>, res: Response) => {
  const { authorId, content, image } = req.body
  try {
    await prisma.post.create({
      data: {
        authorId,
        content,
        image,
      },
    })

    res.json({ message: 'Post created successfully' })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
    }
  }
}

export { createPost }
