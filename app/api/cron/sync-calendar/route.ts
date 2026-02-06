// import { NextRequest, NextResponse } from "next/server";

// import dbConnect from "@/lib/mongoose";
// import { syncPendingEvents } from "@/lib/googleCalendar/syncService";

// export async function GET(request: NextRequest) {
//   // Verify cron secret
//   const authHeader = request.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   await dbConnect();

//   try {
//     const result = await syncPendingEvents();

//     return NextResponse.json({
//       success: true,
//       synced: result.synced,
//       failed: result.failed,
//     });
//   } catch (error) {
//     console.error("Sync calendar cron error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
export async function GET() {}
