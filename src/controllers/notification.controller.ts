import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { Request, Response } from 'express'
import prisma from '../services/prisma.service.js'

interface getAllNotificationsRequestBody {
  clerkId: string
}

const getAllNotifications = async (req: Request<object, object, getAllNotificationsRequestBody>, res: Response) => {
  const { clerkId } = req.body

  try {
    //! check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        clerkId: clerkId,
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const userId = user.id

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            image: true,
            name: true,
          },
        },
        post: {
          select: {
            id: true,
            image: true,
            content: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({ notifications })
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      res.status(400).json({ error: error.message })
      return
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
  }
}

interface markAsReadRequestBody {
  notificationsIds: string[]
}

const markAsRead = async (req: Request<object, object, markAsReadRequestBody>, res: Response) => {
  const { notificationsIds } = req.body

  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationsIds },
      },
      data: {
        read: true,
      },
    })

    res.json({ message: 'Notifications marked as read' })
    return
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      res.status(400).json({ error: error.message })
      return
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message })
      return
    }
  }
}

export { getAllNotifications, markAsRead }
