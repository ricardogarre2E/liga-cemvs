import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppPublico from "./AppPublico";
import AppAdmin from "./AppAdmin";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppPublico />} />
        <Route path="/admin" element={<AppAdmin />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);