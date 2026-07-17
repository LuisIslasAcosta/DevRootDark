import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import {
  FaSignOutAlt,
  FaPalette,
  FaHome,
  FaBookOpen,
  FaCog,
  FaClipboardList,
  FaChartBar,
  FaGraduationCap,
  FaUsers,
  FaChartLine,
  FaClock,
  FaFileAlt,
  FaLightbulb,
  FaBullseye,
  FaBook,
  FaRedo,
  FaStar,
  FaMapMarkerAlt,
  FaSearch,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";

import "../styles/ProfesorPanel.css";
import "../../temas/temas.css";
import RegresionLogistica from "./RegresionLogistica";

function ProfesorPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // USER
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });

  // THEME
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [showCustomizer, setShowCustomizer] = useState(false);

  // DATA
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // KMEANS
  const [kmeansData, setKmeansData] = useState(null);
  const [loadingKmeans, setLoadingKmeans] = useState(false);
  const [errorKmeans, setErrorKmeans] = useState(null);

  // MÉTODO DEL CODO
  const [codoData, setCodoData] = useState(null);
  const [loadingCodo, setLoadingCodo] = useState(false);
  const [errorCodo, setErrorCodo] = useState(null);

  // SEGMENTACIÓN ALUMNOS (K-Means + Random Forest)
  const [segmentacionData, setSegmentacionData] = useState(null);
  const [loadingSegmentacion, setLoadingSegmentacion] = useState(false);
  const [errorSegmentacion, setErrorSegmentacion] = useState(null);

  // REGRESIÓN LOGÍSTICA
  const [showRegresionLogistica, setShowRegresionLogistica] = useState(false);

  // SYNC USER
  useEffect(() => {
    const syncUser = () => {
      const updated = localStorage.getItem("usuario");
      if (updated) setUser(JSON.parse(updated));
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  // APPLY THEME
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const vars = [
      "--bg-color",
      "--text-color",
      "--card-bg",
      "--link-color",
      "--card-border",
      "--link-hover"
    ];
    vars.forEach(v => {
      document.documentElement.style.removeProperty(v);
      localStorage.removeItem(v);
    });
  };

  const handleCustomTheme = (e) => {
    const { name, value } = e.target;
    document.documentElement.style.setProperty(name, value);
    localStorage.setItem(name, value);
  };

  useEffect(() => {
    const vars = [
      "--bg-color",
      "--text-color",
      "--card-bg",
      "--link-color",
      "--card-border",
      "--link-hover"
    ];
    vars.forEach(v => {
      const saved = localStorage.getItem(v);
      if (saved) document.documentElement.style.setProperty(v, saved);
    });
  }, []);

  // LOAD COURSES
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    setLoading(true);
    
    // Timeout de 5 segundos
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ data: [] }), 5000);
    });
    
    Promise.race([
      axios.get("http://127.0.0.1:5000/api/mis_cursos", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      timeoutPromise
    ])
      .then(res => setCursos(res.data || []))
      .catch(err => {
        console.error("Error cursos:", err);
        if (err.response?.status === 401) navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // LOAD MÉTODO DEL CODO
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Solo cargar si hay cursos
    if (cursos.length === 0) {
      setLoadingCodo(false);
      return;
    }

    setLoadingCodo(true);
    axios.get("http://localhost:5000/api/kmeans/metodo-codo", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setCodoData(res.data))
      .catch(err => {
        console.error("Error Método del Codo:", err);
        setErrorCodo("No se pudo cargar el método del codo");
      })
      .finally(() => setLoadingCodo(false));
  }, [cursos]);

  // LOAD KMEANS
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Solo cargar si hay cursos
    if (cursos.length === 0) {
      setLoadingKmeans(false);
      return;
    }

    setLoadingKmeans(true);
    axios.get("http://localhost:5000/api/kmeans", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setKmeansData(res.data))
      .catch(err => {
        console.error("Error KMeans:", err);
        setErrorKmeans("No se pudo cargar KMeans");
      })
      .finally(() => setLoadingKmeans(false));
  }, [cursos]);

  // LOAD SEGMENTACIÓN ALUMNOS
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Solo cargar si hay cursos
    if (cursos.length === 0) {
      setLoadingSegmentacion(false);
      return;
    }

    setLoadingSegmentacion(true);
    axios.get("http://localhost:5000/api/segmentacion/alumnos", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSegmentacionData(res.data))
      .catch(err => {
        console.error("Error Segmentación:", err);
        setErrorSegmentacion("No se pudo cargar la segmentación de alumnos");
      })
      .finally(() => setLoadingSegmentacion(false));
  }, [cursos]);

  // LOGOUT
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Helper para convertir nombres técnicos a amigables
  const getFeatureLabel = (feature) => {
    const labels = {
      "Promedio": <><FaChartLine /> Calificación Promedio</>,
      "Num Intentos": <><FaRedo /> Total de Intentos</>,
      "Exámenes Completados": <><FaFileAlt /> Exámenes Realizados</>,
      "Días Inactivo": <><FaClock /> Días sin Actividad</>,
      "Intentos por Examen": <><FaBullseye /> Persistencia</>,
      "Desviación Calificaciones": <><FaStar /> Estabilidad en Notas</>
    };
    return labels[feature] || feature;
  };

  // Helper para interpretar el Silhouette Score
  const getSilhouetteDescription = (score) => {
    if (score >= 0.7) return "Excelente separación entre grupos";
    if (score >= 0.5) return "Buena separación entre grupos";
    if (score >= 0.3) return "Separación moderada";
    return "Separación débil - revisar datos";
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile">
          <img
            src={
              user?.foto_perfil
                ? (user.foto_perfil.startsWith("data:image")
                  ? user.foto_perfil
                  : `data:image/png;base64,${user.foto_perfil}`)
                : "/default-avatar.png"
            }
            alt="Perfil"
            className="profile-pic"
          />
          <h5>{user?.nombre || "Profesor"}</h5>
          <button 
            onClick={() => navigate("/profesor/editar-perfil")}
            className="theme-btn icon-btn"
            title="Editar perfil"
          >
            <FaCog />
          </button>
        </div>

        <h4 className="sidebar-brand">Panel del Profesor</h4>

        <nav className="sidebar-nav">
          <button 
            className={location.pathname === "/profesor" ? "active" : ""}
            onClick={() => navigate("/profesor")}
          >
            <FaHome /> Inicio
          </button>
          <button className={location.pathname.includes("/profesor/cursos") ? "active" : ""} onClick={() => navigate("/profesor/cursos")}><FaBookOpen /> Cursos</button>
          <button className={location.pathname.includes("/profesor/reportes") ? "active" : ""} onClick={() => navigate("/profesor/reportes")}><FaClipboardList /> Reportes</button>
          <button className={location.pathname.includes("/profesor/ventas") ? "active" : ""} onClick={() => navigate("/profesor/ventas")}> <FaChartBar /> Ventas</button>
          <button 
            className={showRegresionLogistica ? "active" : ""}
            onClick={() => setShowRegresionLogistica(!showRegresionLogistica)}
          >
            Regresión Logística
          </button>
        </nav>

        <div className="sidebar-profile">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Salir
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        {/* TOPBAR */}
        <div className="dashboard-topbar">
          <div>
            <h2>Bienvenido, {user?.nombre || "Profesor"}</h2>
            <p>Administra tus cursos, alumnos, exámenes y lecciones</p>
          </div>

          <div className="tema-dropdown">
            <button onClick={() => setShowCustomizer(!showCustomizer)}>
              <FaPalette />
            </button>
            {showCustomizer && (
              <div className="tema-menu">
                <h4>Seleccionar tema</h4>
                <button onClick={() => changeTheme("light")}>Claro</button>
                <button onClick={() => changeTheme("dark")}>Oscuro</button>
                <button onClick={() => changeTheme("blue")}>Azul</button>
                <button onClick={() => changeTheme("green")}>Verde</button>

                <h4>Personalizar</h4>
                <label>Fondo <input type="color" name="--bg-color" onChange={handleCustomTheme} /></label>
                <label>Texto <input type="color" name="--text-color" onChange={handleCustomTheme} /></label>
                <label>Tarjeta <input type="color" name="--card-bg" onChange={handleCustomTheme} /></label>
                <label>Borde <input type="color" name="--card-border" onChange={handleCustomTheme} /></label>
                <label>Enlaces <input type="color" name="--link-color" onChange={handleCustomTheme} /></label>
                <label>Hover <input type="color" name="--link-hover" onChange={handleCustomTheme} /></label>
              </div>
            )}
          </div>
        </div>

        {/* DASHBOARD HOME */}
        {location.pathname === "/profesor" && (
          <>
            <h3 className="section-title">Mis cursos</h3>
            <div className="dashboard-grid">
              {loading ? (
                <p className="empty-text">Cargando cursos...</p>
              ) : cursos.length === 0 ? (
                <p className="empty-text">No hay cursos disponibles</p>
              ) : (
                cursos.map(curso => {
                  const cursoId = curso.id || curso._id;
                  return (
                    <div key={cursoId} className="dashboard-card">
                      <h4>{curso.nombre}</h4>
                      <div className="curso-actions">
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/editar`)}>
                          Editar curso
                        </button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/alumnos`)}>
                          Ver alumnos
                        </button>
                        <button onClick={() => navigate(`/profesor/cursos/${cursoId}/examenes`)}>
                          Ver exámenes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* KMEANS CHART */}
            {cursos.length > 0 && (
              <>
                <h3 className="section-title">Análisis de Grupos de Cursos</h3>
                {loadingKmeans && <p>Cargando análisis...</p>}
                {errorKmeans && <p>{errorKmeans}</p>}
                {kmeansData && kmeansData.distribucion && (
                  <div className="kmeans-grid">
                    
                    {/* CHART */}
                    <div className="kmeans-chart">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={kmeansData.distribucion}>
                          <XAxis dataKey="cluster" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>

                      <div className="silhouette-box">
                        Calidad de Agrupamiento: {kmeansData.silhouette}
                      </div>
                      
                      {/* WCSS y Distancia Euclidiana */}
                      <div className="wcss-section">
                        <h4><FaChartLine /> Métricas de Calidad del Modelo</h4>
                        <div className="wcss-metrics">
                          <div className="wcss-card">
                            <h5>WCSS (Suma de Cuadrados)</h5>
                            <p className="metric-value">{kmeansData.wcss?.toFixed(2) || 'N/A'}</p>
                            <p className="metric-description">
                              Suma de distancias al cuadrado de cada curso a su centroide
                            </p>
                          </div>
                          
                          {kmeansData.distancias_por_cluster && (
                            <div className="distancias-card">
                              <h5>Distancia Promedio por Grupo</h5>
                              {Object.entries(kmeansData.distancias_por_cluster).map(([cluster, distancia]) => (
                                <div key={cluster} className="distancia-item">
                                  <span className={`cluster-badge cluster-${cluster}`}>
                                    Grupo {cluster}
                                  </span>
                                  <span className="distancia-value">{distancia}</span>
                                </div>
                              ))}
                              <p className="metric-description">
                                Distancia euclidiana promedio de cada grupo a su centroide
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TABLE */}
                    <div className="kmeans-table">
                      <h4><FaUsers /> Grupos Identificados</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Grupo</th>
                            <th>Cantidad de Cursos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kmeansData.distribucion.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <span className={`cluster-badge cluster-${item.cluster}`}>
                                  Grupo {item.cluster}
                                </span>
                              </td>
                              <td>{item.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* CENTROIDES */}
                    {kmeansData.centroides && kmeansData.centroides.length > 0 && (
                      <div className="centroides-section">
                        <h4><FaMapMarkerAlt /> Características de Cada Grupo</h4>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                          Estos son los valores promedio que definen a cada grupo:
                        </p>
                        <div className="centroides-grid">
                          {kmeansData.centroides.map((centroide, index) => (
                            <div key={index} className={`centroide-card cluster-${index}`}>
                              <h5>Grupo {index}</h5>
                              <div className="centroide-values">
                                <p><FaChartLine /> <strong>Calificación Promedio:</strong> {centroide[0]?.toFixed(2) || 'N/A'}</p>
                                <p><FaRedo /> <strong>Total Intentos:</strong> {centroide[1]?.toFixed(2) || 'N/A'}</p>
                                <p><FaFileAlt /> <strong>Exámenes Realizados:</strong> {centroide[2]?.toFixed(2) || 'N/A'}</p>
                                <p><FaClock /> <strong>Días sin Actividad:</strong> {centroide[3]?.toFixed(2) || 'N/A'}</p>
                                <p><FaBullseye /> <strong>Persistencia:</strong> {centroide[4]?.toFixed(2) || 'N/A'}</p>
                                <p><FaStar /> <strong>Estabilidad:</strong> {centroide[5]?.toFixed(2) || 'N/A'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                 {/* ANÁLISIS DE AGRUPAMIENTO */}
                 {codoData && codoData.k_values && (
                   <div className="codo-section">
                     <h3 className="section-title"><FaChartLine /> ¿Cuántos grupos diferentes hay en mis datos?</h3>
                     {loadingCodo && <p>Cargando análisis...</p>}
                     {errorCodo && <p className="error-text">{errorCodo}</p>}
                     
                     <div className="codo-container">
                       {/* Gráfico */}
                        <div className="codo-chart">
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={codoData.k_values.map((k, i) => ({
                              k: k,
                              calidad: codoData.silhouette_scores[i] || 0
                            }))}>
                              <XAxis dataKey="k" label={{ value: 'Número de Grupos', position: 'insideBottom', offset: -10 }} />
                              <YAxis label={{ value: 'Calidad del Agrupamiento', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
                              <Tooltip 
                                formatter={(value) => [`${(value * 100).toFixed(0)}%`, 'Calidad']}
                                labelFormatter={(label) => `${label} grupos`}
                              />
                              <Line type="monotone" dataKey="calidad" stroke="#8884d8" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                       {/* Resultado */}
                       <div className="codo-result">
                         <div className="codo-info-card">
                           <h4><FaBullseye /> Número Ideal de Grupos</h4>
                           <div className="k-optimo-value">{codoData.k_optimo}</div>
                           <p className="codo-description">
                             Tus datos se organizan naturalmente en <strong>{codoData.k_optimo} grupos diferentes</strong>
                           </p>
                           <p style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
                             <FaStar /> Calidad del agrupamiento: {(codoData.max_silhouette * 100).toFixed(0)}%
                           </p>
                         </div>
                         
                         <div className="codo-details">
                           <h4><FaBook /> ¿Qué significa esto?</h4>
                           <p><FaUsers /> <strong>Datos analizados:</strong> {codoData.total_registros} registros</p>
                           <p><FaSearch /> <strong>Grupos evaluados:</strong> De 2 a 10 grupos posibles</p>
                           <p><FaCheckCircle /> <strong>Resultado:</strong> Se encontraron {codoData.k_optimo} grupos distintos</p>
                           <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                             <em><FaInfoCircle /> Una calidad del 100% significa que los grupos están muy bien definidos y separados entre sí.</em>
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* SEGMENTACIÓN ALUMNOS */}
                {segmentacionData && (
                  <>
                    <h3 className="section-title"><FaGraduationCap /> Análisis de Alumnos</h3>
                    {loadingSegmentacion && <p>Cargando análisis de alumnos...</p>}
                    {errorSegmentacion && <p className="error-text">{errorSegmentacion}</p>}

                    {/* MÉTRICAS PRINCIPALES */}
                    <div className="segmentacion-metrics">
                      <div className="metric-card">
                        <h4><FaUsers /> Total de Alumnos</h4>
                        <p className="metric-value">{segmentacionData.total_alumnos}</p>
                      </div>
                      <div className="metric-card">
                        <h4><FaChartLine /> Porcentaje de Aciertos</h4>
                        <p className="metric-value">{(segmentacionData.accuracy * 100).toFixed(0)}%</p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Exactitud general del modelo</p>
                      </div>
                      <div className="metric-card">
                        <h4><FaBullseye /> Porcentaje de Precisión</h4>
                        <p className="metric-value">{(segmentacionData.precision * 100).toFixed(0)}%</p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>De los alumnos clasificados, cuántos son correctos</p>
                      </div>
                      <div className="metric-card">
                        <h4><FaStar /> Porcentaje de Detección</h4>
                        <p className="metric-value">{(segmentacionData.recall * 100).toFixed(0)}%</p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>De todos los alumnos reales, cuántos detectó</p>
                      </div>
                      <div className="metric-card">
                        <h4><FaChartBar /> Calidad de Separación</h4>
                        <p className="metric-value">{(segmentacionData.silhouette_score * 100).toFixed(0)}%</p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          {getSilhouetteDescription(segmentacionData.silhouette_score)}
                        </p>
                      </div>
                    </div>

                    {/* INTERPRETACIÓN DE CLUSTERS - SOLO RIESGO Y DESTACADOS */}
                    

                    {/* LISTA DE ALUMNOS POR GRUPO */}
                    <div className="alumnos-por-grupo">
                      <h3 className="section-title"><FaUsers /> Alumnos por Grupo</h3>
                      
                      {/* ALUMNOS EN RIESGO DE ABANDONO */}
                      {(() => {
                        const alumnosRiesgo = segmentacionData.alumnos
                          .filter(a => a.tipo_alumno === "Estudiantes en Riesgo de Abandono")
                          .sort((a, b) => a.promedio - b.promedio)
                          .slice(0, 6);

                        return (
                          <div className="grupo-alumnos-section">
                            <h4><FaBook /> Estudiantes en Riesgo de Abandono del Curso</h4>
                            <div className="alumnos-lista-individual">
                              {alumnosRiesgo.map((alumno, idx) => (
                                <div key={alumno.alumno_id || idx} className="alumno-card-riesgo">
                                  <div className="alumno-individual-header">
                                    <span className="alumno-nombre-individual">{alumno.nombre}</span>
                                    <span className="alumno-promedio-individual">{alumno.promedio}%</span>
                                  </div>
                                  <div className="alumno-individual-body">
                                    <p><FaFileAlt /> {alumno.examenes_completados} exámenes</p>
                                    <p><FaClock /> {alumno.dias_inactivo} días inactivo</p>
                                  </div>
                                  <div className="alumno-individual-tip">
                                    <FaLightbulb /> {alumno.promedio < 60 ? "Requiere atención personalizada" : "Necesita mejorar"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ALUMNOS DESTACADOS */}
                      {(() => {
                        const alumnosDestacados = segmentacionData.alumnos
                          .filter(a => a.tipo_alumno === "Estudiantes Destacados")
                          .sort((a, b) => b.promedio - a.promedio)
                          .slice(0, 6);

                        return (
                          <div className="grupo-alumnos-section">
                            <h4><FaGraduationCap /> Estudiantes en Excelencia</h4>
                            <div className="alumnos-lista-individual">
                              {alumnosDestacados.map((alumno, idx) => (
                                <div key={alumno.alumno_id || idx} className="alumno-card-destacado">
                                  <div className="alumno-individual-header">
                                    <span className="alumno-nombre-individual">{alumno.nombre}</span>
                                    <span className="alumno-promedio-individual">{alumno.promedio}%</span>
                                  </div>
                                  <div className="alumno-individual-body">
                                    <p><FaFileAlt /> {alumno.examenes_completados} exámenes</p>
                                    <p><FaClock /> {alumno.dias_inactivo} días inactivo</p>
                                  </div>
                                  <div className="alumno-individual-tip">
                                    <FaLightbulb /> {alumno.promedio >= 80 ? "¡Excelente! Puede ayudar a otros compañeros" : "Buen trabajo, siga practicando"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* FACTORES IMPORTANTES */}
                    {segmentacionData.importancia_caracteristicas && (
                      <div className="feature-importance">
                        <h4><FaBullseye /> ¿Qué factores influyen más en el rendimiento?</h4>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                          Estos son los aspectos que más afectan el desempeño de tus alumnos:
                        </p>
                        <div className="importance-bars">
                          {Object.entries(segmentacionData.importancia_caracteristicas)
                            .sort((a, b) => b[1] - a[1])
                            .map(([feature, value]) => (
                            <div key={feature} className="importance-item">
                              <label>{getFeatureLabel(feature)}</label>
                              <div className="importance-bar-bg">
                                <div 
                                  className="importance-bar-fill" 
                                  style={{ width: `${value * 100}%` }}
                                ></div>
                              </div>
                              <span>{(value * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VISUALIZACIÓN PCA 2D */}
                    {segmentacionData.alumnos.some(alumno => alumno.pca_x !== undefined && alumno.pca_y !== undefined) && (
                      <div className="pca-visualization">
                        <h4><FaMapMarkerAlt /> Mapa de Alumnos - Vista Rápida</h4>
                        <p className="pca-description">
                          Cada punto representa un alumno. Los puntos cercanos tienen características similares.
                        </p>
                        <div className="pca-chart">
                          <ResponsiveContainer width="100%" height={400}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <XAxis 
                                type="number" 
                                dataKey="pca_x" 
                                name="Características" 
                                label={{ value: 'Características de Aprendizaje', position: 'insideBottom', offset: -10 }}
                              />
                              <YAxis 
                                type="number" 
                                dataKey="pca_y" 
                                name="Comportamiento"
                                label={{ value: 'Patrón de Comportamiento', angle: -90, position: 'insideLeft' }}
                              />
                              <ZAxis type="number" dataKey="cluster" range={[60, 60]} />
                              <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="custom-tooltip">
                                        <p><strong>{data.nombre}</strong></p>
                                        <p><FaChartLine /> Grupo: {data.tipo_alumno}</p>
                                        <p><FaStar /> Promedio: {data.promedio}%</p>
                                        <p><FaFileAlt /> Exámenes: {data.examenes_completados}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Scatter 
                                name="Alumnos" 
                                data={segmentacionData.alumnos} 
                                fill="#8884d8"
                              >
                                {segmentacionData.alumnos.map((entry, index) => (
                                  <Scatter 
                                    key={index} 
                                    dataKey="cluster" 
                                    fill={entry.cluster === 0 ? "#8884d8" : "#82ca9d"}
                                  />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="pca-legend">
                          <div className="legend-item">
                            <span className="legend-color cluster-0"></span>
                            <span><FaGraduationCap /> Grupo 1: Estudiantes Destacados</span>
                          </div>
                          <div className="legend-item">
                            <span className="legend-color cluster-1"></span>
                            <span><FaBook /> Grupo 2: Estudiantes en Desarrollo</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* REGRESIÓN LOGÍSTICA */}
                {showRegresionLogistica && (
                  <RegresionLogistica />
                )}
              </>
            )}
          </>
        )}

        <Outlet />
      </main>
    </div>
  );
}

export default ProfesorPanel;