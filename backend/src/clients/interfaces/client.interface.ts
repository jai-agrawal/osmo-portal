export interface Client {
  name: string;
  code: string;
  location?: string;
  website?: string;
  email?: string;
  phone?: string;
  socialUrls?: {
    linkedin?: string;
    instagram?: string;
  };
  workingDays?: string;
  notes?: string;
  address?: string;
}
