import { Document, Schema } from "mongoose";

export enum FreelancePlatforms {
    _99_FREELAS = "99_FREELAS",
}

export enum AiAnalysisStatus {
    NOT_ANALYZED = "NOT_ANALYZED",
    MATCHED = "MATCHED",
    NOT_MATCHED = "NOT_MATCHED",
}

export enum Categories99Freelas {
    WEB_MOBILE_SOFTWARE = "web-mobile-e-software",
}

export interface IDraftProposal {
    bid: number;
    durationInDays: number;
    proposalDetails: string;
}

export interface IProject99Freelas extends Document {
    isExclusive: boolean;
    availableToPublicIn: Date;
    title: string;
    description: string;
    category: Categories99Freelas;
    budget: string;
    url: string;
    aiAnalysisStatus: AiAnalysisStatus;
    platform: FreelancePlatforms;
    aiReasoning?: string;
    draftedProposal?: IDraftProposal | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IProposal99Freelas extends Document {
    projectId: Schema.Types.ObjectId | string;
    projectTitle: string;
    projectUrl: string;
    bid: number;
    durationInDays: number;
    proposalDetails: string;
    freelaCategory: Categories99Freelas;
    projectAvailableAfter: Date;
    telegramNotified: boolean;
    platform: FreelancePlatforms;
    telegramNotifiedDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}