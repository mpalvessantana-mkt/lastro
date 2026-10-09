// O worker do pdf.js não traz declaração de tipos; só é importado pelo efeito (globalThis.pdfjsWorker).
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs";
