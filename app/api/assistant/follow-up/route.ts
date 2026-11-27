import { NextResponse } from "next/server";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { canUseAssistant } from "@/lib/assistant-access";
import { createProposalFollowUp, followUpProposalInput } from "@/lib/assistant-proposals";

export async function POST(request: Request) {
  const { data: user } = await getUserBySessionEmail();
  if (!user?._id) return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  if (!canUseAssistant(user.role)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const input = followUpProposalInput.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Proposition invalide." }, { status: 400 });
  try {
    const result = await createProposalFollowUp({ userId: user._id, role: user.role }, input.data);
    return result ? NextResponse.json(result) : NextResponse.json({ error: "Proposition inaccessible." }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Impossible de créer la relance." }, { status: 503 });
  }
}
