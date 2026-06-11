interface FollowUpInput {
  listing?: string;
  client: string;
  agent?: string;
  type: "COLD" | "WARM" | "HOT" | "CUSTOM";
  title?: string;
  note?: string;
  reminderAt?: Date;
  channel?: "CALL" | "EMAIL" | "WHATSAPP" | "VISIT";
  status?: "PENDING" | "DONE" | "OVERDUE";
}

export type FollowUpFilters = {
  agentId?: string;
  type?: "COLD" | "WARM" | "HOT" | "CUSTOM";
  status?: "PENDING" | "DONE" | "OVERDUE" | "CANCELLED";
  channel?: "CALL" | "EMAIL" | "WHATSAPP" | "VISIT";
  search?: string;
  page?: number;
  limit?: number;
};
