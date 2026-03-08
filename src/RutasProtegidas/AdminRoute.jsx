import React from "react";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const acceptedTerms = localStorage.getItem("acceptedTerms") === "true";
  const rol = (localStorage.getItem("rol") || "").toLowerCase();

  if (!isLoggedIn || !acceptedTerms) {
    return <Navigate to="/login" replace />;
  }

  if (rol !== "administrador" && rol !== "admin") {
    return <Navigate to="/principal" replace />;
  }

  return children;
}

export default AdminRoute;