import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <AuthProvider>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </AuthProvider>
);
