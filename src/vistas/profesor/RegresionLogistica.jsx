import React, { useState, useEffect } from 'react';
import './RegresionLogistica.css';

const RegresionLogistica = () => {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/analisis/regresion-logistica', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }
      
      const data = await response.json();
      setDatos(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando análisis de regresión logística...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!datos || datos.error) {
    return <div className="info">{datos?.error || 'No hay datos disponibles'}</div>;
  }

  const { accuracy, precision, recall, f1_score, matriz_confusion, coeficientes, intercepto, resumen } = datos;

  return (
    <div className="regresion-logistica">
      <h2>Análisis de Regresión Logística - Cursos</h2>
      
      {/* Métricas Principales */}
      <div className="metricas-grid">
        <div className="metrica-card">
          <h3>Precisión del Modelo</h3>
          <p className="valor">{(accuracy * 100).toFixed(1)}%</p>
          <span className="descripcion">Porcentaje de predicciones correctas</span>
        </div>
        
        <div className="metrica-card">
          <h3>Identificación de Éxitos</h3>
          <p className="valor">{(precision * 100).toFixed(1)}%</p>
          <span className="descripcion">Cursos exitosos detectados correctamente</span>
        </div>
        
        <div className="metrica-card">
          <h3>Cobertura de Éxitos</h3>
          <p className="valor">{(recall * 100).toFixed(1)}%</p>
          <span className="descripcion">Cursos exitosos encontrados</span>
        </div>
        
        <div className="metrica-card">
          <h3>Balance del Modelo</h3>
          <p className="valor">{f1_score.toFixed(2)}</p>
          <span className="descripcion">Equilibrio entre precisión y cobertura</span>
        </div>
      </div>

      {/* Matriz de Confusión */}
      <div className="matriz-confusion">
        <h3>Resultados de Predicción</h3>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Predice que será EXITOSO</th>
              <th>Predice que NO será exitoso</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Realmente EXITOSO</strong></td>
              <td className="tp">
                <strong>Correctos: {matriz_confusion.TP}</strong>
                <br />
                <small>Aciertos del modelo</small>
              </td>
              <td className="fn">
                <strong>Omitidos: {matriz_confusion.FN}</strong>
                <br />
                <small>Cursos exitosos no detectados</small>
              </td>
            </tr>
            <tr>
              <td><strong>Realmente NO exitoso</strong></td>
              <td className="fp">
                <strong>Falsos: {matriz_confusion.FP}</strong>
                <br />
                <small>Cursos marcados erróneamente</small>
              </td>
              <td className="tn">
                <strong>Correctos: {matriz_confusion.TN}</strong>
                <br />
                <small>Identificados correctamente</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Fórmulas */}
      <div className="formulas">
        <h4>Cómo se calculan las métricas</h4>
        <div className="formula">
          <strong>Precisión General</strong> = (Correctos / Total de cursos) = {(matriz_confusion.TP + matriz_confusion.TN) / (matriz_confusion.TP + matriz_confusion.TN + matriz_confusion.FP + matriz_confusion.FN) * 100}%
        </div>
        <div className="formula">
          <strong>Identificación de Éxitos</strong> = Correctos / (Correctos + Falsos) = {matriz_confusion.TP} / ({matriz_confusion.TP} + {matriz_confusion.FP}) = {(precision * 100).toFixed(1)}%
        </div>
        <div className="formula">
          <strong>Cobertura</strong> = Correctos / (Correctos + Omitidos) = {matriz_confusion.TP} / ({matriz_confusion.TP} + {matriz_confusion.FN}) = {(recall * 100).toFixed(1)}%
        </div>
        <div className="formula">
          <strong>Balance General</strong> = 2 × (Identificación × Cobertura) / (Identificación + Cobertura) = {f1_score.toFixed(4)}
        </div>
      </div>

      {/* Coeficientes del Modelo */}
      <div className="coeficientes">
        <h3>Factores que Influyen en el Éxito</h3>
        <p><strong>Punto de partida del modelo:</strong> {intercepto.toFixed(4)}</p>
        <ul>
          <li><strong>Precio Promedio:</strong> {coeficientes[0]?.toFixed(4) || 'N/A'}</li>
          <li><strong>Cantidad de Ventas:</strong> {coeficientes[1]?.toFixed(4) || 'N/A'}</li>
          <li><strong>Ingreso Total:</strong> {coeficientes[2]?.toFixed(4) || 'N/A'}</li>
        </ul>
        <p className="explicacion">
          Valores positivos: aumentan la probabilidad de éxito. Valores negativos: disminuyen la probabilidad de éxito.
        </p>
      </div>

      {/* Resumen de Cursos */}
      <div className="resumen-cursos">
        <h3>Clasificación de Tus Cursos</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre del Curso</th>
              <th>Ingreso Total</th>
              <th>Ventas</th>
              <th>Precio Promedio</th>
              <th>Tipo de Curso</th>
            </tr>
          </thead>
          <tbody>
            {resumen.map((curso, index) => (
              <tr key={index}>
                <td>{curso.nombre}</td>
                <td>${curso.ingreso_total.toFixed(2)}</td>
                <td>{curso.cantidad_total}</td>
                <td>${curso.precio_promedio.toFixed(2)}</td>
                <td>
                  <span className={`badge ${curso.clasificacion.includes('Estrella') ? 'estrella' : curso.clasificacion.includes('Alta Rotación') ? 'rotacion' : 'secundario'}`}>
                    {curso.clasificacion.includes('Estrella') ? 'Curso Estrella' : curso.clasificacion.includes('Alta Rotación') ? 'Alta Rotación' : 'Secundario'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={cargarDatos} className="btn-actualizar">
        Actualizar Análisis
      </button>
    </div>
  );
};

export default RegresionLogistica;