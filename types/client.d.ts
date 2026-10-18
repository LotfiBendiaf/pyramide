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
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR" | "INTERMEDIARY";

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
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR" | "INTERMEDIARY";
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
  qualificationStatus:
    | "NEUTRAL"
    | "NEW"
    | "QUALIFIED"
    | "WARM"
    | "HOT"
    | "COLD"
    | "NO_RESPONSE"
    | "NOT_RELEVANT"
    | "ARCHIVED";
  qualificationNotes?: string;
  assignedAgent?: string;
};

export type ClientFilters = {
  type?: "BUYER" | "SELLER" | "RENTER" | "INVESTOR" | "INTERMEDIARY";
  qualificationStatus?:
    | "NEUTRAL"
    | "NEW"
    | "QUALIFIED"
    | "WARM"
    | "HOT"
    | "COLD"
    | "NO_RESPONSE"
    | "NOT_RELEVANT"
    | "ARCHIVED";
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
  includeArchived?: boolean;
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
