// Verifica Bug 3: un oggetto con dati sensibili deve uscire su stdout come [REDACTED].
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

// Il logger gira in un processo figlio: catturiamo il suo stdout reale (JSON, senza pino-pretty).
const logOnStdout = (payload: object): string => {
  const script = `
    const pino = require("pino");
    const { loggerOptions } = require(${JSON.stringify(path.join(__dirname, "logger.ts"))});
    pino(loggerOptions).info(${JSON.stringify(payload)}, "test redact");
  `;
  const result = spawnSync(process.execPath, ["--import", "tsx", "-e", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
};

test("password al primo livello → [REDACTED]", () => {
  const out = logOnStdout({ username: "mario.rossi", password: "Pa$$w0rd!" });
  assert.match(out, /"password":"\[REDACTED\]"/);
  assert.doesNotMatch(out, /Pa\$\$w0rd!/);
  assert.match(out, /"username":"mario.rossi"/); // i campi non sensibili restano leggibili
});

test("varianti wildcard (*.password, *.cvv, ...) → [REDACTED]", () => {
  const out = logOnStdout({
    user: { password: "x", passwordHash: "y", token: "z", fiscalCode: "RSSMRA80A01H501U" },
    card: { pan: "4111111111111111", cvv: "123" },
  });
  for (const secret of ["RSSMRA80A01H501U", "4111111111111111", '"cvv":"123"']) {
    assert.ok(!out.includes(secret), `${secret} non deve comparire nei log`);
  }
  assert.equal(out.match(/\[REDACTED\]/g)?.length, 6);
});

test("req.body.password e header authorization/cookie → [REDACTED]", () => {
  const out = logOnStdout({
    req: {
      headers: { authorization: "Bearer secret-token-123", cookie: "sid=abc", host: "localhost" },
      body: { username: "mario.rossi", password: "Pa$$w0rd!" },
    },
  });
  assert.doesNotMatch(out, /secret-token-123|sid=abc|Pa\$\$w0rd!/);
  assert.match(out, /"host":"localhost"/);
});
