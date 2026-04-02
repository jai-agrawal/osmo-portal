export type JobStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'CLOSED';

export interface RecruiterInfoVisibility {
  isEmailVisible: boolean;
  isPhoneVisible: boolean;
  isLinkedInVisible: boolean;
}

export interface JobDescription {
  companyOverview: string;
  whoLookingFor?: string;
  responsibilities?: string;
  qualifications?: string;
}

export interface Question {
  question: string;
  answerType: 'shortAnswer' | 'multipleChoice' | 'yesNo';
  options?: string[];
}

export interface Job {
  name: string;
  jobType: string;
  experience: string;
  minExperienceLevel: number | null;
  maxExperienceLevel: number | null;
  location: string;
  skills: string[];
  workType: string;
  workingDays: string;
  ctcRange?: string;
  minAnnualCtc: number;
  maxAnnualCtc: number;
  recruiterId: string;
  roleTypes: string[];
  recruiterInfoVisibility: RecruiterInfoVisibility;
  overview: string;
  content: string;
  status: JobStatus;
  jobDescription: JobDescription;
  questions: Question[];
  additionalInfo: string;
  totalApplicants: number;
  totalInPipeline: number;
}
