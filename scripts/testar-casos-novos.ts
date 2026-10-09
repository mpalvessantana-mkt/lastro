import { analisarPacote } from "../src/motor";

console.log("-----------------------------------------");
console.log("TESTE 1: Pacote sem arquivos ou vazio");
const rVazio = analisarPacote("TESTE_VAZIO", "Projeto Sem Evidencias", {});
console.log("Classe:", rVazio.parecer.classeProposta);
console.log("Critérios:", {
  C1: rVazio.parecer.pontos[1].estadoProposto,
  C2: rVazio.parecer.pontos[2].estadoProposto,
  C3: rVazio.parecer.pontos[3].estadoProposto,
  C4: rVazio.parecer.pontos[4].estadoProposto,
  C5: rVazio.parecer.pontos[5].estadoProposto,
});

console.log("\n-----------------------------------------");
console.log("TESTE 2: Projeto de Rotina de TI / Software Comum (Frascati § 141)");
const rRotina = analisarPacote("TESTE_ROTINA", "Customização de ERP e Telas", {
  "dossie_projeto.txt": `
  Título: Customização de ERP e Telas
  Contexto: A empresa precisava de telas de cadastro e integração via API padrão para relatórios.
  Referência anterior: O produto já oferece o módulo padrão.
  Trabalho documentado: Foi feita a parametrização de sistema e criação de CRUD com métodos conhecidos e ferramentas prontas, sem avanço algorítmico.
  Limite da conclusão: Não há hipótese de mecanismo novo, apenas adequação da configuração e aceite limitado.
  `
});
console.log("Classe:", rRotina.parecer.classeProposta);
console.log("Critérios:", {
  C1: rRotina.parecer.pontos[1].estadoProposto,
  C2: rRotina.parecer.pontos[2].estadoProposto,
  C3: rRotina.parecer.pontos[3].estadoProposto,
  C4: rRotina.parecer.pontos[4].estadoProposto,
  C5: rRotina.parecer.pontos[5].estadoProposto
});

console.log("\n-----------------------------------------");
console.log("TESTE 3: Projeto Autêntico de P&D Experimental (Frascati § 84 / § 140)");
const rPD = analisarPacote("TESTE_PD", "Novo Algoritmo de Otimização Combinatória", {
  "dossie_projeto.txt": `
  Título: Novo Algoritmo de Otimização Combinatória
  Contexto: Problema de roteamento complexo com restrições dinâmicas de tempo.
  Referência anterior: As abordagens da literatura já eram conhecidas, mas perdem precisão com múltiplos nós.
  Trabalho documentado: Formulação de modelo próprio com hipótese de convergência e algoritmo inédito sob grafo de candidatos e ensaio comparativo lacrado antes da rodada.
  Limite da conclusão: Conclusão limitada ao escopo experimental ensaiado com os comparadores lacrados.
  `
});
console.log("Classe:", rPD.parecer.classeProposta);
console.log("Critérios:", {
  C1: rPD.parecer.pontos[1].estadoProposto,
  C2: rPD.parecer.pontos[2].estadoProposto,
  C3: rPD.parecer.pontos[3].estadoProposto,
  C4: rPD.parecer.pontos[4].estadoProposto,
  C5: rPD.parecer.pontos[5].estadoProposto,
});

