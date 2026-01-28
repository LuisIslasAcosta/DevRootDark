import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const acceptedTerms = localStorage.getItem("acceptedTerms") === "true";

  if (!isLoggedIn || !acceptedTerms) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;