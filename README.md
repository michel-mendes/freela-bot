# Freela Bot 🤖⚡

> Bot de automação completo para raspagem de dados (Web Scraping), triagem por Inteligência Artificial (Google Gemini) e notificação em tempo real via Telegram de oportunidades de freela na plataforma 99Freelas.

---

## 📌 Sobre o Projeto

O **Freela Bot** foi construído para automatizar e otimizar a busca por oportunidades de trabalho freelancer. Ele monitora a plataforma 99Freelas, extrai novos projetos publicados, utiliza a API do Google Gemini para realizar a triagem das vagas com base no perfil técnico do desenvolvedor e gera rascunhos de propostas personalizadas (com orçamento e prazo estimado). 

Quando um projeto compatível é liberado para o público, o bot envia um alerta direto para o Telegram contendo os detalhes da vaga e o rascunho da proposta pronto para ser revisado e enviado.

---

## 🔄 Fluxo de Execução da Aplicação

A automação opera em um pipeline contínuo de **3 etapas**, agendado via Cron Job:

```
[1. Web Scraping] ──> [2. Triagem com IA] ──> [3. Alertas via Telegram]
   (Playwright)          (Google Gemini)         (Telegram Bot API)
```

1. **Web Scraping Anti-Bot:** Coleta listagens de projetos da plataforma 99Freelas utilizando navegadores headless com plugins de modo stealth e delays humanizados para evitar rate limit ou bloqueios.
2. **Análise Preditiva & Geração de Propostas (IA):** Envia o contexto do projeto para o modelo `gemini-3.5-flash-lite` com *Structured Outputs* (JSON Schema). A IA avalia se a vaga dá "Match" com a stack do desenvolvedor, gera a justificativa da escolha e constrói o rascunho de proposta contendo valor em reais (`bid`), duração em dias e o texto descritivo.
3. **Notificação Inteligente:** Filtra propostas aprovadas que já ultrapassaram o tempo de exclusividade para a conta pública e dispara notificações formatadas em HTML no Telegram.

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem & Runtime:** Node.js, TypeScript, `tsx`
- **Scraping & Automação:** Playwright, `playwright-extra`, `puppeteer-extra-plugin-stealth`
- **Inteligência Artificial:** `@google/genai` (API Google Gemini com JSON Schema / Structured Outputs)
- **Banco de Dados & ORM:** MongoDB, Mongoose
- **Agendamento & Notificação:** `node-cron`, `node-telegram-bot-api`
- **Gerenciamento de Variáveis de Ambiente:** `dotenv`

---

## ✨ Funcionalidades Principais

- 🔍 **Scraping Resiliente:** Extração automática de vagas por categoria com deduplicação no banco de dados MongoDB via URL única.
- 🛡️ **Bypass de Proteções:** Uso de evasão stealth e intervalos randômicos (`randomDelay`) para evitar bloqueios IP e simular interação humana.
- 🧠 **Triagem por IA com Structured Outputs:** Garantia de respostas estruturadas e tipadas retornadas pela API do Gemini.
- 📝 **Geração de Propostas Automatizadas:** Criação de propostas sob medida de acordo com pretensão salarial e disponibilidade do desenvolvedor configuradas no arquivo `.env`.
- ⏰ **Respeito às Regras de Exclusividade:** Cálculos de tempo para disparo da notificação no Telegram exatamente quando a vaga é aberta para freelancers da categoria pública.
- 🔒 **Concorrência Protegida:** Módulo de controle (`isRunning`) no Cron Job que impede execuções simultâneas colidentes.

---

## 📁 Estrutura do Projeto

```text
freela-bot/
├── src/
│   ├── ai-analyzer/        # Módulo de integração com a API do Google Gemini
│   ├── database/           # Configuração e conexão com o MongoDB Atlas
│   ├── dtos/               # Interfaces de transferência de dados (Data Transfer Objects)
│   ├── modules/            # Modelos Mongoose (Project e Proposal) e Enums
│   ├── prompts/            # System Instructions dinâmicas personalizadas para a IA
│   ├── scrapper-99-freelas/# Lógica de extração de dados do 99Freelas usando Playwright
│   ├── services/           # Camada de serviços/regra de negócio para manipulação no banco
│   ├── utils/              # Funções utilitárias (delays randômicos, etc)
│   ├── cron-job.ts         # Ponto de entrada (Entry point) e agendador da automação
│   ├── scrape-freelance-sites.ts # Gerenciador de navegadores e scrapers
│   └── telegram.ts         # Módulo de envio de mensagens e alertas via Telegram
├── .env_example            # Modelo das variáveis de ambiente
├── package.json
└── tsconfig.json
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- **Node.js** (v20+ recomendado)
- Instância ativa do **MongoDB** (Local ou MongoDB Atlas)
- Chave de API da **Google Gemini API**
- Bot criado no **Telegram** via *BotFather* (com Chat ID identificado)

### Passos para execução

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/michel-mendes/freela-bot.git
   cd freela-bot
   ```

2. **Configurar as Variáveis de Ambiente:**
   Crie o arquivo `.env` na raiz do projeto com base no `.env_example`:
   ```bash
   cp .env_example .env
   ```
   Preencha os valores solicitados no arquivo `.env`:
   ```env
   DEV_MAIN_SALARY="R$ 8.000,00"
   DEV_HOURS_AVAILABLE="Disponibilidade de 4h diárias no período noturno"

   MONGODB_URI="sua_uri_mongodb"
   GEMINI_API_KEY="sua_chave_gemini"

   TELEGRAM_BOT_TOKEN="seu_token_telegram_bot"
   TELEGRAM_CHAT_ID="seu_chat_id_telegram"
   ```

3. **Instalar as dependências:**
   ```bash
   npm install
   ```

4. **Executar a aplicação:**
   ```bash
   npm run start
   ```
