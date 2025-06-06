import { Request, Response } from "express";
import prisma from "../services/prisma.service.js";

interface CreateUpdateRequestBody {
  clerkId: string;
  username: string;
  email: string;
  name: string;
  image: string;
}

const createUser = async (
  req: Request<object, object, CreateUpdateRequestBody>,
  res: Response,
) => {
  try {
    const {
      clerkId = "",
      email = "",
      name = "",
      image = "",
      username = "",
    } = req.body;

    if (!clerkId) {
      throw new Error("ClerkId is required");
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    });

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
      });

      res.json({ user: updatedUser });
      return;
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
    });

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    res.status(201).json({ user: newUser });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "ClerkId is required") {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    if (err.constructor.name === "PrismaClientKnownRequestError") {
      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    if (err.constructor.name === "PrismaClientValidationError") {
      res.status(422).json({
        error: "Invalid data format",
        details: err.message,
      });
      return;
    }

    console.error("Unexpected error in createUser:", err);
    res.status(500).json({
      error: "An unexpected error occurred while creating/updating user",
    });
  }
};

interface UpdateUserByFormDataRequestBody {
  userId: string;
  name: string;
  bio: string;
  location: string;
  website: string;
}

const updateUserByFormData = async (
  req: Request<object, object, UpdateUserByFormDataRequestBody>,
  res: Response,
) => {
  try {
    const { userId, name } = req.body;
    const { bio = "", location = "", website = "" } = req.body;

    if (!userId) {
      throw new Error("UserId is required");
    }

    if (!name) {
      throw new Error("Name is required");
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        bio,
        location,
        website,
      },
    });

    res.json({ message: "User updated successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle known validation errors
      const clientErrors = ["UserId is required", "Name is required"];

      if (clientErrors.includes(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    // Handle Prisma specific errors
    if (err.constructor.name === "PrismaClientKnownRequestError") {
      if (err.message.includes("Record to update not found")) {
        res.status(404).json({
          error: "User not found",
        });
        return;
      }

      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    if (err.constructor.name === "PrismaClientValidationError") {
      res.status(422).json({
        error: "Invalid data format",
        details: err.message,
      });
      return;
    }

    // Log and handle unexpected errors
    console.error("Unexpected error in updateUserByFormData:", err);
    res.status(500).json({
      error: "An unexpected error occurred while updating user",
    });
  }
};

interface GetRandomUsersRequestBody {
  clerkId: string;
  count: number;
}

const getRandomUsers = async (
  req: Request<object, object, GetRandomUsersRequestBody>,
  res: Response,
) => {
  try {
    const { clerkId, count } = req.body;

    if (!clerkId) {
      throw new Error("ClerkId is required");
    }

    if (!count || count < 1) {
      throw new Error("Valid count parameter is required");
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user.id;

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
    });

    res.json({ users });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        [
          "ClerkId is required",
          "Valid count parameter is required",
          "User not found",
        ].includes(error.message)
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    if (err.constructor.name === "PrismaClientKnownRequestError") {
      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    console.error("Unexpected error in getRandomUsers:", err);
    res.status(500).json({
      error: "An unexpected error occurred while fetching random users",
    });
  }
};

interface FollowUserRequestBodyType {
  followerId: string;
  followingId: string;
}

const followUser = async (
  req: Request<object, object, FollowUserRequestBodyType>,
  res: Response,
) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      throw new Error("Both followerId and followingId are required");
    }

    if (followerId === followingId) {
      throw new Error("You cannot follow yourself");
    }

    const doesFollowExists = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (doesFollowExists) {
      throw new Error("You are already following this user");
    }

    await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      }),
      prisma.notification.create({
        data: {
          userId: followingId,
          creatorId: followerId,
          type: "FOLLOW",
        },
      }),
    ]);

    res.status(201).json({ message: "Follow created successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const clientErrors = [
        "Both followerId and followingId are required",
        "You cannot follow yourself",
        "You are already following this user",
      ];

      if (clientErrors.includes(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    if (err.constructor.name === "PrismaClientKnownRequestError") {
      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    if (err.constructor.name === "PrismaClientValidationError") {
      res.status(422).json({
        error: "Invalid data format",
        details: err.message,
      });
      return;
    }

    console.error("Unexpected error in followUser:", err);
    res.status(500).json({
      error: "An unexpected error occurred while following user",
    });
  }
};

interface UnfollowUserRequestBody {
  followerId: string;
  followingId: string;
}

const unfollowUser = async (
  req: Request<object, object, UnfollowUserRequestBody>,
  res: Response,
) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId) {
      throw new Error("FollowerId is required");
    }

    if (!followingId) {
      throw new Error("FollowingId is required");
    }

    if (followerId === followingId) {
      throw new Error("You cannot unfollow yourself");
    }

    const doesFollowExists = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!doesFollowExists) {
      throw new Error("You are not following this user");
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    res.json({ message: "Unfollowed successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle known validation errors
      const clientErrors = [
        "FollowerId is required",
        "FollowingId is required",
        "You cannot unfollow yourself",
        "You are not following this user",
      ];

      if (clientErrors.includes(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    // Handle Prisma specific errors
    if (err.constructor.name === "PrismaClientKnownRequestError") {
      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    if (err.constructor.name === "PrismaClientValidationError") {
      res.status(422).json({
        error: "Invalid data format",
        details: err.message,
      });
      return;
    }

    // Log and handle unexpected errors
    console.error("Unexpected error in unfollowUser:", err);
    res.status(500).json({
      error: "An unexpected error occurred while unfollowing user",
    });
  }
};

interface GetUserByUsernameRequestBody {
  username: string;
}

const getUserByUsername = async (
  req: Request<object, object, GetUserByUsernameRequestBody>,
  res: Response,
) => {
  try {
    const { username } = req.body;

    if (!username) {
      throw new Error("Username is required");
    }

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            followings: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    res.json({ user });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Username is required") {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    if (err.constructor.name === "PrismaClientKnownRequestError") {
      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    if (err.constructor.name === "PrismaClientValidationError") {
      res.status(422).json({
        error: "Invalid data format",
        details: err.message,
      });
      return;
    }

    console.error("Unexpected error in getUserByUsername:", err);
    res.status(500).json({
      error: "An unexpected error occurred while fetching user data",
    });
  }
};

interface IsCurrentUserFollowingRequestBody {
  profileOwnerUsername: string;
  visitorClerkId: string;
}

const isCurrentUserFollowing = async (
  req: Request<object, object, IsCurrentUserFollowingRequestBody>,
  res: Response,
) => {
  try {
    const { profileOwnerUsername, visitorClerkId } = req.body;

    if (!profileOwnerUsername)
      throw new Error("Profile owner username is required");
    if (!visitorClerkId) throw new Error("Visitor clerk id is required");

    const profileOwner = await prisma.user.findUnique({
      where: {
        username: profileOwnerUsername,
      },
      select: {
        id: true,
      },
    });

    if (!profileOwner) throw new Error("Profile owner not found");

    const { id: profileOwnerId } = profileOwner;

    const visitor = await prisma.user.findUnique({
      where: {
        clerkId: visitorClerkId,
      },
      select: {
        id: true,
      },
    });

    if (!visitor) throw new Error("Visitor not found");

    const { id: visitorId } = visitor;

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: visitorId,
          followingId: profileOwnerId,
        },
      },
    });

    res.json({ isFollowing: Boolean(isFollowing) });
    return;
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Handle known validation errors
      const clientErrors = [
        "Profile owner username is required",
        "Visitor clerk id is required",
        "Profile owner not found",
        "Visitor not found",
      ];

      if (clientErrors.includes(error.message)) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    const err = error as { constructor: { name: string }; message: string };

    // Handle Prisma specific errors
    if (err.constructor.name === "PrismaClientKnownRequestError") {
      res.status(400).json({
        error: "Invalid request parameters",
        details: err.message,
      });
      return;
    }

    if (err.constructor.name === "PrismaClientValidationError") {
      res.status(422).json({
        error: "Invalid data format",
        details: err.message,
      });
      return;
    }

    // Log and handle unexpected errors
    console.error("Unexpected error in isCurrentUserFollowing:", err);
    res.status(500).json({
      error: "An unexpected error occurred while checking follow status",
    });
  }
};

export {
  createUser,
  getRandomUsers,
  followUser,
  getUserByUsername,
  isCurrentUserFollowing,
  unfollowUser,
  updateUserByFormData,
};
