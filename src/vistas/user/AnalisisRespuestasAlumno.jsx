import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/analisisrespuesta.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function AnalisisRespuestasAlumno() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ================= USUARIO =================
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) setUser(JSON.parse(usuarioGuardado));
  }, []);

  // ================= API =================
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");

    axios.get(`http://127.0.0.1:5000/api/respuestas/analisis/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const apiData = res.data;
        setData(apiData);

        //  PREPARAR DATOS PARA GRÁFICA
        const formatted = apiData.historial.map((item, index) => ({
          intento: index + 1,
          calificacion: item.calificacion
        }));

        setChartData(formatted);
      })
      .catch(err => {
        console.error(err);
        setError("No se pudo cargar el análisis");
      })
      .finally(() => setLoading(false));

  }, [user]);

  // ================= ESTADOS =================
  if (loading) return <p>Cargando análisis...</p>;
  if (error) return <p>{error}</p>;
  if (!data || !data.historial) return <p>No hay datos</p>;

  return (
    <div className="analisis-container">

      <h2>Análisis de tu progreso</h2>

      {/* 🔮 PREDICCIÓN */}
      <div className="prediccion-box">
        <h3>Predicción</h3>
        <p><strong>Promedio actual:</strong> {data.promedio_actual}</p>
        <p><strong>Nivel actual:</strong> {data.nivel_actual}</p>
        <p><strong>Predicción futura:</strong> {data.prediccion_calificacion}</p>
        <p><strong>Nivel futuro:</strong> {data.nivel_futuro}</p>
      </div>

      {/* 📈 GRÁFICA */}
      <h3>Progreso del alumno</h3>
      <div className="grafica-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="intento" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="calificacion" stroke="#8884d8" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default AnalisisRespuestasAlumno;
