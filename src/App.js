import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./Component/Header/Header";
import { ControlPanel } from "./pages/ControlPanel/ControlPanel";
import { SideBar } from "./Component/SideBar/SideBar";
import "./App.scss";

const App = () => {
  return (
    <BrowserRouter>
      <div className="App-Wrapper">
        <div className="App-Inner">
          <SideBar />
          <ControlPanel />
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
