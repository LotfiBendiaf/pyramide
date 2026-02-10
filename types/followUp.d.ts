interface FollowUpInput {
  listing: string;
  client: string;
  agent?: string;
  type: "COLD" | "WARM" | "HOT" | "CUSTOM";
  title?: string;
  note?: string;
  reminderAt?: Date;
  status?: "PENDING" | "DONE" | "OVERDUE";
}

export type FollowUpFilters = {
  agentId?: string;
  type?: "COLD" | "WARM" | "HOT" | "CUSTOM";
  status?: "PENDING" | "DONE" | "OVERDUE";
  channel?: "CALL" | "EMAIL" | "WHATSAPP" | "VISIT";
  search?: string;
  page?: number;
  limit?: number;
};
