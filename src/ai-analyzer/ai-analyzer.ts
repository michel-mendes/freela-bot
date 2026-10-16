import { GoogleGenAI, Type, Schema } from "@google/genai";
import { getSystemInstruction } from "../prompts/developer-prompt";
import { AiAnalysisStatus, FreelancePlatforms, IProject99Freelas } from "../modules/types";
import { ProjectService } from "../services/project-99-freelas.service";
import { ProposalService } from "../services/proposal-99-freelas.service";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("[-] Chave API para acesso ao Google Gemini não foi definida.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Schema de resposta para a API do Gemini
const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        isMatch: {
            type: Type.BOOLEAN,
            description: "True se o projeto se encaixar nas habilidades do desenvolvedor.",
        },
        reasoning: {
            type: Type.STRING,
            description: "Breve explicação lógica de por que o projeto foi aceito ou rejeitado.",
        },
        proposalDraft: {
            type: Type.OBJECT,
            properties: {
                bid: {
                    type: Type.NUMBER,
                    description: "Valor sugerido para a proposta em reais.",
                },
                durationInDays: {
                    type: Type.INTEGER,
                    description: "Duração estimada para a realização do projeto em dias.",
                },
                proposalDetails: {
                    type: Type.STRING,
                    description: "Texto completo do rascunho da proposta.",
                },
            },
            description:
                "Se isMatch for true, informe os dados da proposta. Se false, informe null.",
        },
    },
    required: ["isMatch", "reasoning", "proposalDraft"],
};

interface AnalyzeProjectDependencies {
    projectService: ProjectService;
    proposalService: ProposalService;
}

/**
 * Analisa um projeto individual via Gemini e salva os resultados/propostas no MongoDB.
 */
export async function analyzeProject(project: IProject99Freelas, { projectService, proposalService }: AnalyzeProjectDependencies): Promise<IProject99Freelas | null> {
    // Evita reprocessar se por algum motivo a chamada receber um projeto já analisado
    if (project.aiAnalysisStatus !== AiAnalysisStatus.NOT_ANALYZED) {
        return project;
    }

    console.log(`\n[*] ${new Date().toLocaleString()} - Analisando projeto via IA: "${project.title}"`);

    const systemInstruction = getSystemInstruction({ platform: project.platform });

    const userPrompt = `
Avalie a seguinte oportunidade:
Título: ${project.title}
Orçamento Informado: ${project.budget}
Descrição do Projeto: ${project.description}
  `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.3,
            },
        });

        const textResponse = response.text;
        if (!textResponse) {
            throw new Error("A resposta da API do Gemini retornou vazia.");
        }

        const result = JSON.parse(textResponse);
        const isMatch = Boolean(result.isMatch);
        const status = isMatch
            ? AiAnalysisStatus.MATCHED
            : AiAnalysisStatus.NOT_MATCHED;

        const draftedProposal =
            isMatch && result.proposalDraft
                ? {
                    bid: Number(result.proposalDraft.bid) || 0,
                    durationInDays: Number(result.proposalDraft.durationInDays) || 1,
                    proposalDetails: String(result.proposalDraft.proposalDetails || ""),
                }
                : null;

        const updatedProject = await projectService.updateAiAnalysis(
            project._id.toString(),
            status,
            result.reasoning,
            draftedProposal
        );

        if (isMatch && draftedProposal) {
            await proposalService.create({
                projectId: project._id.toString(),
                projectTitle: project.title,
                projectUrl: project.url,
                bid: draftedProposal.bid,
                durationInDays: draftedProposal.durationInDays,
                proposalDetails: draftedProposal.proposalDetails,
                freelaCategory: project.category,
                projectAvailableAfter: project.availableToPublicIn,
                platform: FreelancePlatforms._99_FREELAS,
            });
            console.log(`[+] Proposta criada e salva no banco com sucesso.`);
        }

        console.info(
            `[>] Resultado da análise:\n  --> Deu Match?: ${isMatch ? "SIM" : "NÃO"}\n  --> Razão: "${result.reasoning}"\n`
        );

        return updatedProject;
    } catch (error) {
        console.error(
            `[-] Falha ao processar a análise do projeto ID "${project._id}" na API do Gemini:`,
            error instanceof Error ? error.message : error
        );

        // Retorna null p/ o cron job prosseguir e tentar novamente mais tarde)
        return null;
    }
}