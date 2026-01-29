import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Views/Home";
import UserEntry from "./Views/UserEntry";
import SurveyView from "./Views/SurveyView";
import Gracias from "./Views/Gracias";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. La puerta de entrada principal con el sistema de PIN */}
        <Route path="/" element={<Home />} />

        {/* 2. Pantalla de selección de nombre (Vendedor u Operario) */}
        <Route path="/encuesta/:idEncuesta" element={<UserEntry />} />
        
        {/* 3. El cuestionario dinámico según la categoría */}
        <Route path="/cuestionario/:idEncuesta/:idVendedor" element={<SurveyView />} />
        
        {/* 4. Pantalla final */}
        <Route path="/gracias" element={<Gracias />} />
      </Routes>
    </BrowserRouter>
  );
}