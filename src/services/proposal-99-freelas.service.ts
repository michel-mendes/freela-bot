import { Proposal99FreelasModel } from '../modules/proposal-99-freelas';
import { IProposal99Freelas } from '../modules/types';
import { CreateProposalDTO, UpdateProposalDTO } from '../dtos/proposal-99-freelas.dto';

export class ProposalService {
    /**
     * Registra uma nova proposta enviada/rascunhada.
     */
    async create(data: CreateProposalDTO): Promise<IProposal99Freelas> {
        const proposal = new Proposal99FreelasModel(data);
        return await proposal.save();
    }

    /**
     * Busca uma proposta pelo ID e faz o Populate do projeto relacionado.
     */
    async findById(id: string): Promise<IProposal99Freelas | null> {
        return await Proposal99FreelasModel.findById(id).populate('projectId').exec();
    }

    /**
     * Busca proposta pelo ID do Projeto.
     */
    async findByProjectId(projectId: string): Promise<IProposal99Freelas | null> {
        return await Proposal99FreelasModel.findOne({ projectId }).exec();
    }

    /**
     * Retorna propostas que ainda não foram notificadas no Telegram.
     */
    async findPendingTelegramNotifications(): Promise<IProposal99Freelas[]> {
        return await Proposal99FreelasModel.find({ telegramNotified: false }).sort({ createdAt: 1 }).exec();
    }

    /**
     * Atualiza o status da notificação do Telegram.
     */
    async markAsNotifiedTelegram(id: string): Promise<IProposal99Freelas | null> {
        return await Proposal99FreelasModel.findByIdAndUpdate(id, {
            $set: {
                telegramNotified: true,
                telegramNotifiedDate: new Date(),
            },
        },
            { new: true }
        ).exec();
    }

    /**
     * Atualização genérica de uma proposta.
     */
    async update(id: string, data: UpdateProposalDTO): Promise<IProposal99Freelas | null> {
        return await Proposal99FreelasModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
    }
}