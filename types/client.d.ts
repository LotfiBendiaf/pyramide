export type ClientInput = {
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";

  firstName: string;
  lastName: string;
  phone: string;
  email?: string;

  city?: string;
  budgetMin?: number;
  budgetMax?: number;

  qualificationNotes?: string;
};

export type ClientFilters = {
  type?: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
  status?: "PENDING" | "QUALIFIED" | "ARCHIVED";
  agentId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
};
