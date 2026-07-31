# Dine Mouse — Worker de Monitoramento

Motor que vai ao **site oficial de reservas do Walt Disney World**, lê a
disponibilidade de restaurantes e dispara alertas para quem comprou.

Não usa API de terceiros nem lista manual. A disponibilidade vem de:

```
Site oficial de reservas da Disney
   + endpoint interno /dine-res/api/availability/
   + sessão real em Chromium controlado por Playwright
```

E o catálogo de restaurantes (ID → nome/parque) vem de:

```
/finder/api/v1/explorer-service/  (destino WDW: wdw/80007798)
```

## Como funciona (pipeline)

```
Agendador  → pega alertas ativos "na hora de checar" (coleção Alert)
Catálogo   → resolve nome do restaurante -> facilityId (Finder API)
Agrupa     → por (data, nº de pessoas): 1 busca cobre o WDW inteiro
Checker    → fetch da disponibilidade DENTRO do navegador (sessão real);
             no 428, dirige o formulário oficial e intercepta a resposta JSON
Dedup      → ignora slots já avisados (notifiedSlots)
Notifica   → e-mail (Resend) + WhatsApp (stub)
```

## Estrutura

```
worker/
  index.js            entrypoint (modos: loop | once | probe | catalog)
  config.js           env + constantes WDW
  disney/
    browser.js        Chromium persistente, sessão MyDisney, fetch in-page, retry 428
    catalog.js        sync do Finder, mapa id<->nome, matcher nome->facilityId
  core/
    parse.js          normaliza a resposta de /dine-res/api/availability/
    run.js            um ciclo: agrupa, busca, casa, deduplica, dispara
  notify/
    email.js          e-mail de vaga (Resend)
    whatsapp.js       stub (plugar Twilio/Meta)
    dispatch.js       roteia por canal
lib/
  Alert.js            modelo (fonte da verdade do worker)
  syncAlertsFromUser.js  compra/backfill -> documentos Alert
```

## Setup

```bash
npm install
npx playwright install chromium
```

### ⚠️ Duas descobertas do primeiro run real

1. **Chrome real obrigatório.** O Chromium empacotado do Playwright é bloqueado
   pelo Akamai da Disney (fingerprint HTTP/2 → `ERR_HTTP2_PROTOCOL_ERROR` /
   tarpit). Use `WORKER_BROWSER_CHANNEL=chrome` (Chrome instalado). O worker já
   força HTTP/1.1 (`--disable-http2`) e disfarça a automação.
2. **Disponibilidade exige login MyDisney.** Sem sessão logada, a API responde
   `401 BAD_AUTHZ_TOKEN`. O catálogo (Finder) NÃO precisa de login. A Disney
   também faz geo-redirect (ex.: `www.disneyworld.eu` no Brasil) — o worker
   detecta e usa a origem resolvida automaticamente.

### Variáveis de ambiente (.env)

Já existentes: `MONGODB_URI`, `RESEND_API_KEY`, `RESEND_FROM`, `APP_PUBLIC_URL`.

Novas:

| Var | Default | Descrição |
|-----|---------|-----------|
| `WORKER_BROWSER_CHANNEL` | — | **Use `chrome`** (Chromium empacotado é bloqueado). |
| `DISNEY_USERNAME` / `DISNEY_PASSWORD` | — | Conta MyDisney do worker (login automático). Se ausente, prime a sessão manualmente. |
| `WORKER_HEADLESS` | `true` | `false` abre o navegador visível (para primar a sessão / login). |
| `WORKER_SESSION_DIR` | `worker/.session` | Onde a sessão/cookies persistem. |
| `WORKER_INTERVAL_MS` | `60000` | Intervalo entre ciclos. |
| `ALERT_RECHECK_MS` | `90000` | Gap mínimo antes de re-checar o mesmo alerta. |
| `ALERT_ERROR_BACKOFF_MS` | `300000` | Backoff após erro. |
| `WORKER_MAX_GROUPS_PER_CYCLE` | `8` | Máx. de buscas por ciclo (rate limit). |
| `WORKER_BETWEEN_SEARCHES_MS` | `4000` | Pausa entre buscas. |
| `WHATSAPP_PROVIDER` | — | `twilio` \| `meta` (quando implementado). |

## Primeira vez: primar a sessão MyDisney

Use o modo `login`: abre o Chrome visível e **espera você apertar ENTER** —
a janela NÃO fecha sozinha antes do login.

```bash
WORKER_BROWSER_CHANNEL=chrome npm run worker:login
```

Faça login na sua conta MyDisney na janela; volte ao terminal e pressione ENTER.
A sessão fica salva em `worker/.session` e é reusada nos próximos runs (inclusive
headless). Sem esse login, a busca de disponibilidade retorna `401`.

## Uso

