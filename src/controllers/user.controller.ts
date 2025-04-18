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
      const updatedUser = await prisma.user.update({
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
            },
          },
        },
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
            posts: true,
          },
        },
      },
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
    res.status(400).json({
      error: 'Check the server console for more info about the error',
    })
    return
  }
}

type GetRandomUsersRequestBody = {
  clerkId: string
  count: number
}

const getRandomUsers = async (req: Request<object, object, GetRandomUsersRequestBody>, res: Response) => {
  const { clerkId, count } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    })
    const userId = user?.id

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: { followerId: userId },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        image: true,
        name: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      take: count,
    })

    res.json({ users: users })
  } catch {
    res.status(400).json({ users: [] })
  }
}

type FollowUserRequestBodyType = {
  followerId: string
  followingId: string
}

const followUser = async (req: Request<object, object, FollowUserRequestBodyType>, res: Response) => {
  const { followerId, followingId } = req.body
  try {
    if (typeof followerId !== 'string' && typeof followingId !== 'string') {
      throw new Error('Follower id or Following id is not a string')
    }

    if (followerId === followingId) {
      throw new Error("You cannot follow yourself")
    }

    const doesFollowExists = await prisma.follow.findUnique({
      where: {
        followerId_followingId:{
          followerId,
          followingId
        }
      }
    })

    if (doesFollowExists) {
      throw new Error("You are already following this user.")
    }

    await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      }),
      prisma.notification.create({
        data: {
          userId: followingId,
          creatorId: followerId,
          type: 'FOLLOW'
        }
      })
    ])

    return res.json({message: "Follow created successfully"})
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message })
  }
}

export { createUser, getRandomUsers, followUser }
