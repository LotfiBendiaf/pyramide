export type ClientTemperature = "HOT" | "WARM" | "COLD";

export type PipelineStage =
  | "LEAD"
  | "PHASE_1_REVIEW"
  | "PHASE_2_REVIEW"
  | "ACTIVE_SEARCH"
  | "FOLLOW_UP"
  | "IN_NEGOTIATION"
  | "CLOSED"
  | "ARCHIVED";

export type ClientInput = {
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";

  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  priceCurrency?: "DZD" | "EUR" | "USD";
  wantedArea?: number;
  wantedPropertyType?: string;
  rooms?: number;
  floorMin?: number;
  floorMax?: number;
  preferredLocation?: string;
  extraNotes?: string;

  qualificationNotes?: string;
  assignedAgent?: string;
};

export type ClientUpdateInput = {
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  priceCurrency?: "DZD" | "EUR" | "USD";
  wantedArea?: number;
  wantedPropertyType?: string;
  rooms?: number;
  floorMin?: number;
  floorMax?: number;
  preferredLocation?: string;
  extraNotes?: string;
  qualificationStatus: "NEW" | "QUALIFIED" | "NOT_RELEVANT" | "ARCHIVED";
  qualificationNotes?: string;
  assignedAgent?: string;
};

export type ClientFilters = {
  type?: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
  qualificationStatus?: "NEW" | "QUALIFIED" | "NOT_RELEVANT" | "ARCHIVED";
  pipelineStage?: PipelineStage;
  clientTemperature?: ClientTemperature;
  wantedPropertyType?: string;
  agentId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
  archived?: boolean;
};

export type Phase1ApprovalInput = {
  clientId: string;
  phase2AgentId: string;
  notes?: string;
};

export type Phase1RejectionInput = {
  clientId: string;
  notes?: string;
};

export type Phase2ApprovalInput = {
  clientId: string;
  temperature: ClientTemperature;
  notes?: string;
};

export type Phase2RejectionInput = {
  clientId: string;
  notes?: string;
};

export type ArchiveRequestInput = {
  entityType: "CLIENT" | "LISTING";
  entityId: string;
  reason: string;
};

export type ArchiveReviewInput = {
  requestId: string;
  managerNote?: string;
};
