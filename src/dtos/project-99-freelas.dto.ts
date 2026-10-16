import { AiAnalysisStatus, Categories99Freelas, FreelancePlatforms, IDraftProposal } from "../modules/types";

export interface CreateProjectDTO {
    title: string;
    description: string;
    category: Categories99Freelas;
    budget: string;
    url: string;
    isExclusive?: boolean;
    availableToPublicIn: Date;
    platform?: FreelancePlatforms;
    aiAnalysisStatus?: AiAnalysisStatus;
    aiReasoning?: string;
    draftedProposal?: IDraftProposal | null;
}

export interface UpdateProjectDTO {
    title?: string;
    description?: string;
    category?: Categories99Freelas;
    budget?: string;
    aiAnalysisStatus?: AiAnalysisStatus;
    aiReasoning?: string;
    draftedProposal?: IDraftProposal | null;
}

export interface FilterProjectDTO {
    aiAnalysisStatus?: AiAnalysisStatus;
    category?: Categories99Freelas;
    isExclusive?: boolean;
}