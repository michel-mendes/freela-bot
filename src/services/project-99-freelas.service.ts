import { Project99FreelasModel } from '../modules/project-99-freelas';
import { IProject99Freelas, AiAnalysisStatus } from '../modules/types';
import { CreateProjectDTO, UpdateProjectDTO, FilterProjectDTO } from '../dtos/project-99-freelas.dto';

export class ProjectService {
    /**
     * Cria um novo projeto no banco.
     */
    async create(data: CreateProjectDTO): Promise<IProject99Freelas> {
        const project = new Project99FreelasModel(data);

        return await project.save();
    }

    /**
     * Busca um projeto pelo ID.
     */
    async findById(id: string): Promise<IProject99Freelas | null> {
        return await Project99FreelasModel.findById(id).exec();
    }

    /**
     * Busca um projeto pela URL única (evita duplicação ao fazer scraping).
     */
    async findByUrl(url: string): Promise<IProject99Freelas | null> {
        return await Project99FreelasModel.findOne({ url }).exec();
    }

    /**
     * Lista projetos aplicando filtros opcionais e paginação.
     */
    async findAll(filters: FilterProjectDTO = {}, limit: number = 20, skip: number = 0): Promise<{ data: IProject99Freelas[]; total: number }> {
        const query: Record<string, any> = {};

        if (filters.aiAnalysisStatus) {
            query.aiAnalysisStatus = filters.aiAnalysisStatus;
        }
        if (filters.category) {
            query.category = filters.category;
        }
        if (filters.isExclusive !== undefined) {
            query.isExclusive = filters.isExclusive;
        }

        const [data, total] = await Promise.all([
            Project99FreelasModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            Project99FreelasModel.countDocuments(query).exec(),
        ]);

        return { data, total };
    }

    /**
     * Atualiza os dados de um projeto.
     */
    async update(id: string, data: UpdateProjectDTO): Promise<IProject99Freelas | null> {
        const updatedProject = await Project99FreelasModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();

        return updatedProject;
    }

    /**
     * Atualiza especificamente o resultado da análise feita por IA.
     */
    async updateAiAnalysis(id: string, status: AiAnalysisStatus, reasoning?: string, draftedProposal?: UpdateProjectDTO['draftedProposal']): Promise<IProject99Freelas | null> {
        return await Project99FreelasModel.findByIdAndUpdate(id, {
            $set: {
                aiAnalysisStatus: status,
                aiReasoning: reasoning,
                draftedProposal: draftedProposal ?? null,
            },
        },
            { new: true, runValidators: true }
        ).exec();
    }
}