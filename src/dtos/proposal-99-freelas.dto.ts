import { Categories99Freelas, FreelancePlatforms } from "../modules/types";

export interface CreateProposalDTO {
    projectId: string;
    projectTitle: string;
    projectUrl: string;
    bid: number;
    durationInDays: number;
    proposalDetails: string;
    freelaCategory: Categories99Freelas;
    projectAvailableAfter: Date;
    platform?: FreelancePlatforms;
}

export interface UpdateProposalDTO {
    bid?: number;
    durationInDays?: number;
    proposalDetails?: string;
    telegramNotified?: boolean;
    telegramNotifiedDate?: Date;
}