import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import dbConnect from "@/lib/mongoose";
import { Account, User } from "@/models";

// Remove trailing slash from NEXTAUTH_URL if present
const getBaseUrl = () => (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is the user ID
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/schedule?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/schedule?error=missing_params`
      );
    }

    const redirectUri = `${baseUrl}/api/calendar/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      redirectUri
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/schedule?error=no_token`
      );
    }

    await dbConnect();

    // Check if user already has a Google account linked
    const existingAccount = await Account.findOne({
      userId: state,
      provider: "google",
    });

    if (existingAccount) {
      // Update existing account with new tokens
      await Account.updateOne(
        { _id: existingAccount._id },
        {
          $set: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || existingAccount.refreshToken,
            tokenExpiresAt: tokens.expiry_date
              ? new Date(tokens.expiry_date)
              : undefined,
            calendarScope: tokens.scope,
          },
        }
      );
    } else {
      // Create a new account entry for Google Calendar
      await Account.create({
        userId: state,
        name: "Google Calendar",
        provider: "google",
        providerAccountId: `calendar_${state}`,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
        calendarScope: tokens.scope,
      });
    }

    // Enable Google Calendar sync in user settings
    await User.updateOne(
      { _id: state },
      {
        $set: {
          "calendarSettings.googleCalendarEnabled": true,
        },
      }
    );

    return NextResponse.redirect(
      `${baseUrl}/dashboard/schedule?success=calendar_connected`
    );
  } catch (error) {
    console.error("Error in Google Calendar callback:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/schedule?error=callback_failed`
    );
  }
}
