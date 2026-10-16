import { chromium } from "playwright-extra";
import { Categories99Freelas } from "./modules/types";
import { ProjectService } from "./services/project-99-freelas.service";
import { scrape99Freelas } from "./scrapper-99-freelas/scrapper-99-freelas";
import stealth from "puppeteer-extra-plugin-stealth";

chromium.use(stealth());

interface ScrapeResult {
    totalProcessed: number;
    newSaved: number;
}

/**
 * Gerencia a execução dos scrapers para as diferentes plataformas de freelance.
 */
export async function scrapeFreelanceSites(projectService: ProjectService = new ProjectService()): Promise<ScrapeResult> {
    let browser = null;
    let context = null;

    let totalProcessed = 0;
    let newSaved = 0;

    console.log(`\n[*] ${new Date().toLocaleString()} - Iniciando scraping de vagas...`);

    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport: {
                width: 1366,
                height: 768
            },
            acceptDownloads: false,
        });

        const page = await context.newPage();

        // ----------------------------------------------------------------------
        // MÓDULO 1: 99FREELAS
        // ----------------------------------------------------------------------
        const categoriesNames = Object.values(Categories99Freelas);

        for (const freelaCategory of categoriesNames) {
            try {
                const result = await scrape99Freelas({
                    page,
                    freelaCategory,
                    projectService,
                });

                totalProcessed += result.totalProcessed;
                newSaved += result.newSaved;
            } catch (categoryError) {
                console.error(
                    `[-] Erro ao coletar categoria "${freelaCategory}" do 99freelas:`,
                    categoryError instanceof Error ? categoryError.message : categoryError
                );
            }
        }

        // ---------------------------------------------------------------------------
        // MÓDULO 2 TODO: ADICIONAREI OUTRAS PLATAFORMAS (Ex: Workana, Freelancer.com)
        // ---------------------------------------------------------------------------
        // Exemplo de como deverá ficar em uma expansão futura:
        // await scrapeWorkana({ page, projectService });
        // await scrapeFreelancer({ page, projectService });

    } catch (globalError) {
        console.error("[-] Erro crítico durante a execução do Scraper:", globalError);
    } finally {

        if (context) {
            await context.close().catch(() => { });
        }
        if (browser) {
            await browser.close().catch(() => { });
        }

        console.log(
            `[+] ${new Date().toLocaleString()} - Scraping finalizado. ` +
            `Processados: ${totalProcessed} | Novos cadastrados: ${newSaved}`
        );
    }

    return { totalProcessed, newSaved };
}