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

    res.json({ posts: posts.reverse() })
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
        clerkId,
      },
      select: {
        id: true,
      },
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

    if (!userId) {
      throw new Error('User id is not provided')
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

      res.json({ message: 'Like removed Successfully' })
      return
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

    res.json({ message: 'Like created successfully' })
    return
  } catch {
    res.status(400).json({ error: 'Failed to toggle the like' })
    return
  }
}

interface CreateCommentRequestBody {
  postId: string
  content: string
  userId: string
}

const createComment = async (req: Request<object, object, CreateCommentRequestBody>, res: Response) => {
  try {
    const { postId, content, userId } = req.body

    // ! Check if the post exists and get the author id to create notification
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    })

    if (!post) {
      throw new Error("Post doesn't exist.")
    }

    const { authorId } = post

    await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: content,
          authorId: userId,
          postId: postId,
        },
      }),
      prisma.notification.create({
        data: {
          type: 'COMMENT',
          postId,
          creatorId: userId,
          userId: authorId,
        },
      }),
    ])

    res.json({ message: `Comment created successfully.` })
    return
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
    return
  }
}

interface DeletePostRequestBody {
  postId: string
  userId: string
}

const deletePost = async (req: Request<object, object, DeletePostRequestBody>, res: Response) => {
  try {
    const { postId, userId } = req.body

    //! Check if the post exists and get the authorId
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        authorId: true,
      },
    })

    if (!post) throw new Error("Post doesn't exists")

    const { authorId } = post

    //! Check if the user is eligible to delete the post
    if (userId !== authorId) throw new Error('You are not authorized to delete the post')

    await prisma.$transaction([
      prisma.like.deleteMany({
        where: {
          postId,
        },
      }),
      prisma.comment.deleteMany({
        where: {
          postId,
        },
      }),
      prisma.post.delete({
        where: {
          id: postId,
        },
      }),
    ])

    res.json({ message: `Post deleted successfully.` })
    return
  } catch (error) {
    console.log(error)
    res.status(400).json({ error: (error as Error).message })
    return
  }
}

export { createPost, getAllPosts, toggleLike, createComment, deletePost }
