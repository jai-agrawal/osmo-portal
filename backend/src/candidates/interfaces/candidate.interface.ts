export type CandidateStatus = 'ACTIVE' | 'INACTIVE';

export interface Candidate {
  _id?: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  dateOfBirth?: Date;
  resumeFileId: string;
  portfolioFileIds: CandidateAdditionalFileIds;
  additionalFileIds: CandidateAdditionalFileIds;
  socialUrls: CandidateSocialUrls;
  currentLocation: string;
  status: CandidateStatus;
  isDeleted: boolean;
  resetPasswordToken?: string;
  resetPasswordTokenExpires?: Date;
  minExpectedCtc?: number;
  maxExpectedCtc?: number;
  createdBy?: string;
  savedJobIds?: string[];
}
export type CandidateSocialUrls = { linkedin?: string; website?: string };
export type CandidateAdditionalFileIds = string[];
