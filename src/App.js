import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SideBar } from "./Component/SideBar/SideBar";

import { ControlPanel } from "./pages/ControlPanel/ControlPanel";
import { Home } from "./pages/Home/Home";

import { Anbar } from "./pages/Anbar/Anbar";
import "./App.scss";
import { CashFlow } from "./pages/CashFlow/CashFlow";
import { Welcome } from "./pages/Welcome/Welcome";
import { Report } from "./pages/Reports/Report";
const App = () => {
  return (
    <BrowserRouter>
      <div className="App-Wrapper">
        <SideBar />

        <div className="App-Content">
          <Routes>
            <Route path="/report" element={<Report />} />
            <Route path="/dashboard" element={<ControlPanel />} />
            <Route path="/warehouse" element={<Anbar />} />
            <Route path="/cashflow" element={<CashFlow />} />
            <Route path="/" element={<Welcome />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
