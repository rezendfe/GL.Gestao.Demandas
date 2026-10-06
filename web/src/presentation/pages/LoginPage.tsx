import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import { mascaraEmail, validarEmail } from "../../domain/entrada";
import { fotoPorPessoa } from "../../domain/fotos";
import { ApiError } from "../../infrastructure/api/client";
import type { Perfil } from "../../domain/types";

const contas: { perfil: Perfil; email: string; nome: string; detalhe: string }[] = [
  { perfil: "Cessionário", email: "joao.silva@empresaexemplo.com.br", nome: "João Silva", detalhe: "Empresa Exemplo" },
  { perfil: "Cessionário", email: "ana.costa@empresab.com.br", nome: "Ana Costa", detalhe: "Empresa B" },
  { perfil: "Cessionário", email: "carla.dias@empresac.com.br", nome: "Carla Dias", detalhe: "Empresa C" },
  { perfil: "Cessionário", email: "diego.alves@empresad.com.br", nome: "Diego Alves", detalhe: "Empresa D" },
  { perfil: "Cessionário", email: "marina.costa@empresaconecta.com.br", nome: "Marina Costa", detalhe: "Empresa Conecta" },
  { perfil: "GL / Administrador", email: "patricia.lima@gleventos.com.br", nome: "Patrícia Lima", detalhe: "GL events" },
  { perfil: "Responsável da Área", email: "responsavel.01@gleventos.com.br", nome: "Responsável 01", detalhe: "Manutenção" },
  { perfil: "Responsável da Área", email: "responsavel.02@gleventos.com.br", nome: "Responsável 02", detalhe: "Recepção" },
  { perfil: "Responsável da Área", email: "responsavel.03@gleventos.com.br", nome: "Responsável 03", detalhe: "Estacionamento" },
];

const perfis: Perfil[] = ["Cessionário", "GL / Administrador", "Responsável da Área"];

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((parte) => parte.length > 1)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

export function LoginPage() {
  const { entrar } = useSessao();
  const navigate = useNavigate();
  const [email, setEmail] = useState(contas[0].email);
  const [senha, setSenha] = useState("Demo@2026");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const emailInvalido = validarEmail(email);
    if (emailInvalido || senha.trim().length < 1) {
      setErro(emailInvalido ?? "Informe a senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
      navigate("/inicio");
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  const escolhida = contas.find((conta) => conta.email === email);
  const foto = escolhida ? fotoPorPessoa(escolhida.nome, escolhida.email) : null;

  return (
    <div className="login">
      <div className="login-box">
        <div className="login-logo">
          <img className="login-brand-logo" src="/gl-events-logo.png" alt="GL Events" />
          <div className="eyebrow">GL Events</div>
          <strong>Demandas</strong>
          <p>Gestão de solicitações dos cessionários.</p>
        </div>
        <form className="login-body" onSubmit={submit}>
          <div className="login-title">
            <strong>Entrar</strong> na demonstração
          </div>
          <p className="muted">Escolha quem entra. A senha de todos é Demo@2026.</p>
          <label htmlFor="login-pessoa">
            Pessoa
            <span className="login-pessoa">
              {foto ? (
                <img className="avatar sm foto" src={foto} alt="" />
              ) : (
                <span className="avatar sm" aria-hidden="true">{iniciais(escolhida?.nome ?? "GL")}</span>
              )}
              <select
                id="login-pessoa"
                value={escolhida?.email ?? ""}
                onChange={(event) => setEmail(event.target.value)}
              >
                {perfis.map((perfil) => (
                  <optgroup key={perfil} label={perfil}>
                    {contas.filter((conta) => conta.perfil === perfil).map((conta) => (
                      <option key={conta.email} value={conta.email}>
                        {conta.nome} · {conta.perfil} · {conta.detalhe}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </span>
          </label>
          <label>
            E-mail
            <input type="email" inputMode="email" value={email} onChange={(event) => setEmail(mascaraEmail(event.target.value))} autoComplete="username" maxLength={320} required />
          </label>
          <label>
            Senha
            <input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" />
          </label>
          {erro && <p className="erro">{erro}</p>}
          <button className="btn btn-block" type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="login-footer">
          <span>GL Events</span>
          <span>Demonstração</span>
        </div>
      </div>
    </div>
  );
}
