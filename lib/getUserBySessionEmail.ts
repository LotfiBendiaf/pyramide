// lib/getUserBySessionEmail.ts
import { auth } from "@/auth"; // adjust depending on your NextAuth setup
import dbConnect from "./mongoose";
import { User } from "@/models";

export async function getUserBySessionEmail(): Promise<ActionResponse<User>> {
  // get the session
  const session = await auth();

  if (!session?.user?.email) {
    return { success: false };
  }

  await dbConnect();

  const normalizedEmail = session.user.email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  return { success: true, data: JSON.parse(JSON.stringify(user)) };
}
