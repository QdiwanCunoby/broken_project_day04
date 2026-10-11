# 🔧 Broken Project — Giorno 4

Tre bug progressivi + una feature opzionale (validazione Zod, error handling centralizzato, logging Pino).
In questa cartella i bug sono **già corretti**: i punti esatti sono marcati con `✅ FIX Bug N`.

```bash
npm install            # solo la prima volta
npx tsx src/index.ts   # oppure: npm run dev  →  http://localhost:3000
npm test               # test della redaction dei log (Bug 3)
npm run typecheck
```

## Bug 1 🔴 — ZodError non gestito → 500 al posto di 400

```bash
curl -i -X POST http://localhost:3000/api/accounts -H "Content-Type: application/json" \
  -d '{"iban":"XX123","holderName":"Mario Rossi","balance":-100,"accountType":"CHECKING","customerId":"c1"}'
```

| | Risposta |
|---|---|
| Prima | `500 INTERNAL_ERROR` + nei log `ERROR: Errore non gestito … ZodError` |
| Dopo | `400 VALIDATION_ERROR` con `details: [{ field: "iban", … }, { field: "balance", message: "Il saldo iniziale non può essere negativo" }]` |

**Fix** in `src/middleware/errorHandler.ts`: ramo `if (err instanceof ZodError)` che mappa
`issues → { field: path.join("."), message }` e risponde 400.

## Bug 2 🟡 — asyncHandler mancante → richiesta appesa

```bash
curl -i --max-time 35 http://localhost:3000/api/accounts/non-esistente-uuid
```

| | Risposta |
|---|---|
| Prima | nessuna risposta (timeout del client), nei log nessun errore e nessuna riga `→ status` |
| Dopo | `404 NOT_FOUND` immediato |

**Fix** in `src/controllers/accountController.ts`: `getById = asyncHandler(async (req, res) => { … })`.

**Perché succede.** Express 4 chiama l'handler e **ignora il valore restituito**. Un handler `async`
restituisce una Promise: se `getAccountById` lancia `NotFoundError` la Promise viene rifiutata, ma nessuno
chiama `next(err)`. L'errorHandler non parte e nessuno scrive la response, quindi il socket resta
aperto finché il client va in timeout. L'errore finisce in `unhandledRejection`: in questo progetto il listener
in `src/index.ts` loggava a livello `debug` (invisibile con `LOG_LEVEL=info`), per questo "nei log nessun errore".
Senza quel listener Node ≥ 15 avrebbe **terminato il processo**. Ora il listener logga a livello `error`.

`asyncHandler` fa semplicemente `Promise.resolve(fn(req, res, next)).catch(next)`.

**Perché Express 5 non ha questo problema.** In Express 5 il router controlla se l'handler (o un middleware)
restituisce una Promise e, se viene rifiutata, chiama da solo `next(err)` con l'errore (o con un
`Error` generico se la Promise è rifiutata con `undefined`). Gli handler `async` funzionano senza wrapper
e `asyncHandler`/`express-async-errors` non servono più.

## Bug 3 🟢 — Password loggata in chiaro (PCI-DSS / GDPR)

```bash
curl -i -X POST http://localhost:3000/api/accounts -H "Content-Type: application/json" \
  -H "Authorization: Bearer secret-token-123" -H "Cookie: sid=abc" \
  -d '{"username":"mario.rossi","password":"Pa$$w0rd!"}'
```

| | Log del `requestLogger` |
|---|---|
| Prima | `"password": "Pa$$w0rd!"`, `"authorization": "Bearer secret-token-123"` |
| Dopo | `"password": "[REDACTED]"`, `"authorization": "[REDACTED]"`, `"cookie": "[REDACTED]"` |

**Fix** in `src/config/logger.ts`: sezione `redact` con `censor: "[REDACTED]"` su
`password, passwordHash, token, fiscalCode, pan, cvv`, sulle varianti `*.campo`, su `req.body.campo` e su
`req.headers.authorization`, `req.headers.cookie`.

> Il wildcard `*.password` copre **un solo livello** (`{ user: { password } }`). Il body loggato dal
> `requestLogger` sta a due livelli (`req.body.password`), per questo ci sono anche i path espliciti `req.body.*`.

**Test** in `src/config/logger.test.ts` (`npm test`): logga oggetti con dati sensibili in un processo
figlio e verifica che nello **stdout** compaia `[REDACTED]` e mai il valore in chiaro.

## Feature opzionale — Rate limiter

`src/middleware/rateLimiter.ts`, con `express-rate-limit`:

- `globalLimiter`: 60 s / 100 richieste, `standardHeaders: true` (header `RateLimit-*`), montato su `/api`
  in `src/app.ts` (`/health` resta escluso).
- `strictLimiter`: 60 s / 5 richieste, pronto per `POST /api/auth/login` (G6).
- Oltre il limite: `429` con envelope `{ success: false, error: { code: "RATE_LIMITED", message } }`.

L'opzione `max` del PDF in express-rate-limit v7+ si chiama `limit` (`max` resta come alias deprecato).

```bash
for i in $(seq 1 101); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/accounts; done | sort | uniq -c
#   100 200
#     1 429
```

> In produzione, con più istanze dietro Nginx, il contatore in-memory non basta (ogni istanza conta a sé):
> serve uno store condiviso come `rate-limit-redis` (G10).

## Checklist

- [x] POST con `balance: -100` → `400 VALIDATION_ERROR` con dettaglio per campo
- [x] GET id inesistente → `404 NOT_FOUND` immediato
- [x] Password / token / cookie → `[REDACTED]` nei log (`npm test`: 3/3 verdi)
- [x] 101ª richiesta in 60 s → `429 RATE_LIMITED` con header `RateLimit-*`
- [x] `npm run typecheck` passa
