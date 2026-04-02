import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ventas.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import Tree from "react-d3-tree";

function Ventas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No autenticado");
      setLoading(false);
      return;
    }

    axios.get("http://localhost:5000/api/ventas/decision-tree", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError("Error al cargar datos de ventas");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando análisis de ventas...</p>;
  if (error) return <p>{error}</p>;

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

      {/* ================= GRAFICAS ================= */}
      <h3 style={{ marginTop: "40px" }}>Ingresos por Curso</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={cursosConVentas}>
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="ingreso_total" fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: "40px" }}>Ventas por Curso</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={cursosConVentas}>
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="cantidad_total" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>

      {/* ================= ÁRBOL DE DECISIÓN ================= */}
      <h2 style={{ marginTop: "60px" }}>Árbol de Decisión</h2>
      <p><strong>Accuracy:</strong> {data.accuracy}</p>

      <div style={{ width: "100%", height: "400px", border: "1px solid #ddd", marginTop: "20px" }}>
        <Tree data={data.arbol} orientation="vertical" />
      </div>

      <h3>Ejemplo de Predicciones</h3>
      <table className="ventas-table">
        <thead>
          <tr>
            <th>Features</th>
            <th>Label</th>
            <th>Prediction</th>
          </tr>
        </thead>
        <tbody>
          {data.ejemplo_predicciones.map((p, i) => (
            <tr key={i}>
              <td>{p.features_str}</td>
              <td>{p.label}</td>
              <td>{p.prediction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ventas;
