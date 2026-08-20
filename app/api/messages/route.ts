import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Message, { IMessage } from "@/models/message.model";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { hasPermission } from "@/lib/roleCheck";
import { FilterQuery } from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and can manage messages
    const user = await getUserBySessionEmail();
    const isAuthorized = hasPermission(
      user.data?.role || "",
      "view_all_messages"
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { message: "Non autorisé" } },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get query parameters
    const status = request.nextUrl.searchParams.get("status");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");

    const query: FilterQuery<IMessage> = {};
    if (status && status !== "all") {
      query.status = status.toUpperCase() as IMessage["status"];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get statistics
    const stats = await Promise.all([
      Message.countDocuments({ status: "NEW" }),
      Message.countDocuments({ status: "READ" }),
      Message.countDocuments({ status: "REPLIED" }),
      Message.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages: messages,
        stats: {
          new: stats[0],
          read: stats[1],
          replied: stats[2],
          total: stats[3],
        },
      },
    });
  } catch (error) {
    console.error("Messages API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors du chargement des messages" },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is authenticated and can manage messages
    const user = await getUserBySessionEmail();
    const isAuthorized = hasPermission(
      user.data?.role || "",
      "view_all_messages"
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { message: "Non autorisé" } },
        { status: 403 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { messageId, status, adminNotes } = body;

    if (!messageId || !status) {
      return NextResponse.json(
        { success: false, error: { message: "Données invalides" } },
        { status: 400 }
      );
    }

    const updateData: Partial<IMessage> = { status };
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    if (status === "REPLIED") {
      updateData.repliedAt = new Date();
    }

    const message = (await Message.findByIdAndUpdate(messageId, updateData, {
      new: true,
    }).lean()) as Record<string, unknown> | null;

    if (!message) {
      return NextResponse.json(
        { success: false, error: { message: "Message non trouvé" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Update message error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors de la mise à jour" },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated and can manage messages
    const user = await getUserBySessionEmail();
    const isAuthorized = hasPermission(
      user.data?.role || "",
      "view_all_messages"
    );

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { message: "Non autorisé" } },
        { status: 403 }
      );
    }

    await dbConnect();

    const messageId = request.nextUrl.searchParams.get("id");

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: { message: "ID manquant" } },
        { status: 400 }
      );
    }

    const result = await Message.findByIdAndDelete(messageId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: { message: "Message non trouvé" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors de la suppression" },
      },
      { status: 500 }
    );
  }
}
