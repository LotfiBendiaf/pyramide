import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { disconnectGoogleCalendar } from "@/lib/googleCalendar";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await disconnectGoogleCalendar(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion" },
      { status: 500 }
    );
  }
}
