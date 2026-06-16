import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <Toaster position="top-right" toastOptions={{ style: { background: "#1e2235", color: "#e2e8f0", border: "1px solid #3b4166" } }} />
  </BrowserRouter>
);
