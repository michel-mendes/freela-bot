import dotenv from "dotenv";
import mongoose from "mongoose";

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Conecta ao banco de dados MongoDB
 */
export async function connectDatabase(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error("[-] MONGODB_URI não foi configurado nas variáveis de ambiente (.env).");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log("[+] Conexão com o MongoDB estabelecida com sucesso.");
    } catch (error) {
        console.error("[-] Falha ao conectar no MongoDB:", error);
        process.exit(1);
    }
}