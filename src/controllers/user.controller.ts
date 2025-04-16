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
    const updatedUser =  await prisma.user.update({
        where: {
          clerkId,
        },
        data: {
          email,
          username,
          name,
          image,
        },
        include: {
          _count: {
            select: {
              followers: true,
              followings: true,
              posts: true,
            }
          }
        }
      })

      res.json({ user: updatedUser })
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
      include: {
        _count: {
          select: {
            followers: true,
            followings: true,
            posts: true
          }
        }
      }
    })

    if (!newUser) {
      throw new Error('Something unexpected happened during login/signup process')
    }

    res.json({ user: newUser })
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
    console.log((error as Error).message)
    res.status(400).json({ error: 'Check the server console for more info about the error' })
    return
  }
}

export { createUser }
