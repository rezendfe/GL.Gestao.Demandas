export type ClasseArquivo = "imagem" | "pdf" | "audio" | "word" | "excel" | "outro";

const IMAGENS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];
const AUDIO = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm"];
const WORD = [".doc", ".docx"];
const EXCEL = [".xls", ".xlsx"];

export function extensaoDe(nome: string) {
  const ponto = nome.lastIndexOf(".");
  return ponto >= 0 ? nome.slice(ponto).toLowerCase() : "";
}

export function classeArquivo(nome: string, tipo = ""): ClasseArquivo {
  const extensao = extensaoDe(nome);
  const midia = tipo.toLowerCase();
  if (IMAGENS.includes(extensao) || midia.startsWith("image/")) return "imagem";
  if (extensao === ".pdf" || midia === "application/pdf") return "pdf";
  if (AUDIO.includes(extensao) || midia.startsWith("audio/")) return "audio";
  if (WORD.includes(extensao) || midia.includes("word") || midia.includes("msword")) return "word";
  if (EXCEL.includes(extensao) || midia.includes("excel") || midia.includes("spreadsheet")) return "excel";
  return "outro";
}

export function tipoBlob(nome: string, tipo: string) {
  if (tipo && tipo !== "application/octet-stream") return tipo;
  const extensao = extensaoDe(nome);
  if (extensao === ".pdf") return "application/pdf";
  if (extensao === ".png") return "image/png";
  if (extensao === ".jpg" || extensao === ".jpeg") return "image/jpeg";
  if (extensao === ".webp") return "image/webp";
  if (extensao === ".gif") return "image/gif";
  if (extensao === ".mp3") return "audio/mpeg";
  if (extensao === ".wav") return "audio/wav";
  if (extensao === ".m4a") return "audio/mp4";
  if (extensao === ".ogg") return "audio/ogg";
  if (extensao === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extensao === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return tipo || "application/octet-stream";
}
