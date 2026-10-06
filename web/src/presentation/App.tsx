import { Navigate, Route, Routes } from "react-router-dom";
import { useSessao } from "../application/session";
import { Shell } from "./components/Shell";
import { CadeiaPage } from "./pages/CadeiaPage";
import { CadastrosPage } from "./pages/CadastrosPage";
import { AbrirPage } from "./pages/AbrirPage";
import { CentralPage } from "./pages/CentralPage";
import { ComunicadoPage, ComunicadosPage } from "./pages/ComunicadosPage";
import { InicioPage } from "./pages/InicioPage";
import { DetalhePage } from "./pages/DetalhePage";
import { LoginPage } from "./pages/LoginPage";
import { MinhasPage } from "./pages/MinhasPage";
import { EspacoPage, EspacosListaPage, MeuEspacoPage } from "./pages/EspacoPage";
import { EmpresasCessionariasPage } from "./pages/EmpresasCessionariasPage";
import { AuditoriaPage } from "./pages/AuditoriaPage";
import { ObrasPage } from "./pages/ObrasPage";

function Protegido() {
  const { sessao } = useSessao();
  if (!sessao) return <Navigate to="/login" replace />;
  return <Shell />;
}

function Inicio() {
  const { sessao } = useSessao();
  if (!sessao) return <Navigate to="/login" replace />;
  return <Navigate to="/inicio" replace />;
}

function AgendaLegada() {
  const { sessao } = useSessao();
  if (sessao?.usuario.perfil === "Cessionário") return <Navigate to="/inicio" replace />;
  return <Navigate to="/central?visao=agenda" replace />;
}

export function App() {
  const { sessao } = useSessao();
  return (
    <Routes>
      <Route path="/login" element={sessao ? <Inicio /> : <LoginPage />} />
      <Route element={<Protegido />}>
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/auditoria" element={<AuditoriaPage />} />
        <Route path="/central" element={<CentralPage />} />
        <Route path="/agenda" element={<AgendaLegada />} />
        <Route path="/comunicados" element={<ComunicadosPage />} />
        <Route path="/comunicados/:id" element={<ComunicadoPage />} />
        <Route path="/quadro" element={<Navigate to="/central?visao=quadro" replace />} />
        <Route path="/cadeia" element={<CadeiaPage />} />
        <Route path="/cadastros" element={<CadastrosPage />} />
        <Route path="/operacao" element={<Navigate to="/central?visao=operacao" replace />} />
        <Route path="/minhas" element={<MinhasPage />} />
        <Route path="/abrir" element={<AbrirPage />} />
        <Route path="/mensageria" element={<Navigate to="/inicio" replace />} />
        <Route path="/demandas/:id" element={<DetalhePage />} />
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/meu-espaco" element={<MeuEspacoPage />} />
        <Route path="/espacos" element={<EspacosListaPage />} />
        <Route path="/empresas-cessionarias" element={<EmpresasCessionariasPage />} />
        <Route path="/espacos/:chave" element={<EspacoPage />} />
        <Route path="/espacos/:chave/:secao" element={<EspacoPage />} />
      </Route>
      <Route path="*" element={<Inicio />} />
    </Routes>
  );
}
