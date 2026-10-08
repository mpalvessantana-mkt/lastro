import { doc, setDoc } from "firebase/firestore";
import { db } from "../src/lib/firebase";
import corpusData from "../manuais/corpus-completo.json";

async function seed() {
  console.log(`Carregando ${corpusData.normas.length} normas do corpus ${corpusData.versaoCorpus}...`);
  let total = 0;
  for (const norma of corpusData.normas) {
    try {
      await setDoc(doc(db, "normas", norma.id), norma);
      total++;
      process.stdout.write(`.`);
    } catch (err) {
      console.error(`\nErro ao gravar norma ${norma.id}:`, err);
    }
  }
  console.log(`\nSeed concluído! ${total} normas gravadas no Firestore.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Falha no seed de normas:", err);
  process.exit(1);
});
