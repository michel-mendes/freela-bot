import { Bot } from "node-telegram-bot-api";
import { ProposalService } from "./services/proposal-99-freelas.service";
import { IProposal99Freelas } from "./modules/types";
import { randomDelay } from "./utils/random-delay";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
const chatId = process.env.TELEGRAM_CHAT_ID || "";

// Inicializa a instância do bot se o token existir
const bot = botToken ? new Bot(botToken) : null;

/**
 * Substitui caracteres especiais do HTML para evitar erros de sintaxe na API do Telegram.
 */
function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Envia uma mensagem em formato HTML via Telegram.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
    if (!bot || !chatId) {
        console.error("[-] Variáveis TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configuradas. Notificação cancelada.");
        return false;
    }

    try {
        await bot.api.sendMessage({ chat_id: chatId, text, parse_mode: "HTML" });

        return true;
    } catch (error) {
        console.error(`[-] [${new Date().toLocaleTimeString()}] Erro ao enviar mensagem via Telegram:`, error instanceof Error ? error.message : error);
        return false;
    }
}

/**
 * Busca propostas não notificadas no banco, verifica se já estão liberadas para o público
 * e dispara os alertas via Telegram.
 */
export async function sendProposalsTelegramAlert(proposalService: ProposalService = new ProposalService()): Promise<void> {
    console.log(`[*] [${new Date().toLocaleTimeString()}] Verificando alertas pendentes para o TELEGRAM...`);

    try {
        const pendingProposals = await proposalService.findPendingTelegramNotifications();

        if (pendingProposals.length === 0) {
            console.log("[*] Nenhuma notificação pendente no Telegram.");
            return;
        }

        const now = new Date().getTime();
        let sentCount = 0;

        for (const proposal of pendingProposals) {
            // Regra de disponibilidade: se for projeto exclusivo, aguarda o horário estipulado pela plataforma
            // Ex: "Liberado aos freelancers em 4h28min" <- esse tempo será respeitado pela engine de notificações
            const isAvailableToPublic = now >= new Date(proposal.projectAvailableAfter).getTime();

            if (!isAvailableToPublic) {
                console.log(`[*] Projeto "${proposal.projectTitle.slice(0, 30)}..." ainda não está liberado publicamente. Aguardando...`);
                continue;
            }

            // Processo de envio de mensagem de notificação via Telegram
            const message = buildTelegramMessage(proposal);
            const wasSent = await sendTelegramMessage(message);

            if (wasSent) {
                // Marca no banco de dados que já foi notificado
                await proposalService.markAsNotifiedTelegram(proposal._id.toString());
                console.log(`[+] Notificação enviada para: "${proposal.projectTitle.slice(0, 40)}..."`);
                sentCount++;

                // Delay para evitar Rate Limit na API do Telegram
                await randomDelay(2000, 4000);
            }
        }

        console.log(`[+] Processo do Telegram concluído. Mensagens enviadas: ${sentCount}`);
    } catch (error) {
        console.error(`[-] Erro durante a execução de "sendProposalsTelegramAlert":`, error instanceof Error ? error.message : error);
    }
}

/**
 * Gera template da mensagem formatado em HTML para o Telegram.
 */
const buildTelegramMessage = (proposal: IProposal99Freelas): string => {
    const formattedBid = proposal.bid.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `🚨 <b>NOVA OPORTUNIDADE (MATCH)</b> 🚨

<b>Título:</b> ${escapeHtml(proposal.projectTitle)}
<b>Plataforma:</b> ${proposal.platform}
<b>Categoria:</b> ${proposal.freelaCategory || "N/A"}

<b>Prazo sugerido:</b> ${proposal.durationInDays} dia(s)
<b>Valor da Proposta:</b> R$ ${formattedBid}

<b>📝 Rascunho da Proposta (IA):</b>
<code>${escapeHtml(proposal.proposalDetails)}</code>

🔗 <b>Link do Projeto:</b>
${proposal.projectUrl}`;
};