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
