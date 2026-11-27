import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { Client } from "@/models";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { canReadAssistantSource, isAgencyScope } from "@/lib/assistant-access";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: user } = await getUserBySessionEmail();
  if (!user?._id) return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  const scope = { userId: user._id, role: user.role };
  if (!canReadAssistantSource(scope, "clients")) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  const criteria = await Client.findOne({ _id: id, ...(isAgencyScope(scope) ? {} : scope.role === "ASSISTANT" ? { $or: [{ assignedAgent: user._id }, { createdBy: user._id }] } : { assignedAgent: user._id }) })
    .select("type city preferredLocation wantedPropertyType budgetMin budgetMax priceCurrency wantedArea wantedAreaMin rooms floorMin floorMax -_id").lean();
  return criteria ? NextResponse.json({ criteria }, { headers: { "Cache-Control": "private, no-store" } }) : NextResponse.json({ error: "Client introuvable." }, { status: 404 });
}
