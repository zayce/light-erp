import React from "react";
import ReactDOM from "react-dom/client"; // Important to import from 'react-dom/client'
import App from "./App";
import "@fontsource-variable/archivo/wdth.css";
import "./theme.scss";

const root = ReactDOM.createRoot(document.getElementById("root")); // Create root
root.render(<App />); // Use the render
