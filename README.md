# app-discord

Bot Discord em Node.js que rastreia tempo em call por usuário e gera um relatório semanal automático (sexta 18:00 BRT) ou sob demanda via `/stats`.

## Setup

1. Instale dependências:
   ```bash
   npm install
   ```

2. No [Discord Developer Portal](https://discord.com/developers/applications):
   - Crie a aplicação e o bot.
   - Em **Bot → Privileged Gateway Intents**, ative `SERVER MEMBERS INTENT` e `VOICE STATE` (este último sai automático com o intent `GuildVoiceStates`, mas confirme).
   - Convide o bot na guild com permissões: `View Channels`, `Send Messages`, `Embed Links`, `Use Slash Commands`, `Connect`.

3. Copie `.env.example` para `.env` e preencha:
   ```bash
   cp .env.example .env
   ```

4. Registre os slash commands na guild:
   ```bash
   npm run register
   ```

5. Inicie o bot:
   ```bash
   npm start
   ```

## Comandos

- `/stats periodo:semana` — relatório da semana atual (segunda 00:00 → agora).
- `/stats periodo:mes` — relatório do mês atual.
- `/stats periodo:tudo` — acumulado total.

## Relatório automático

Configurado via `REPORT_CRON` no `.env` (default `0 18 * * 5` — sexta 18:00 no `TIMEZONE`).
Postado em `REPORT_CHANNEL_ID`.

## O que é exibido

- Top 10 usuários por tempo total em call (com nº de sessões).
- Sessão mais longa do período.
- Canal de voz mais usado.

## Storage

SQLite em `data/calls.sqlite`, criado automaticamente. Para resetar, basta apagar o arquivo.

## Deploy

Para rodar 24/7 num VPS gratuito do GCP, ver [DEPLOY.md](DEPLOY.md).
