import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ventas.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

function Ventas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= CONSUMIR API =================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    axios.get("http://127.0.0.1:5000/api/ventas", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error(err);
        setError("Error al cargar ventas");
      })
      .finally(() => setLoading(false));

  }, []);

  // ================= LOADING =================
  if (loading) return <p>Cargando ventas...</p>;
  if (error) return <p>{error}</p>;

  // 🔥 Filtrar solo cursos con ingresos (para que la gráfica se vea bien)
  const cursosConVentas = data.resumen.filter(c => c.ingreso_total > 0);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Análisis de Ventas</h2>

      {/* ================= TABLA ================= */}
      <h3>Tabla de Cursos</h3>
      <table className="ventas-table">
        <thead>
          <tr>
            <th>Curso</th>
            <th>Ventas</th>
            <th>Ingresos</th>
            <th>Precio Promedio</th>
            <th>Clasificación</th>
          </tr>
        </thead>
        <tbody>
          {data.resumen.map((curso, index) => (
            <tr key={index}>
              <td>{curso.nombre}</td>
              <td>{curso.cantidad_total}</td>
              <td>${curso.ingreso_total}</td>
              <td>${curso.precio_promedio}</td>
              <td>{curso.clasificacion}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= GRAFICA INGRESOS ================= */}
      <h3 style={{ marginTop: "40px" }}>Ingresos por Curso</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={cursosConVentas}>
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="ingreso_total" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>

      {/* ================= GRAFICA VENTAS ================= */}
      <h3 style={{ marginTop: "40px" }}>Ventas por Curso</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={cursosConVentas}>
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="cantidad_total" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}

export default Ventas;