import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./Component/Header/Header";
import { ControlPanel } from "./pages/ControlPanel/ControlPanel";


const App = () => {
  return (
    <BrowserRouter>
    <ControlPanel />
    </BrowserRouter>
  );
};

export default App;
