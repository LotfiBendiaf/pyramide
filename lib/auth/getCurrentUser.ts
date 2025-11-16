import { auth } from "@/auth";
import handleError from "../handlers/error";
import dbConnect from "../mongoose";
import User, { IUserDoc } from "@/models/user.model";

export async function getCurrentUser(): Promise<ActionResponse<IUserDoc>> {
  const session = await auth();

  if (!session?.user?.email) {
    return { success: false, error: { message: "User not authenticated" } };
  }

  try {
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return { success: false, error: { message: "User not found" } };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
