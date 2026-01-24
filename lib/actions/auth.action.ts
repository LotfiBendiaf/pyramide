"use server";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { signIn } from "@/auth";

import action from "../handlers/action";
import handleError from "../handlers/error";
import { SignInSchema, SignUpSchema } from "../validators/auth";
import { NotFoundError } from "../http-errors";
import { Account, User } from "@/models";

export async function signUpWithCredentials(
  params: AuthCredentials
): Promise<ActionResponse> {
  const validationResult = await action({ params, schema: SignUpSchema });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { firstname, lastname, email, password, phone, role } =
    validationResult.params!;

  const username = firstname + lastname;
  const name = firstname + " " + lastname;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({ email }).session(session);

    if (existingUser) {
      throw new Error("User already exists");
    }

    const existingUsername = await User.findOne({ username }).session(session);

    if (existingUsername) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [newUser] = await User.create(
      [{ name, username, firstname, lastname, email, phone, role }],
      {
        session,
      }
    );

    await Account.create(
      [
        {
          userId: newUser._id,
          name: username,
          provider: "credentials",
          providerAccountId: email,
          password: hashedPassword,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    return handleError(error) as ErrorResponse;
  } finally {
    await session.endSession();
  }
}

export async function signInWithCredentials(
  params: Pick<AuthCredentials, "email" | "password">
): Promise<ActionResponse> {
  const validationResult = await action({ params, schema: SignInSchema });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { email, password } = validationResult.params!;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) throw new NotFoundError("Utilisateur");

    const existingAccount = await Account.findOne({
      provider: "credentials",
      providerAccountId: email,
    });

    if (!existingAccount) throw new NotFoundError("Account");

    const passwordMatch = await bcrypt.compare(
      password,
      existingAccount.password
    );

    if (!passwordMatch) throw new Error("Mot de Passe Incorrect");

    await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    return { success: true };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
