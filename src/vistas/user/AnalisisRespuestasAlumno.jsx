import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaChartLine,
  FaBrain,
  FaChartBar,
  FaTrophy
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList
} from "recharts";
import "../styles/EstilosAlumno.css";
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

      <h2>
        <FaChartLine /> Análisis de tu Progreso Académico
      </h2>

      {/* PREDICCIÓN */}
      <div className="prediccion-box">
        <h3>
          <FaBrain /> Predicción de Rendimiento
        </h3>
        <p><strong>Promedio actual:</strong> {data.promedio_actual}</p>
        <p><strong>Nivel actual:</strong> {data.nivel_actual}</p>
        <p><strong>Predicción futura:</strong> {data.prediccion_calificacion}</p>
        <p><strong>Nivel futuro:</strong> {data.nivel_futuro}</p>
      </div>

      {/*  GRÁFICA */}
      <div className="chart-card progreso-chart-card">
        <h3 className="chart-title">
          <FaChartBar className="chart-icon" />
          Evolución de Calificaciones por Examen
        </h3>
        <p className="chart-description">
          <FaTrophy /> Seguimiento detallado de tu rendimiento académico a lo largo de los exámenes realizados
        </p>
        <div className="grafica-container">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="intento" 
                stroke="#666"
                label={{ value: 'Número de Examen', position: 'insideBottom', offset: -5, style: { fontSize: '12px' } }}
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <YAxis 
                stroke="#666"
                domain={[0, 100]}
                label={{ value: 'Calificación (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  padding: '12px'
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                itemStyle={{ color: '#8884d8' }}
                formatter={(value) => [`${value.toFixed(1)}%`, 'Calificación']}
                labelFormatter={(label) => `Examen ${label}`}
                cursor={{ stroke: '#8884d8', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="calificacion" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ 
                  fill: '#8884d8', 
                  r: 8, 
                  strokeWidth: 3, 
                  stroke: '#fff',
                  style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }
                }}
                activeDot={{ 
                  r: 10, 
                  fill: '#8884d8', 
                  stroke: '#fff', 
                  strokeWidth: 4,
                  style: { filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))' }
                }}
                animationDuration={1500}
                animationEasing="ease-in-out"
                label={{
                  position: 'top',
                  fill: '#667eea',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  formatter: (value) => `${value.toFixed(0)}%`
                }}
              >
                <LabelList 
                  dataKey="calificacion" 
                  position="top" 
                  fill="#667eea"
                  fontSize="12px"
                  fontWeight="bold"
                  formatter={(value) => `${value.toFixed(0)}%`}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

export default AnalisisRespuestasAlumno;
