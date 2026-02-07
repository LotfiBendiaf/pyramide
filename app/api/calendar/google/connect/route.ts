import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Remove trailing slash from NEXTAUTH_URL if present
    const baseUrl = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
    const redirectUri = `${baseUrl}/api/calendar/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      redirectUri
    );

    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: session.user.id, // Pass user ID in state for callback
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google Calendar OAuth:", error);
    return NextResponse.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
