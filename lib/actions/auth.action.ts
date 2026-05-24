"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";

import { signIn } from "@/auth";

import action from "../handlers/action";
import handleError from "../handlers/error";
import {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
} from "../validators/auth";
import { NotFoundError } from "../http-errors";
import { Account, PasswordResetToken, User } from "@/models";
import { sendEmail } from "../email/emailService";

const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60;
const PASSWORD_RESET_SUCCESS_MESSAGE =
  "If an account exists with this email, a reset link has been sent.";

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function getPasswordResetEmailHtml(resetLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Réinitialisation du mot de passe</h1>
      <p>Vous avez demandé la réinitialisation du mot de passe de votre compte Pyramide Immobilier.</p>
      <p>Ce lien est valable pendant 1 heure.</p>
      <p>
        <a href="${resetLink}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 18px; border-radius: 6px; text-decoration: none;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
    </div>
  `;
}

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

export async function requestPasswordReset(params: {
  email: string;
}): Promise<ActionResponse<string>> {
  const validationResult = await action({ params, schema: ForgotPasswordSchema });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { email } = validationResult.params!;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return { success: true, data: PASSWORD_RESET_SUCCESS_MESSAGE };
    }

    const existingAccount = await Account.findOne({
      provider: "credentials",
      providerAccountId: email,
      password: { $exists: true },
    });

    if (!existingAccount) {
      return { success: true, data: PASSWORD_RESET_SUCCESS_MESSAGE };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await PasswordResetToken.updateMany(
      { userId: existingUser._id, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    );

    await PasswordResetToken.create({
      userId: existingUser._id,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(
      token
    )}`;

    const emailResult = await sendEmail(
      email,
      "Réinitialisation de votre mot de passe - Pyramide",
      getPasswordResetEmailHtml(resetLink)
    );

    if (!emailResult.success) {
      console.error("Password reset email failed:", emailResult.error);
    }

    return { success: true, data: PASSWORD_RESET_SUCCESS_MESSAGE };
  } catch (error) {
    console.error("Password reset request failed:", error);
    return { success: true, data: PASSWORD_RESET_SUCCESS_MESSAGE };
  }
}

export async function verifyPasswordResetToken(
  token?: string
): Promise<ActionResponse> {
  await action({});

  if (!token) {
    return {
      success: false,
      status: 400,
      error: { message: "Lien de réinitialisation invalide." },
    };
  }

  const resetToken = await PasswordResetToken.findOne({
    tokenHash: hashResetToken(token),
    expiresAt: { $gt: new Date() },
    usedAt: { $exists: false },
  });

  if (!resetToken) {
    return {
      success: false,
      status: 400,
      error: {
        message:
          "Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
      },
    };
  }

  return { success: true };
}

export async function resetPassword(params: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionResponse> {
  const validationResult = await action({ params, schema: ResetPasswordSchema });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { token, password } = validationResult.params!;
  const tokenHash = hashResetToken(token);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    }).session(session);

    if (!resetToken) {
      await session.abortTransaction();
      return {
        success: false,
        status: 400,
        error: {
          message:
            "Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedAccount = await Account.findOneAndUpdate(
      { userId: resetToken.userId, provider: "credentials" },
      { $set: { password: hashedPassword } },
      { new: true, session }
    );

    if (!updatedAccount) {
      await session.abortTransaction();
      return {
        success: false,
        status: 400,
        error: {
          message:
            "Ce lien ne peut pas être utilisé pour réinitialiser ce compte.",
        },
      };
    }

    await PasswordResetToken.updateMany(
      { userId: resetToken.userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } },
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
