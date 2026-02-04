import React from "react";
import { Navigate } from "react-router-dom";

const ProfesorRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const rol = localStorage.getItem("rol");

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (rol !== "profesor") {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProfesorRoute;