export interface Query {
  page?: number;
  pageSize?: number;
  limit?: number;
  isDeleted?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any; //For any other query parameters
}
