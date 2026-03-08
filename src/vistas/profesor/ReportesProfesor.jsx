import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Legend
} from "recharts";

function ReportesProfesor() {

  const [reportes, setReportes] = useState([]);
  const [promedios, setPromedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    let activo = true;
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Sesión expirada. Inicia sesión.");
      setLoading(false);
      return;
    }

    /* REPORTES */

    axios.get("http://127.0.0.1:5000/api/reportes/profesor", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log("REPORTES:", res.data);
        if (activo) setReportes(res.data || []);
      })
      .catch(err => {
        console.error(err);
        if (activo) setError("Error cargando reportes");
      });

    /* PROMEDIOS */

    axios.get("http://127.0.0.1:5000/api/promedio-examen-profesor", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {

        console.log("PROMEDIOS RAW:", res.data);

        const data = (res.data || []).map(p => ({
          titulo: p.titulo || "Examen",
          promedio: Number(p.promedio) || 0
        }));

        console.log("PROMEDIOS LIMPIOS:", data);

        if (activo) setPromedios(data);

      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => { activo = false };

  }, []);

  /* AGRUPAR REPORTES POR CURSO */

  const reportesPorCurso = reportes.reduce((acc, r) => {

    const curso = r.curso || "Sin curso";

    if (!acc[curso]) {
      acc[curso] = [];
    }

    acc[curso].push(r);

    return acc;

  }, {});

  return (

    <div className="container mt-4">

      <h2 className="mb-4">Reportes de Resultados</h2>

      {loading && <p>Cargando reportes...</p>}

      {!loading && error && <p className="text-danger">{error}</p>}

      {!loading && reportes.length === 0 && (
        <p>No hay resultados registrados aún.</p>
      )}

      {/* TABLAS */}

      {Object.keys(reportesPorCurso).map((curso) => (

        <div key={curso} className="mb-5">

          <h3 className="mt-4">{curso}</h3>

          <div className="table-responsive">

            <table className="table table-dark table-striped shadow">

              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Email</th>
                  <th>Examen</th>
                  <th>Correctas</th>
                  <th>Total</th>
                  <th>Calificación</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>

                {reportesPorCurso[curso].map((r, i) => (

                  <tr key={i}>
                    <td>{r.alumno}</td>
                    <td>{r.email}</td>
                    <td>{r.examen}</td>
                    <td>{r.correctas}</td>
                    <td>{r.total}</td>
                    <td><strong>{r.calificacion}%</strong></td>
                    <td>{r.fecha}</td>
                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      ))}

      <h2 className="mt-5 mb-4">Promedios por Examen</h2>

      {/* GRAFICA GENERAL */}

      <div
        style={{
          background: "#1e1e2f",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "40px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
        }}
      >

        <ResponsiveContainer width="100%" height={400}>

          <BarChart
            data={promedios}
            margin={{ top: 20, right: 30, left: 0, bottom: 80 }}
          >

            <CartesianGrid strokeDasharray="3 3" stroke="#444" />

            <XAxis
              dataKey="titulo"
              stroke="#ccc"
              angle={-20}
              textAnchor="end"
              interval={0}
            />

            <YAxis
              stroke="#ccc"
              domain={[0, 100]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#2a2a40",
                border: "none",
                borderRadius: "8px"
              }}
              labelStyle={{ color: "#fff" }}
            />

            <Legend />

            <Bar
              dataKey="promedio"
              fill="#4f9cff"
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            >

              <LabelList
                dataKey="promedio"
                position="top"
                fill="#ffffff"
              />

            </Bar>

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>

  );
}

export default ReportesProfesor;