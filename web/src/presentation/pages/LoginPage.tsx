import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSessao } from "../../application/session";
import { mascaraEmail, validarEmail } from "../../domain/entrada";
import { ApiError } from "../../infrastructure/api/client";
import type { Perfil } from "../../domain/types";

const contas: { perfil: Perfil; email: string; nome: string }[] = [
  { perfil: "Cessionário", email: "joao.silva@empresaexemplo.com.br", nome: "João Silva · Empresa Exemplo" },
  { perfil: "GL / Administrador", email: "patricia.lima@gleventos.com.br", nome: "Patrícia Lima" },
  { perfil: "Responsável da Área", email: "responsavel.01@gleventos.com.br", nome: "Responsável 01 · Manutenção" },
];

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
          <p className="muted">Escolha um perfil. A senha de todos é Demo@2026.</p>
          <div className="profiles">
            {contas.map((conta) => (
              <button
                key={conta.email}
                type="button"
                className={email === conta.email ? "profile active" : "profile"}
                onClick={() => setEmail(conta.email)}
              >
                <strong>{conta.perfil}</strong>
                <span className="muted">{conta.nome}</span>
              </button>
            ))}
          </div>
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
          <p className="note">Recepção: responsavel.02@gleventos.com.br · Estacionamento: responsavel.03@gleventos.com.br</p>
        </form>
        <div className="login-footer">
          <span>GL Events</span>
          <span>Demonstração</span>
        </div>
      </div>
    </div>
  );
}
