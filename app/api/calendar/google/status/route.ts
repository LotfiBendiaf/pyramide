import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasGoogleCalendarConnected } from "@/lib/googleCalendar";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const isConnected = await hasGoogleCalendarConnected(session.user.id);

    return NextResponse.json({ connected: isConnected });
  } catch (error) {
    console.error("Error checking Google Calendar status:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}
