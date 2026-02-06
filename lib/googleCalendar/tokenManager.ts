"use server";

import { google } from "googleapis";
import dbConnect from "@/lib/mongoose";
import { Account } from "@/models";

const oauth2Client = new google.auth.OAuth2(
  process.env.AUTH_GOOGLE_ID,
  process.env.AUTH_GOOGLE_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
);

/**
 * Get a valid access token for a user, refreshing if necessary
 */
export async function getValidAccessToken(
  userId: string
): Promise<string | null> {
  await dbConnect();

  const account = await Account.findOne({
    userId,
    provider: "google",
  });

  if (!account || !account.accessToken) {
    return null;
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  const now = new Date();
  const expiresAt = account.tokenExpiresAt
    ? new Date(account.tokenExpiresAt)
    : null;
  const isExpiringSoon =
    expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (isExpiringSoon && account.refreshToken) {
    try {
      const newTokens = await refreshAccessToken(account.refreshToken);
      if (newTokens) {
        // Update tokens in database
        await Account.updateOne(
          { _id: account._id },
          {
            $set: {
              accessToken: newTokens.accessToken,
              tokenExpiresAt: newTokens.expiresAt,
            },
          }
        );
        return newTokens.accessToken;
      }
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      return null;
    }
  }

  return account.accessToken;
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
} | null> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      return null;
    }

    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000), // Default 1 hour
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
}

/**
 * Check if a user has Google Calendar connected
 */
export async function hasGoogleCalendarConnected(
  userId: string
): Promise<boolean> {
  await dbConnect();

  const account = await Account.findOne({
    userId,
    provider: "google",
    accessToken: { $exists: true, $ne: null },
  });

  return !!account;
}

/**
 * Get the OAuth2 client configured with user's tokens
 */
export async function getOAuth2Client(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    throw new Error("No valid access token available");
  }

  const client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  client.setCredentials({ access_token: accessToken });

  return client;
}

/**
 * Disconnect Google Calendar for a user
 */
export async function disconnectGoogleCalendar(userId: string): Promise<void> {
  await dbConnect();

  await Account.updateOne(
    { userId, provider: "google" },
    {
      $unset: {
        accessToken: "",
        refreshToken: "",
        tokenExpiresAt: "",
        calendarScope: "",
      },
    }
  );
}
