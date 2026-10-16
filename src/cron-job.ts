import cron from "node-cron";
import mongoose from "mongoose";
import { connectDatabase } from "./database/connect_database";
import { ProjectService } from "./services/project-99-freelas.service";
import { ProposalService } from "./services/proposal-99-freelas.service";
import { AiAnalysisStatus } from "./modules/types";
import { randomDelay } from "./utils/random-delay";
import { scrapeFreelanceSites } from "./scrape-freelance-sites";
import { analyzeProject } from "./ai-analyzer/ai-analyzer";
import { sendProposalsTelegramAlert } from "./telegram";

// Flag para evitar execuções desnecessárias durante um ciclo já em execução
let isRunning = false;

const projectService = new ProjectService();
const proposalService = new ProposalService();


async function runAutomationPipeline(): Promise<void> {
  if (isRunning) {
    console.warn(`[!] [${new Date().toLocaleString()}] Um ciclo anterior ainda está em execução. Pulando esta rodada do cron.`);
    return;
  }

  isRunning = true;
  console.log(`\n==================================================`);
  console.log(`[*] [${new Date().toLocaleString()}] Iniciando ciclo de automação...`);
  console.log(`==================================================\n`);

  try {
    console.log("[Etapa 1/3] Buscando novos projetos...");

    const scrapeResult = await scrapeFreelanceSites(projectService);
    console.log(`[+] Scraping finalizado. Processados: ${scrapeResult.totalProcessed} | Novos: ${scrapeResult.newSaved}`);
    console.log("\n[Etapa 2/3] Buscando projetos pendentes de análise no banco...");

    const pendingProjects = await projectService.findAll({ aiAnalysisStatus: AiAnalysisStatus.NOT_ANALYZED });

    console.log(`[*] Encontrados ${pendingProjects.total} projetos aguardando análise por IA.`);

    for (let i = 0; i < pendingProjects.data.length; i++) {
      const project = pendingProjects.data[i]!;

      console.log(`[*] Processando IA (${i + 1}/${pendingProjects.data.length}): "${project.title.slice(0, 40)}..."`);

      await analyzeProject(project, { projectService, proposalService });

      // Interrompimento programado para evitar erro de Rate Limit do Gemini
      if (i < pendingProjects.data.length - 1) {
        console.log(`[*] Aguardando 7s para a próxima chamada à IA...`);
        await randomDelay(7000, 7000);
      }
    }

    // Notificar propostas aprovadas via Telegram
    console.log("\n[Etapa 3/3] Verificando e enviando notificações pendentes no Telegram...");
    await sendProposalsTelegramAlert();

    console.log(`\n[+] [${new Date().toLocaleString()}] Ciclo concluído com sucesso.`);
  } catch (error) {
    console.error("[-] Erro crítico no pipeline de automação:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Ponto de entrada da aplicação
 */
async function bootstrap() {
  console.log("==================================================");
  console.log("   INICIALIZANDO SCRIPT DE AUTOMAÇÃO FREELANCER   ");
  console.log("==================================================\n");

  await connectDatabase();

  // Iniciar o primeiro loop do scrapper ao carregar aplicação
  await runAutomationPipeline();

  // Agendar a execução do loop a cada 30 minutos
  console.log("\n[*] Agendador configurado para rodar a cada 30 minutos.");
  cron.schedule("*/30 * * * *", async () => {
    await runAutomationPipeline();
  });
}

// Tratamento de encerramento do processo (CONTROL+C)
process.on("SIGINT", async () => {
  console.log("\n[*] Encerrando conexão com o banco e finalizando processo...");

  await mongoose.connection.close();
  process.exit(0);
});

// Inicializa a aplicação
bootstrap();