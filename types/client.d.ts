export type ClientInput = {
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";

  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  wantedPropertyType?: string;
  rooms?: number;
  preferredLocation?: string;
  extraNotes?: string;

  qualificationNotes?: string;
  assignedAgent?: string;
};

export type ClientUpdateInput = {
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  wantedPropertyType?: string;
  rooms?: number;
  preferredLocation?: string;
  extraNotes?: string;
  qualificationStatus: "NEW" | "QUALIFIED" | "NOT_RELEVANT" | "ARCHIVED";
  qualificationNotes?: string;
  assignedAgent?: string;
};

export type ClientFilters = {
  type?: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
  qualificationStatus?: "NEW" | "QUALIFIED" | "NOT_RELEVANT" | "ARCHIVED";
  agentId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
};
