import mongoose from "mongoose";
import { NextResponse } from "next/server";
import slugify from "slugify";

import handleError from "@/lib/handlers/error";
import { ValidationError } from "@/lib/http-errors";
import dbConnect from "@/lib/mongoose";
import { SignInWithOAuthSchema } from "@/lib/validators/auth";
import { Account } from "@/models";
import { User } from "@/models";
export async function POST(request: Request) {
  const { provider, providerAccountId, user, tokenData } = await request.json();

  await dbConnect();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validatedData = SignInWithOAuthSchema.safeParse({
      provider,
      providerAccountId,
      user,
    });

    if (!validatedData.success)
      throw new ValidationError(validatedData.error.flatten().fieldErrors);

    const { name, username, email, image } = user;

    // Normalize email to lowercase for consistency
    const normalizedEmail = email.toLowerCase();

    const slugifiedUsername = slugify(username, {
      lower: true,
      strict: true,
      trim: true,
    });

    let existingUser = await User.findOne({ email: normalizedEmail }).session(session);

    if (!existingUser) {
      [existingUser] = await User.create(
        [{ name, username: slugifiedUsername, email: normalizedEmail, image }],
        { session }
      );
    } else {
      const updatedData: { name?: string; image?: string } = {};

      if (existingUser.name !== name) updatedData.name = name;
      if (existingUser.image !== image) updatedData.image = image;

      if (Object.keys(updatedData).length > 0) {
        await User.updateOne(
          { _id: existingUser._id },
          { $set: updatedData }
        ).session(session);
      }
    }

    const existingAccount = await Account.findOne({
      userId: existingUser._id,
      provider,
      providerAccountId,
    }).session(session);

    // Prepare token fields for Google provider
    const googleTokenFields =
      provider === "google" && tokenData
        ? {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            tokenExpiresAt: tokenData.tokenExpiresAt,
            calendarScope: tokenData.calendarScope,
          }
        : {};

    if (!existingAccount) {
      await Account.create(
        [
          {
            userId: existingUser._id,
            name,
            image,
            provider,
            providerAccountId,
            ...googleTokenFields,
          },
        ],
        { session }
      );
    } else if (provider === "google" && tokenData) {
      // Update existing account with new tokens
      await Account.updateOne(
        { _id: existingAccount._id },
        { $set: googleTokenFields }
      ).session(session);
    }

    await session.commitTransaction();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    await session.abortTransaction();
    return handleError(error, "api") as APIErrorResponse;
  } finally {
    session.endSession();
  }
}
