"use server";

import bcrypt from "bcryptjs";
import User from "@/models/user.model";
import Account from "@/models/account.model";
import handleError from "../handlers/error";
import dbConnect from "../mongoose";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import {
  CreateUserSchema,
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export async function fetchUsers(): Promise<ActionResponse<User[]>> {
  try {
    await dbConnect();

    const users = await User.find().sort({ createdAt: -1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(users)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchUserById(id: string): Promise<ActionResponse<User>> {
  try {
    await dbConnect();

    const user = await User.findById(id).lean();

    if (!user) {
      return {
        success: false,
        error: { message: "Utilisateur introuvable" },
        status: 404,
      };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(user)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchAgents(): Promise<ActionResponse<User[]>> {
  try {
    await dbConnect();

    const agents = await User.find({ role: "AGENT" })
      .select("firstname lastname email")
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(agents)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function fetchTeamMembers(): Promise<ActionResponse<User[]>> {
  try {
    const currentUser = await getUserBySessionEmail();

    if (!currentUser?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    const isAdmin =
      currentUser.data.role === "ADMIN" || currentUser.data.role === "MANAGER";

    if (!isAdmin) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    await dbConnect();

    const users = await User.find({
      role: { $in: ["ADMIN", "MANAGER", "AGENT", "ASSISTANT"] },
    })
      .select("-twoFactorSecret")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      data: JSON.parse(JSON.stringify(users)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function createUser(
  data: CreateUserInput
): Promise<ActionResponse<User>> {
  try {
    const currentUser = await getUserBySessionEmail();

    if (!currentUser?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    const isAdmin =
      currentUser.data.role === "ADMIN" || currentUser.data.role === "MANAGER";

    if (!isAdmin) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    const validationResult = CreateUserSchema.safeParse(data);

    if (!validationResult.success) {
      return {
        success: false,
        error: { message: validationResult.error.errors[0].message },
        status: 400,
      };
    }

    await dbConnect();

    // Check if email already exists
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });

    if (existingUser) {
      return {
        success: false,
        error: { message: "Cette adresse email est déjà utilisée" },
        status: 409,
      };
    }

    // Generate username from firstname and lastname
    const username =
      `${data.firstname.toLowerCase()}.${data.lastname.toLowerCase()}`.replace(
        /\s+/g,
        ""
      );
    const name = `${data.firstname} ${data.lastname}`;

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Use a transaction to create both User and Account
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [user] = await User.create(
        [
          {
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email.toLowerCase(),
            phone: data.phone,
            role: data.role,
            username,
            name,
          },
        ],
        { session }
      );

      await Account.create(
        [
          {
            userId: user._id,
            name: username,
            provider: "credentials",
            providerAccountId: data.email.toLowerCase(),
            password: hashedPassword,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      revalidatePath("/dashboard/users");

      return {
        success: true,
        data: JSON.parse(JSON.stringify(user)),
        status: 201,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
): Promise<ActionResponse<User>> {
  try {
    const currentUser = await getUserBySessionEmail();

    if (!currentUser?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    const isAdmin =
      currentUser.data.role === "ADMIN" || currentUser.data.role === "MANAGER";

    if (!isAdmin) {
      return {
        success: false,
        error: { message: "Accès refusé" },
        status: 403,
      };
    }

    await dbConnect();

    // If email is being updated, check for duplicates
    if (data.email) {
      const existingUser = await User.findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: id },
      });

      if (existingUser) {
        return {
          success: false,
          error: { message: "Cette adresse email est déjà utilisée" },
          status: 409,
        };
      }
    }

    const updateData: Record<string, unknown> = { ...data };

    // Update name if firstname or lastname is changed
    if (data.firstname || data.lastname) {
      const existingUser = await User.findById(id);
      if (existingUser) {
        const firstname = data.firstname || existingUser.firstname;
        const lastname = data.lastname || existingUser.lastname;
        updateData.name = `${firstname} ${lastname}`;
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    if (!user) {
      return {
        success: false,
        error: { message: "Utilisateur introuvable" },
        status: 404,
      };
    }

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${id}`);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(user)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

export async function deleteUser(id: string): Promise<ActionResponse<null>> {
  try {
    const currentUser = await getUserBySessionEmail();

    if (!currentUser?.data) {
      return {
        success: false,
        error: { message: "Non autorisé" },
        status: 401,
      };
    }

    // Only ADMIN can delete users
    if (currentUser.data.role !== "ADMIN") {
      return {
        success: false,
        error: {
          message: "Seul un administrateur peut supprimer des utilisateurs",
        },
        status: 403,
      };
    }

    // Prevent self-deletion
    if (currentUser.data._id === id) {
      return {
        success: false,
        error: { message: "Vous ne pouvez pas supprimer votre propre compte" },
        status: 400,
      };
    }

    await dbConnect();

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return {
        success: false,
        error: { message: "Utilisateur introuvable" },
        status: 404,
      };
    }

    revalidatePath("/dashboard/users");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