```bash
# Sincroniza o catálogo (id <-> nome dos restaurantes do WDW)
npm run worker:catalog

# Importa alertas já comprados (PortalUsers existentes) para a coleção Alert
npm run alerts:backfill

# Um único ciclo (útil para testar)
npm run worker:once

# Loop contínuo (produção)
npm run worker

# Probe: inspeciona a resposta crua da Disney (NÃO toca no banco)
npm run worker:probe -- 2026-10-10 4
```

## Como a disponibilidade é obtida (confirmado ao vivo)

1. O worker abre o site (Chrome real) e o SPA emite um **BEARER** (OneID) —
   capturado automaticamente das requisições.
2. Replay autorizado via `page.request`:
   `GET /dine-res/api/availability/{party}/{date}/00:00:00,23:59:59`
   com `authorization: BEARER ...`, `x-function-name: getAvailability`,
   `x-disney-internal-dine-vas-eks: true`. Retorna JSON (não o HTML de fallback).
3. `core/parse.js` lê `restaurant["<facilityId>"].offers["<date>"]` →
   blocos por refeição → `offersByAccessibility[].offers[].time`.
4. Se o token estiver velho (401/HTML), o worker reaquece a sessão. No `428`
   (challenge Akamai), cai para dirigir o formulário e interceptar.

Amostras cruas ficam em `worker/samples/` (`worker:probe` as gera).

## Testar sem notificar clientes

`WORKER_DRY_RUN=true` roda o ciclo inteiro (busca real, match, dedup) mas só
**loga** quem seria notificado — não envia e-mail/WhatsApp.

```bash
WORKER_BROWSER_CHANNEL=chrome WORKER_DRY_RUN=true npm run worker:once
```

## WhatsApp (Meta WhatsApp Cloud API)

Alertas são mensagens **proativas** — o WhatsApp exige um **template aprovado**
no Meta Business (não dá para mandar texto livre fora da janela de 24h).

**1. Pré-requisitos (no Meta):**
- Conta Meta Business + app com o produto WhatsApp.
- Um número WhatsApp Business → anote o **Phone Number ID**.
- Um **token** de acesso (de preferência de System User, permanente).

**2. Crie o template** (WhatsApp Manager → Message Templates), categoria
`UTILITY`, idioma `pt_BR`, com **3 variáveis no corpo**:

```
🎉 Vaga na Disney! {{1}} — {{2}}. Horários: {{3}}. Reserve rápido no site oficial.
```
`{{1}}` = restaurante · `{{2}}` = data · refeição · nº pessoas · `{{3}}` = horários.

**3. Configure o .env:**
```
WHATSAPP_PROVIDER=meta
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_TEMPLATE_NAME=vaga_disponivel   # o nome que você deu ao template
WHATSAPP_TEMPLATE_LANG=pt_BR
```

O canal WhatsApp de um alerta liga quando o cliente tem telefone(s) cadastrado(s)
(`channels.whatsapp`). Os números são normalizados para E.164 sem `+`.
Enquanto `WHATSAPP_TEMPLATE_NAME` estiver vazio, o worker tenta texto livre
(só funciona para número de teste / dentro da janela de 24h).

## Deploy

Playwright + Chrome **não** rodam em serverless (Vercel). Rode como processo
dedicado sempre-ligado. Há um `Dockerfile` (na raiz) com o **Google Chrome real**
já instalado e um `render.yaml` (blueprint do Render).

### Sessão persistida no MongoDB (o pulo do gato)

Você **loga uma vez no seu Mac** e o servidor restaura a sessão do banco sozinho
— não precisa fazer login headless na nuvem.

```bash
# no seu Mac (janela visível), loga e JÁ salva a sessão no MongoDB:
npm run worker:login

# (se a sessão local já está logada e você só quer (re)salvar no banco:)
npm run worker:save-session
```

No boot, o worker chama `restoreSession()` e recupera os cookies do Mongo.
Quando a sessão expirar, o worker te avisa por e-mail (`OPS_ALERT_EMAIL`) e basta
rodar `worker:login` de novo (de qualquer lugar).

### Render (blueprint)

1. `npm run worker:login` no seu Mac (salva a sessão no Mongo).
2. Suba o repo no Render como **Blueprint** (usa o `render.yaml`).
3. Preencha as variáveis marcadas `sync:false` (MONGODB_URI, RESEND, WhatsApp, OPS_ALERT_EMAIL).

### Railway / Fly / VPS (Docker)

```bash
docker build -t dinemouse-worker .
docker run -d --env-file .env -v dinemouse_data:/data dinemouse-worker
```

Passe as mesmas variáveis do `.env`. Monte um volume em `/data` para manter a
sessão/catálogo entre reinícios (opcional — a sessão também vive no Mongo).
O container precisa de **~1GB de RAM** (Chrome).

## Escopo do v1

Apenas **Walt Disney World**. Alertas de Disneyland / Paris / Tokyo são salvos
com `status: 'unsupported'` e ignorados pelo worker até termos os endpoints
equivalentes de cada resort.
