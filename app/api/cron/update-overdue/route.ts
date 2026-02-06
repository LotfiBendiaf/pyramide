// import { NextRequest, NextResponse } from "next/server";

// import dbConnect from "@/lib/mongoose";
// import { FollowUp, Task } from "@/models";

// export async function GET(request: NextRequest) {
//   // Verify cron secret
//   const authHeader = request.headers.get("authorization");
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   await dbConnect();

//   try {
//     const now = new Date();

//     // Update overdue follow-ups
//     const followUpResult = await FollowUp.updateMany(
//       {
//         status: "PENDING",
//         $or: [
//           { reminderAt: { $lt: now } },
//           { startTime: { $lt: now } },
//         ],
//       },
//       {
//         $set: { status: "OVERDUE" },
//       }
//     );

//     // Update overdue tasks (keep IN_PROGRESS tasks as is)
//     const taskResult = await Task.updateMany(
//       {
//         status: "PENDING",
//         dueDate: { $lt: now },
//       },
//       {
//         $set: { status: "IN_PROGRESS" }, // Move to in-progress instead of a separate overdue status
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       followUpsUpdated: followUpResult.modifiedCount,
//       tasksUpdated: taskResult.modifiedCount,
//     });
//   } catch (error) {
//     console.error("Update overdue cron error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
export async function GET() {}
