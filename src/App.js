import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserEntry from "./Views/UserEntry";
import SurveyView from "./Views/SurveyView";
import Gracias from "./Views/Gracias";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección automática: Si alguien entra a la raíz (/), 
            puedes mandarlo a una página de error o a la de vendedores por defecto */}
        <Route path="/" element={<Navigate to="/encuesta/vendedor" />} />

        {/* Pantalla de selección de nombre para Vendedores */}
        <Route path="/encuesta/:idEncuesta" element={<UserEntry />} />
        
        {/* Cuestionario Directo (El que usará Diego) */}
        <Route path="/cuestionario/:idEncuesta/:idUsuario" element={<SurveyView />} />
        
        <Route path="/gracias" element={<Gracias />} />
      </Routes>
    </BrowserRouter>
  );
}