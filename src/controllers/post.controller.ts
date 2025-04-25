import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

interface createPostRequestBodyType {
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

interface ToggleLikeRequestBodyType {
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
  } catch (error) {
    console.error('Error in toggleLike:', error)
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to toggle the like' })
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

    if (!postId) {
      throw new Error('Post ID is required for comments')
    }

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

    // Create comment first
    const comment = await prisma.comment.create({
      data: {
        content: content,
        authorId: userId,
        postId: postId,
      },
    })

    // Create notification with the comment ID
    await prisma.notification.create({
      data: {
        type: 'COMMENT',
        postId,
        creatorId: userId,
        userId: authorId,
        commentId: comment.id,
      },
    })

    res.json({ message: `Comment created successfully.` })
    return
  } catch (error) {
    console.error('Error in createComment:', error)
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create comment' })
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

interface GetPostsByUsernameRequestBody {
  username: string
}

const getPostsByUserName = async (req: Request<object, object, GetPostsByUsernameRequestBody>, res: Response) => {
  try {
    const { username } = req.body
    
    if (!username) throw new Error('Clerk ID is required')

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
      },
    })

    if (!user) throw new Error('User not found')

    const { id: userId } = user
    
    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
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
                name: true,
                image: true,
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle known validation errors
      if (error.message === 'Clerk ID is required' || error.message === 'User not found') {
        res.status(400).json({ error: error.message })
        return
      }
    }

    const err = error as { constructor: { name: string }; message: string }

    // Handle Prisma specific errors
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
      res.status(400).json({
        error: 'Invalid request parameters',
        details: err.message,
      })
      return
    }

    if (err.constructor.name === 'PrismaClientValidationError') {
      res.status(422).json({
        error: 'Invalid data format',
        details: err.message,
      })
      return
    }

    // Log and handle unexpected errors
    console.error('Unexpected error in getPostByClerkId:', err)
    res.status(500).json({
      error: 'An unexpected error occurred while fetching posts',
    })
  }
}

export { createPost, getAllPosts, toggleLike, createComment, deletePost, getPostsByUserName }
