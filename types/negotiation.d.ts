export type NegotiationStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "CLOSING"
  | "CLOSING_DEPOSIT"
  | "CLOSING_FINALISATION"
  | "DEAL_DONE"
  | "CANCELLED"
  | "REJECTED";
export type BlockRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type OpenNegotiationInput = {
  listingId: string;
  clientId: string;
  visitId?: string;
  blockHours?: number;
  notes?: string;
};

export type RequestBlockInput = {
  negotiationId: string;
  durationDays: number;
  reason?: string;
};

export type ReviewBlockInput = {
  negotiationId: string;
  blockingRequestId: string;
  managerNote?: string;
};

export type BeginClosingInput = {
  negotiationId: string;
};

export type ConfirmDepositInput = {
  negotiationId: string;
  depositAmount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  proofNotes?: string;
  notes?: string;
};

export type CloseDealInput = {
  negotiationId: string;
  finalPrice: number;
  notes?: string;
};

export type CancelNegotiationInput = {
  negotiationId: string;
  cancelReason: string;
};

export type NegotiationFilters = {
  status?: NegotiationStatus;
  agentId?: string;
  listingId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
};
