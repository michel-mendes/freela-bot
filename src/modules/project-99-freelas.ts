import { Schema, model, Model, models } from 'mongoose';
import { AiAnalysisStatus, Categories99Freelas, FreelancePlatforms, IDraftProposal, IProject99Freelas } from './types';

const DraftProposalSchema = new Schema<IDraftProposal>(
    {
        bid: { type: Number, required: true, min: 0 },
        durationInDays: { type: Number, required: true, min: 1 },
        proposalDetails: { type: String, required: true, trim: true },
    },
    { _id: false }
);


const Project99FreelasSchema = new Schema<IProject99Freelas>(
    {
        isExclusive: { type: Boolean, required: true, default: false },
        availableToPublicIn: { type: Date, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: Object.values(Categories99Freelas),
            required: true,
        },
        budget: { type: String, required: true },
        url: { type: String, required: true, unique: true, trim: true },
        aiAnalysisStatus: {
            type: String,
            enum: Object.values(AiAnalysisStatus),
            default: AiAnalysisStatus.NOT_ANALYZED,
            required: true,
        },
        platform: {
            type: String,
            enum: Object.values(FreelancePlatforms),
            default: FreelancePlatforms._99_FREELAS,
            required: true,
        },
        aiReasoning: { type: String, default: null },
        draftedProposal: { type: DraftProposalSchema, default: null },
    },
    {
        timestamps: true,
    }
);

export const Project99FreelasModel: Model<IProject99Freelas> =
    models.Project99Freelas || model<IProject99Freelas>('Project99Freelas', Project99FreelasSchema);