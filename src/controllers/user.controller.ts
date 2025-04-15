import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

type CreateUpdateRequestBody = {
  clerkId: string
  username: string
  email: string
  name: string
  image: string
}

const createUser = async (req: Request<object, object, CreateUpdateRequestBody>, res: Response) => {
  try {
    const { clerkId = '', email = '', name = '', image = '', username = '' } = req.body

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    })

    if (existingUser) {
      res.json({ user: existingUser })
      return
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        username,
        name,
        image,
      },
    })

    res.json({ user: newUser })
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
  }
}

export { createUser }
