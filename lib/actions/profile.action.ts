"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongoose";
import { User } from "@/models";
import { revalidatePath } from "next/cache";

export async function switchManagerProfile(
  profile: "ADMIN" | "AGENT"
): Promise<ActionResponse<{ activeProfile: "ADMIN" | "AGENT" }>> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  await dbConnect();
  const user = await User.findOneAndUpdate(
    { email: session.user.email.toLowerCase(), role: "MANAGER" },
    { $set: { activeProfile: profile } },
    { new: true }
  ).select("activeProfile");

  if (!user) {
    return { success: false, error: { message: "Le double profil est réservé au compte du gérant" }, status: 403 };
  }

  revalidatePath("/dashboard", "layout");
  return { success: true, data: { activeProfile: user.activeProfile ?? profile }, status: 200 };
}
