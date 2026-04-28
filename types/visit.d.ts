export type VisitStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type VisitOutcome = "INTERESTED" | "NOT_INTERESTED" | "UNDECIDED";

export type ScheduleVisitInput = {
  listingId?: string;
  clientId: string;
  isExternalListing?: boolean;
  externalListingRef?: string;
  scheduledAt: Date;
  notes?: string;
};

export type CompleteVisitInput = {
  visitId: string;
  outcome: VisitOutcome;
  notes?: string;
};

export type VisitFilters = {
  clientId?: string;
  listingId?: string;
  agentId?: string;
  status?: VisitStatus;
  page?: number;
  limit?: number;
};
