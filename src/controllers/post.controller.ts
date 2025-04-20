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

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    res.json({ posts })
  } catch {
    res.status(400).json({ error: 'Error occurred during fetching posts' })
  }
}

type ToggleLikeRequestBodyType = {
  postId: string
  userId: string | undefined
}

const toggleLike = async (req: Request<object, object, ToggleLikeRequestBodyType>, res: Response) => {
  try {
    const { postId, userId: clerkId } = req.body
   
    if (!postId) {
      throw new Error('Post id is not provided')
    }

    if (!clerkId) {
      throw new Error('User id is not provided')
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId
      },
      select: {
        id: true,
      }
    })

    const userId = user?.id

    // ! Check if the post exists => if true, extract author id to create notification
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    })

    if (!post) {
      throw new Error("Post doesn't exists")
    }

    // ! Check if the like already exists?
    const doesLikeExists = await prisma.like.findUnique({
      where: {
        userId_postId: {
          postId,
          userId,
        },
      },
    })

    if (doesLikeExists) {
      await prisma.like.delete({
        where: {
          userId_postId: {
            postId,
            userId,
          },
        },
      })

      return res.json({ message: 'Like removed Successfully' })
    }

    await prisma.$transaction([
      prisma.like.create({
        data: {
          userId,
          postId,
        },
      }),
      ...(post.authorId !== userId
        ? [
            prisma.notification.create({
              data: {
                type: 'LIKE',
                creatorId: userId,
                userId: post.authorId,
                postId,
              },
            }),
          ]
        : []),
    ])

    return res.json({message: "Like created successfully"})
  } catch {
    return res.status(400).json({error: "Failed to toggle the like"})
  }
}

export { createPost, getAllPosts, toggleLike }
