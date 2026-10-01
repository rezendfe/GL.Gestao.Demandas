const EXTENSOES = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export function apenasDigitos(valor: string, maximo: number) {
  return valor.replace(/\D/g, "").slice(0, maximo);
}

export function mascaraEmail(valor: string) {
  return valor.replace(/\s/g, "").slice(0, 320);
}

export function mascaraTelefone(valor: string) {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.startsWith("55") && digitos.length > 11) digitos = digitos.slice(2);
  digitos = digitos.slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export function mascaraCodigo(valor: string) {
  return valor.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 40);
}

export function formatarContato(canal: "EMAIL" | "TELEFONE" | "WHATSAPP", valor: string) {
  return canal === "EMAIL" ? mascaraEmail(valor) : mascaraTelefone(valor);
}

export function validarTexto(valor: string, minimo: number, maximo: number, mensagem: string) {
  const texto = valor.trim();
  if (texto.length < minimo || texto.length > maximo) return mensagem;
  return null;
}

export function validarOpcional(valor: string, maximo: number, mensagem: string) {
  if (valor.trim().length > maximo) return mensagem;
  return null;
}

export function validarEmail(valor: string) {
  const email = valor.trim().toLowerCase();
  const arroba = email.indexOf("@");
  const dominio = arroba > 0 ? email.slice(arroba + 1) : "";
  const valido = arroba > 0
    && !email.includes("@", arroba + 1)
    && !email.includes(" ")
    && dominio.includes(".")
    && !dominio.startsWith(".")
    && !dominio.endsWith(".")
    && !dominio.includes("..");
  if (email.length < 6 || email.length > 320 || !valido) return "Informe um e-mail válido.";
  return null;
}

export function validarTelefone(valor: string) {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2);
  if (digitos.length !== 10 && digitos.length !== 11) return "Informe um telefone com DDD, no formato (00) 00000-0000.";
  return null;
}

export function validarHoras(valor: string) {
  if (valor.trim() === "") return null;
  if (!/^\d+$/.test(valor)) return "A meta de prazo aceita somente números.";
  const horas = Number(valor);
  if (!Number.isInteger(horas) || horas < 1 || horas > 8760) return "A meta de prazo fica entre 1 e 8760 horas, ou em branco.";
  return null;
}

export function validarContato(canal: "EMAIL" | "TELEFONE" | "WHATSAPP", valor: string) {
  return canal === "EMAIL" ? validarEmail(valor) : validarTelefone(valor);
}

export function validarLogo(valor: string) {
  const texto = valor.trim();
  if (!texto) return null;
  if (texto.length > 300) return "O logo tem no máximo 300 caracteres.";
  if (texto.toLowerCase().startsWith("http")) {
    try {
      const url = new URL(texto);
      if (!url.protocol.startsWith("http")) return "Informe uma URL válida para o logo, ou um caminho.";
    } catch {
      return "Informe uma URL válida para o logo, ou um caminho.";
    }
  }
  return null;
}

export function validarCodigo(valor: string) {
  const codigo = valor.trim();
  if (codigo.length < 1 || codigo.length > 40) return "Informe o código do espaço.";
  if (!/^[A-Z0-9-]+$/.test(codigo)) return "O código do espaço usa letras, números e hífen.";
  return null;
}

export function validarArquivo(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  if (!EXTENSOES.some((extensao) => nome.endsWith(extensao))) return "Envie uma foto JPG, PNG, WEBP ou um PDF.";
  if (arquivo.size <= 0 || arquivo.size > 5 * 1024 * 1024) return "O arquivo deve ter até 5 MB.";
  return null;
}

export function validarDataOpcional(valor: string, minimo?: string, mensagemAnterior?: string) {
  if (!valor) return null;
  return validarData(valor, minimo, mensagemAnterior);
}

export function validarData(valor: string, minimo?: string, mensagemAnterior = "A data não pode ser anterior ao limite.") {
  if (!valor) return "Informe a data.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return "Informe uma data válida.";
  if (minimo && valor < minimo) return mensagemAnterior;
  return null;
}
