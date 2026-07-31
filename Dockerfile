# Worker de monitoramento Dine Mouse.
# Usa o Google Chrome REAL (o Chromium empacotado é bloqueado pelo Akamai).
FROM node:20-slim

# Não baixar o Chromium do Playwright — usamos o Chrome do sistema (channel=chrome).
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    WORKER_BROWSER_CHANNEL=chrome \
    WORKER_HEADLESS=true \
    WORKER_SESSION_DIR=/data/session \
    WORKER_CATALOG_PATH=/data/wdw-catalog.json \
    WORKER_SAMPLES_DIR=/data/samples \
    NODE_ENV=production

# Google Chrome estável + fontes necessárias.
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget gnupg ca-certificates fonts-liberation \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
        | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
        > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências (package-lock não é versionado -> npm install, não npm ci).
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Diretório de dados (sessão/catálogo). Monte um volume aqui p/ persistir entre deploys.
RUN mkdir -p /data
VOLUME ["/data"]

# Loop contínuo de monitoramento.
CMD ["node", "worker/index.js"]
