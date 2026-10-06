import { useEffect, useId, useState } from "react";
import { baixarModelo, lerPlanilha, validarLinhaCadastro, type DefinicaoCarga, type TipoCarga } from "../../domain/cargaCadastro";

type Linha = { numero: number; valores: Record<string, string>; erro: string | null };

export function CargaPlanilha({
  tipo,
  definicao,
  nomes,
  categorias,
  areas,
  tipos,
  funcoes,
  onFechar,
  onGravar,
}: {
  tipo: TipoCarga;
  definicao: DefinicaoCarga;
  nomes: string[];
  categorias?: string[];
  areas?: string[];
  tipos?: { categoria: string; nome: string }[];
  funcoes?: string[];
  onFechar: () => void;
  onGravar: (linhas: { numero: number; valores: Record<string, string> }[]) => Promise<void>;
}) {
  const tituloId = useId();
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState<string | null>(null);
  const validas = linhas.filter((linha) => !linha.erro);
  const invalidas = linhas.filter((linha) => linha.erro);

  useEffect(() => {
    const fechar = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !enviando) onFechar();
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [enviando, onFechar]);

  async function lerArquivo(arquivo: File) {
    setFalha(null);
    setAviso(null);
    setArquivoNome(arquivo.name);
    const texto = await arquivo.text();
    const lido = lerPlanilha(texto, definicao);
    if (lido.erro) {
      setLinhas([]);
      setFalha(lido.erro);
      return;
    }
    if (lido.linhas.length === 0) {
      setLinhas([]);
      setAviso("Nenhum cadastro além da linha de exemplo. Substitua o exemplo e envie de novo.");
      return;
    }
    const contexto = { nomes, categorias: categorias ?? [], areas: areas ?? [], tipos, funcoes };
    const anteriores: Record<string, string>[] = [];
    const avaliadas = lido.linhas.map((linha) => {
      const erro = validarLinhaCadastro(tipo, linha.valores, contexto, anteriores);
      if (!erro) anteriores.push(linha.valores);
      return { ...linha, erro };
    });
    setLinhas(avaliadas);
  }

  async function gravar() {
    setEnviando(true);
    setFalha(null);
    try {
      await onGravar(validas.map((linha) => ({ numero: linha.numero, valores: linha.valores })));
    } catch (error) {
      setFalha(error instanceof Error ? error.message : "Não foi possível importar a planilha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-fundo" role="presentation">
      <section className="modal modal-carga" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
        <h2 id={tituloId}>{definicao.titulo}</h2>
        <p className="muted">Baixe o modelo, preencha uma linha por cadastro e envie a planilha. A linha de exemplo do arquivo não é importada.</p>
        <p className="note">{definicao.instrucao}</p>
        <div className="row">
          <button className="btn secondary" type="button" onClick={() => baixarModelo(definicao)}>Baixar modelo</button>
        </div>
        <div className="carga-arquivo">
          <label className="btn secondary">
            Escolher planilha
            <input
              className="sr-only"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const arquivo = event.target.files?.[0];
                if (arquivo) void lerArquivo(arquivo);
              }}
            />
          </label>
          <span className="note">{arquivoNome ?? "Nenhuma planilha escolhida."}</span>
        </div>
        {aviso && <p className="note">{aviso}</p>}
        {falha && <p className="erro" role="alert">{falha}</p>}
        {linhas.length > 0 && (
          <div className="carga-resumo">
            <p>{validas.length === 1 ? "1 cadastro pronto." : `${validas.length} cadastros prontos.`} {invalidas.length > 0 ? `${invalidas.length} com erro.` : ""}</p>
            <div className="carga-tabela">
              <table>
                <thead>
                  <tr>
                    <th>Linha</th>
                    {definicao.colunas.map((coluna) => <th key={coluna.chave}>{coluna.titulo}</th>)}
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha) => (
                    <tr key={linha.numero}>
                      <td>{linha.numero}</td>
                      {definicao.colunas.map((coluna) => <td key={coluna.chave}>{linha.valores[coluna.chave] || "—"}</td>)}
                      <td>{linha.erro ?? "Pronta"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="row">
          <button className="btn" type="button" disabled={enviando || validas.length === 0 || invalidas.length > 0} onClick={() => void gravar()}>
            {enviando ? "Importando..." : "Importar planilha"}
          </button>
          <button className="btn secondary" type="button" disabled={enviando} onClick={onFechar}>Cancelar</button>
        </div>
      </section>
    </div>
  );
}
