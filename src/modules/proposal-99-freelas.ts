import { Model, model, models, Schema } from "mongoose";
import { Categories99Freelas, FreelancePlatforms, IProposal99Freelas } from "./types";

const Proposal99FreelasSchema = new Schema<IProposal99Freelas>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project99Freelas',
            required: true,
            index: true,
        },
        projectTitle: { type: String, required: true },
        projectUrl: { type: String, required: true },
        bid: { type: Number, required: true, min: 0 },
        durationInDays: { type: Number, required: true, min: 1 },
        proposalDetails: { type: String, required: true },
        freelaCategory: {
            type: String,
            enum: Object.values(Categories99Freelas),
            required: true,
        },
        projectAvailableAfter: { type: Date, required: true },
        telegramNotified: { type: Boolean, default: false, required: true },
        platform: {
            type: String,
            enum: Object.values(FreelancePlatforms),
            default: FreelancePlatforms._99_FREELAS,
            required: true,
        },
        telegramNotifiedDate: { type: Date, default: null },
    },
    {
        timestamps: true,
    }
);

export const Proposal99FreelasModel: Model<IProposal99Freelas> =
    models.Proposal99Freelas || model<IProposal99Freelas>('Proposal99Freelas', Proposal99FreelasSchema);