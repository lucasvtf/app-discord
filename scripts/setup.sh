#!/usr/bin/env bash
# Bootstrap de uma VM Ubuntu/Debian fresh para rodar o bot.
# Idempotente: pode rodar de novo sem quebrar nada.
set -euo pipefail

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Este script espera Ubuntu/Debian (apt-get nao encontrado)." >&2
  exit 1
fi

echo "==> atualizando indices apt"
sudo apt-get update -y

echo "==> instalando dependencias de build (better-sqlite3 compila C++)"
sudo apt-get install -y curl git build-essential python3 ca-certificates

NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
  if [ "$NODE_MAJOR" -ge 20 ]; then
    NEED_NODE=0
  fi
fi

if [ "$NEED_NODE" = "1" ]; then
  echo "==> instalando Node.js 20 via NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "==> Node.js >= 20 ja presente: $(node -v)"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> instalando PM2"
  sudo npm install -g pm2
else
  echo "==> PM2 ja presente: $(pm2 -v)"
fi

echo "==> configurando PM2 para subir no boot (systemd)"
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME"

echo
echo "Versoes instaladas:"
node -v
npm -v
pm2 -v
echo
echo "Bootstrap concluido. Proximos passos:"
echo "  1. git clone <seu-repo> ~/app-discord"
echo "  2. cd ~/app-discord && npm ci --omit=dev"
echo "  3. cp .env.example .env && nano .env"
echo "  4. pm2 start ecosystem.config.cjs && pm2 save"
