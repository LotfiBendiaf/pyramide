export type VisitStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type VisitOutcome = "INTERESTED" | "NOT_INTERESTED" | "UNDECIDED";

export type PopulatedVisit = {
  _id: string;
  scheduledAt: string | Date;
  status: VisitStatus;
  outcome?: VisitOutcome;
  isExternalListing: boolean;
  externalListingRef?: string;
  notes?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  listing?: {
    _id: string;
    referenceCode?: string;
    title?: string;
    location?: string;
    status?: string;
    pipelineStatus?: string;
  };
  client?: {
    _id: string;
    referenceCode: string;
    firstName?: string;
    lastName?: string;
    phone: string;
  };
  agent?: {
    _id: string;
    firstname: string;
    lastname: string;
    role?: string;
  };
};

export type ScheduleVisitInput = {
  listingId?: string;
  clientId: string;
  isExternalListing?: boolean;
  externalListingRef?: string;
  scheduledAt: Date;
  status?: "COMPLETED";
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
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type VisitStats = {
  today: number;
  week: number;
  upcoming: number;
  overdue: number;
};
