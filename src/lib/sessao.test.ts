import { test } from "node:test";
import assert from "node:assert/strict";
import { destinoAposLogin } from "./sessao";

test("depois do login, volta para a rota interna pedida", () => {
  assert.equal(destinoAposLogin("/casos/PRJ02/parecer"), "/casos/PRJ02/parecer");
  assert.equal(destinoAposLogin("/referencia?classe=ELEGIVEL"), "/referencia?classe=ELEGIVEL");
  assert.equal(destinoAposLogin("/"), "/");
});

test("sem rota, rota externa ou o próprio login, vai para /casos", () => {
  assert.equal(destinoAposLogin(null), "/casos");
  assert.equal(destinoAposLogin(""), "/casos");
  assert.equal(destinoAposLogin("https://exemplo.com"), "/casos");
  assert.equal(destinoAposLogin("//exemplo.com"), "/casos");
  assert.equal(destinoAposLogin("/login?volta=/casos"), "/casos");
});
