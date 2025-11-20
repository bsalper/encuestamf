import { BrowserRouter, Routes, Route } from "react-router-dom";

import UserEntry from "./Components/UserEntry/UserEntry";
import Cuestionario from "./Components/Cuestionario/Cuestionario";
import Gracias from "./Components/Gracias/Gracias";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UserEntry />} />
        <Route path="/encuesta" element={<Cuestionario />} />
        <Route path="/gracias" element={<Gracias />} />
      </Routes>
    </BrowserRouter>
  );
}
