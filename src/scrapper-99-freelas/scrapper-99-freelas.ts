import { Page } from "playwright";
import { randomDelay } from "../utils/random-delay";
import { AiAnalysisStatus, Categories99Freelas, FreelancePlatforms } from "../modules/types";
import { ProjectService } from "../services/project-99-freelas.service";

interface Scrape99FreelasArgs {
    page: Page;
    freelaCategory: Categories99Freelas;
    projectService: ProjectService;
    maxPages?: number;
}

export async function scrape99Freelas({ page, freelaCategory, projectService, maxPages = 10 }: Scrape99FreelasArgs): Promise<{ totalProcessed: number; newSaved: number }> {
    let currentPage = 1;
    let totalNewSaved = 0;
    let totalProcessed = 0;

    do {
        console.log(
            `\n[*] Acessando página ${currentPage} de projetos de "${freelaCategory}" no 99freelas...`
        );

        try {
            await page.goto(
                `https://www.99freelas.com.br/projects?categoria=${freelaCategory}&page=${currentPage}`,
                {
                    waitUntil: "domcontentloaded",
                    timeout: 30000,
                }
            );
        } catch (error) {
            console.error(
                `[-] Falha ao carregar a página ${currentPage}. Interrompendo navegação.`
            );
            break;
        }

        await randomDelay(2000, 4000);

        const listItems = await page.$$(".result-list li.result-item");

        if (listItems.length === 0) {
            console.log(`[*] Nenhum projeto encontrado na página ${currentPage}. Fim da raspagem.`);
            break;
        }

        let currentPageNewProjects = 0;

        for (let i = 0; i < listItems.length; i++) {
            const item = listItems[i]!;
            totalProcessed++;

            try {
                const titleElement = await item.$("h1.title a");
                const title = (await titleElement?.innerText())?.trim() || "";
                const relativeUrl = (await titleElement?.getAttribute("href")) || "";

                if (!title || !relativeUrl) {
                    console.warn(
                        `[-] Item ${i + 1} descartado: título ou URL ausentes.`
                    );
                    continue;
                }

                const url = relativeUrl.startsWith("http")
                    ? relativeUrl
                    : `https://www.99freelas.com.br${relativeUrl}`;

                const existingProject = await projectService.findByUrl(url);
                if (existingProject) {
                    console.log(`[=] Projeto já cadastrado no banco: "${title.slice(0, 30)}..."`);
                    continue;
                }

                const flagsElement = await item.$('div.flags img[alt="Projeto exclusivo"]');
                const isExclusive = (await flagsElement?.getAttribute("alt"))?.toUpperCase() === "PROJETO EXCLUSIVO";

                const rawTimeString = (await flagsElement?.getAttribute("title")) || "";
                const availableToPublicIn = rawTimeString.match(/(\d+h\d+m\d+s)/)?.[0] || "";

                const description = await item.$eval(".description", (el) => el.textContent?.trim() || "").catch(() => "");

                const budget = await item.$eval(".item-text-price", (el) => el.textContent?.trim() || "A combinar").catch(() => "A combinar");

                // Salvar projeto no banco
                await projectService.create({
                    title,
                    description,
                    category: freelaCategory,
                    budget,
                    url,
                    isExclusive,
                    availableToPublicIn: parsePublicAvailabilityDate(availableToPublicIn),
                    platform: FreelancePlatforms._99_FREELAS,
                    aiAnalysisStatus: AiAnalysisStatus.NOT_ANALYZED,
                    draftedProposal: null,
                });

                console.log(`[+] Novo projeto salvo: "${title.slice(0, 40)}..."`);
                currentPageNewProjects++;
                totalNewSaved++;
            } catch (err) {
                console.error(
                    `[-] Erro ao processar o projeto ${i + 1} da página ${currentPage}:`,
                    err instanceof Error ? err.message : err
                );
                continue;
            }
        }

        // Se nenhum projeto novo foi anunciado nesta página, interromoe
        if (currentPageNewProjects === 0) {
            console.log(
                `[*] Nenhum projeto NOVO encontrado na página ${currentPage}. Parando paginação para economizar recursos.`
            );
            break;
        }

        currentPage++;
    } while (currentPage <= maxPages);

    return { totalProcessed, newSaved: totalNewSaved };
}

/**
 * Converte a string de tempo relativo (ex: "1h30m10s") em uma data real no futuro.
 */
function parsePublicAvailabilityDate(rawTimeString: string) {
    if (rawTimeString.length === 0) {
        return new Date();
    }

    // 1. Usa regex para extrair apenas os números [horas, minutos, segundos]
    const [horas, minutos, segundos] = rawTimeString.match(/\d+/g)!.map(Number);

    // 2. Converte cada unidade para milissegundos
    const msHoras = horas! * 60 * 60 * 1000;
    const msMinutos = minutos! * 60 * 1000;
    const msSegundos = segundos! * 1000;

    // 3. Soma todos os milissegundos ao momento atual (Date.now())
    const dataFutura = new Date(Date.now() + msHoras + msMinutos + msSegundos);

    return dataFutura
}