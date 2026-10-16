/**
 * Função utilitária para pausar a execução por um tempo aleatório
 * Isso simula latência humana e evita rate limits
 */
export const randomDelay = (min = 1000, max = 3000) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));