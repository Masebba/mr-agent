// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
{/* 
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
*/}
ReactDOM.render(
  <ConfigProvider>
    <App />
  </ConfigProvider>,
  document.getElementById("root")
);