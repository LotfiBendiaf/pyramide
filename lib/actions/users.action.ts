import User, { IUser } from "@/models/user.model";
import handleError from "../handlers/error";
import dbConnect from "../mongoose";

export async function fetchUsers(): Promise<ActionResponse<IUser[]>> {
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

export async function fetchUserById(
  id: string
): Promise<ActionResponse<IUser>> {
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

    const agents = await User.find({ role: "ADMIN" }).sort({ createdAt: -1 });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(agents)),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
