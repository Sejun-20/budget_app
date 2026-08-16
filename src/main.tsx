import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import ReceiptUpload from "./pages/ReceiptUpload";
import TransactionNew from "./pages/TransactionNew";
import TransactionsList from "./pages/TransactionsList";
import Dashboard from "./pages/Dashboard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/receipts/upload" element={<ReceiptUpload />} />
        <Route path="/transactions/new" element={<TransactionNew />} />
        <Route path="/transactions" element={<TransactionsList />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
