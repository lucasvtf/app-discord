# Deploy no Google Cloud (e2-micro Always Free)

Guia passo-a-passo pra subir o bot num VPS gratuito do GCP.

## 0. Pré-requisitos

- Conta Google
- Cartão de crédito internacional (verificação — não cobra dentro do free tier)
- Repositório git com o código do bot (instruções abaixo)
- Token do bot e IDs do Discord prontos (ver `.env.example`)

## 1. Subir o código pro GitHub

Da sua máquina (PowerShell ou Git Bash, na pasta do projeto):

```bash
git init
git add .
git commit -m "init"
# crie um repo (privado, de preferencia) em https://github.com/new
git remote add origin https://github.com/SEU_USUARIO/app-discord.git
git branch -M main
git push -u origin main
```

> Se for repo privado, vai precisar de PAT (Personal Access Token) no `git push`. Crie em GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained → escopo: read/write em `app-discord`.

## 2. Criar a VM no GCP

1. Acesse https://console.cloud.google.com — faça login, aceite termos, cadastre cartão.
2. Crie um projeto (ou use o `My First Project` que vem por padrão).
3. No menu lateral: **Compute Engine → VM instances**. Se pedir, clique em **Enable** pra ativar a API (1-2 min).
4. **Create instance** com estas configurações exatas (qualquer divergência tira do free tier):

   | Campo | Valor |
   |---|---|
   | Name | `app-discord` |
   | Region | `us-central1 (Iowa)` |
   | Zone | `us-central1-a` (qualquer letra serve) |
   | Machine configuration | `E2` |
   | Machine type | `e2-micro` (2 vCPU shared, 1 GB) |
   | Boot disk → Change | OS: **Ubuntu**, version: **Ubuntu 22.04 LTS Minimal**, type: **Standard persistent disk**, size: **30 GB** |
   | Firewall | desmarque HTTP/HTTPS (bot não precisa) |

5. **Create**. Espera ~1 min até ficar com bolinha verde.

> ⚠️ Free tier exige: `e2-micro` + região `us-west1`/`us-central1`/`us-east1` + disco **standard** (não SSD) ≤ 30 GB. Sair disso vira cobrança.

## 3. Conectar via SSH

Na linha da VM, clique em **SSH** (abre terminal no navegador). Não precisa de chave nem cliente local.

## 4. Bootstrap da VM

Dentro do SSH:

```bash
sudo apt-get update -y
sudo apt-get install -y git
git clone https://github.com/SEU_USUARIO/app-discord.git ~/app-discord
cd ~/app-discord
bash scripts/setup.sh
```

O script instala Node 20, build-essential (pra compilar `better-sqlite3`), PM2, e configura o PM2 pra subir no boot. No final ele imprime um comando `sudo systemctl ...` — **rode esse comando** (é o que registra o serviço de fato).

## 5. Configurar `.env`

```bash
cp .env.example .env
nano .env
```

Preencha:
- `DISCORD_TOKEN` — token do bot
- `CLIENT_ID` — Application ID
- `GUILD_ID` — ID do servidor
- `REPORT_CHANNEL_ID` — canal do relatório semanal
- `TIMEZONE` e `REPORT_CRON` já vêm com defaults (sex 18:00 BRT)

`Ctrl+O`, `Enter`, `Ctrl+X` pra salvar e sair.

## 6. Instalar deps e registrar slash commands

```bash
npm ci --omit=dev
npm run register
```

Esperado: `Slash commands registrados com sucesso.`

## 7. Subir o bot com PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs app-discord
```

Logs esperados:
```
Logado como SeuBot#1234
[reconcile] sessoes fechadas: 0, abertas: N
[scheduler] armado: 0 18 * * 5 (America/Sao_Paulo)
```

`Ctrl+C` sai dos logs sem matar o bot.

## 8. Validar

- No Discord, entre num canal de voz → saia depois de 1 min.
- Rode `/stats periodo:tudo` no servidor → deve aparecer o embed com você no ranking.

## Operações do dia-a-dia

| O que | Comando |
|---|---|
| Ver status | `pm2 status` |
| Ver logs ao vivo | `pm2 logs app-discord` |
| Reiniciar | `pm2 restart app-discord` |
| Atualizar código | `cd ~/app-discord && git pull && npm ci --omit=dev && pm2 restart app-discord` |
| Parar | `pm2 stop app-discord` |
| Matar PM2 inteiro | `pm2 kill` (precisa `pm2 start ... && pm2 save` de novo depois) |

## Backup do banco

O SQLite mora em `~/app-discord/data/calls.sqlite`. Pra baixar pra sua máquina:

```bash
# Da sua maquina local:
gcloud compute scp app-discord:~/app-discord/data/calls.sqlite ./calls-backup.sqlite --zone=us-central1-a
```

Ou copie pelo console SSH com o botão de download de arquivo (engrenagem no canto superior direito do terminal web).

## Custos & alertas

Pra evitar surpresa:

1. Console GCP → **Billing → Budgets & alerts → Create budget**.
2. Defina orçamento de **US$ 1/mês**, alerta em 50% / 90% / 100%.
3. Confirme que a VM aparece como **Free tier eligible** em Compute Engine (filtro no canto).

Egress (saída de dados) é o único risco real — bot Discord usa quase nada (alguns MB/mês), bem dentro do 1 GB free.

## Troubleshooting

- **`better-sqlite3` falha ao compilar** → faltou `build-essential` ou `python3`. Rode o `setup.sh` de novo.
- **Bot não responde a `/stats`** → `npm run register` foi executado? Slash commands de guild aparecem em ~5s, globais demoram até 1h.
- **Bot mostra offline no Discord** → `pm2 logs app-discord` pra ver erro. Token errado é o mais comum.
- **VM ficou inacessível** → Console GCP → VM → Reset. Bot volta sozinho via PM2 + systemd.
