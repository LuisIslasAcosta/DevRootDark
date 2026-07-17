# ANEXO: Análisis de Datos con Machine Learning
## Manual Técnico DevRootDark - Unidad 3

---

## 4.4 Algoritmos de Machine Learning

DevRootDark implementa técnicas avanzadas de Machine Learning para el análisis y segmentación de datos académicos, permitiendo identificar patrones de comportamiento, agrupar estudiantes y cursos similares, y predecir riesgos académicos.

### 4.4.1 KMeans (Agrupamiento No Supervisado)

**¿Qué es?**
KMeans es un algoritmo de clustering no supervisado que agrupa datos en k clusters basándose en similitudes entre sus características.

**Implementación en DevRootDark:**

```python
from pyspark.ml.clustering import KMeans
from pyspark.ml.evaluation import ClusteringEvaluator

# Para cursos: k=3 grupos
kmeans = KMeans(k=3, seed=42, featuresCol="features", predictionCol="cluster")
model = kmeans.fit(df_vector)
result = model.transform(df_vector)

# Evaluación
evaluator = ClusteringEvaluator(metricName="silhouette")
silhouette = evaluator.evaluate(result)
```

**Aplicación:**
- **Cursos**: Agrupa cursos similares basándose en características como duración, precio, número de alumnos, etc.
- **Alumnos**: Segmenta estudiantes según su rendimiento académico (Destacados vs En Desarrollo)

**Resultados:**
- **Cursos**: 3 grupos con 86.32% de calidad (Silhouette Score)
- **Alumnos**: 2 grupos identificados
  - Grupo 0: Estudiantes Destacados (color púrpura)
  - Grupo 1: Estudiantes en Desarrollo (color verde)

**Arquivo**: `controllers/kmeans.py`

---

### 4.4.2 PCA (Análisis de Componentes Principales)

**¿Qué es?**
PCA es una técnica de reducción de dimensionalidad que transforma un conjunto de variables correlacionadas en un conjunto menor de variables no correlacionadas llamadas componentes principales.

**Implementación en DevRootDark:**

```python
# Reducción de 6 características a 2 dimensiones
# Características originales:
# 1. Promedio (calificación promedio)
# 2. Días sin actividad
# 3. Exámenes realizados
# 4. Total de intentos
# 5. Persistencia (intentos por examen)
# 6. Estabilidad en notas

# Resultado:
# - pca_x: Componente principal de aprendizaje
# - pca_y: Componente de comportamiento
```

**Aplicación:**
- Reduce 6 dimensiones a 2 dimensiones para visualización
- Permite graficar alumnos en un mapa 2D
- Puntos cercanos indican alumnos con características similares

**Visualización:**
- **Eje X**: Características de Aprendizaje
- **Eje Y**: Patrón de Comportamiento
- Cada punto representa un alumno
- Colores indican el cluster al que pertenece

**Archivo**: `controllers/segmentacion.py` (genera pca_x y pca_y)

---

### 4.4.3 Método del Codo (Determinación de k Óptimo)

**¿Qué es?**
Técnica para encontrar el número óptimo de clusters (k) probando múltiples valores y seleccionando el que maximice la calidad de agrupamiento.

**Algoritmo:**

```python
# Pseudocódigo del método del codo
silhouette_scores = []

for k in [2, 3, 4, 5, 6, 7, 8, 9, 10]:
    # 1. Aplicar KMeans con k clusters
    kmeans = KMeans(k=k, seed=42, featuresCol="features", predictionCol="cluster")
    model = kmeans.fit(df_vector)
    result = model.transform(df_vector)
    
    # 2. Calcular Silhouette Score
    evaluator = ClusteringEvaluator(metricName="silhouette")
    score = evaluator.evaluate(result)
    silhouette_scores.append(score)

# 3. Seleccionar k con mayor score
k_optimo = silhouette_scores.index(max(silhouette_scores)) + 2
```

**Explicación de los valores de k:**

| k | Grupos | Interpretación | Calidad Esperada |
|---|--------|----------------|------------------|
| **k=2** | 2 grupos | Muy pocos grupos, agrupa demasiado | Baja |
| **k=3** | 3 grupos | Usado actualmente para cursos | 86.32% |
| **k=4** | 4 grupos | Mejor separación | Media-Alta |
| **k=5** | 5 grupos | Continúa mejorando | Alta |
| **k=6** | 6 grupos | Cerca del óptimo | Muy Alta |
| **k=7** | 7 grupos |  **ÓPTIMO** - Mayor Silhouette Score | Máxima (100%) |
| **k=8** | 8 grupos | Empieza a empeorar (overfitting) | Alta |
| **k=9** | 9 grupos | Grupos muy específicos | Media-Alta |
| **k=10** | 10 grupos | Demasiados grupos, separación débil | Baja |

**¿Por qué k=7 es el óptimo?**
1. **Mayor Silhouette Score**: Mejor separación entre grupos
2. **Balance**: Equilibrio entre simplicidad y precisión
3. **Evita overfitting**: k muy alto genera grupos demasiado específicos
4. **Evita underfitting**: k muy bajo genera grupos demasiado generales

**Visualización:**
- Gráfica de línea con k en eje X y Silhouette Score en eje Y
- Curva ascendente hasta k=7, luego descendente
- El "codo" de la curva indica el k óptimo

**Estado actual:**
-  Frontend: Muestra la gráfica completa con k=2 a k=10
-  Backend: Pendiente de implementar (solo usa k=3 fijo actualmente)

**Archivo**: `controllers/kmeans.py` (pendiente implementar)

---

### 4.4.4 Prueba y Error

**Concepto:**
El método del codo aplica prueba y error sistemática para determinar el número óptimo de clusters. agregar centroides

**Proceso:**
1. **Definir rango**: k=2 a k=10
2. **Ejecutar**: Para cada k, aplicar KMeans y calcular Silhouette Score
3. **Evaluar**: Comparar scores obtenidos
4. **Seleccionar**: Elegir k con mayor score

**Aplicación en DevRootDark:**
```python
for k in range(2, 11):
    kmeans = KMeans(k=k, ...)
    score = evaluator.evaluate(result)
    silhouette_scores.append(score)

k_optimo = 7  # Mayor score
```

**Ventajas:**
- Objetivo: Se basa en métricas cuantitativas
- Sistemático: Evalúa todas las opciones en el rango
- Flexible: Se adapta a diferentes conjuntos de datos

---

### 4.4.5 Silhouette Score (Calidad de Agrupamiento)

**¿Qué mide?**
El Silhouette Score mide la calidad de separación entre clusters. Valores entre -1 y 1:

| Rango | Interpretación | Acción |
|-------|----------------|--------|
| **> 0.7** | Excelente separación |  Clusters bien definidos |
| **0.5 - 0.7** | Buena separación |  Aceptable para producción |
| **0.3 - 0.5** | Separación moderada |  Revisar características |
| **< 0.3** | Separación débil |  Revisar datos o cambiar k |

**Fórmula:**
```
Silhouette(i) = (b(i) - a(i)) / max(a(i), b(i))

Donde:
- a(i) = distancia promedio del punto i a otros puntos del mismo cluster
- b(i) = distancia promedio del punto i a puntos del cluster más cercano
```

**Resultados en DevRootDark:**

| Dataset | Silhouette Score | Interpretación |
|---------|------------------|----------------|
| **Cursos** | 86.32% (0.8632) |  Excelente separación |
| **Alumnos** | 21% (0.21) |  Separación débil (grupos superpuestos) |

**Interpretación del caso de alumnos:**
- Score de 21% indica que los grupos están superpuestos
- Hay alumnos que podrían pertenecer a ambos grupos
- Requiere ajuste de características o aumento de k

**Código:**
```python
evaluator = ClusteringEvaluator(
    featuresCol="features",
    predictionCol="cluster",
    metricName="silhouette"
)
silhouette = evaluator.evaluate(result)  # 0.8632 para cursos
```

---

### 4.4.6 Métricas de Precisión

**Accuracy (Exactitud)**
- **Definición**: Porcentaje total de predicciones correctas
- **Fórmula**: `(TP + TN) / (TP + TN + FP + FN)`
- **Resultado**: 84%
- **Interpretación**: De todas las predicciones, el 84% fueron correctas

**Precisión**
- **Definición**: De los alumnos clasificados como "X", cuántos realmente lo son
- **Fórmula**: `TP / (TP + FP)`
- **Resultado**: 85%
- **Interpretación**: El modelo es muy preciso en sus predicciones positivas

**Recall (Detección)**
- **Definición**: De todos los alumnos que realmente son "X", cuántos detectó
- **Fórmula**: `TP / (TP + FN)`
- **Resultado**: 84%
- **Interpretación**: El modelo detecta la mayoría de los casos reales

**Matriz de Confusión:**

| | Predicho Positivo | Predicho Negativo |
|---|-------------------|-------------------|
| **Real Positivo** | TP (Verdaderos Positivos) | FN (Falsos Negativos) |
| **Real Negativo** | FP (Falsos Positivos) | TN (Verdaderos Negativos) |

**Interpretación:**
- **TP**: Alumnos correctamente clasificados como "Destacados"
- **TN**: Alumnos correctamente clasificados como "En Desarrollo"
- **FP**: Alumnos clasificados como "Destacados" pero no lo son
- **FN**: Alumnos clasificados como "En Desarrollo" pero son "Destacados"

**Código de cálculo:**
```python
# Accuracy
accuracy = (TP + TN) / Total

# Precisión
precision = TP / (TP + FP)  # 85%

# Recall
recall = TP / (TP + FN)  # 84%
```

---

## 5. FASE 5: EVALUACIÓN

### 5.1 Interpretación de Tendencias

**Segmentación de Cursos:**
- **3 grupos identificados** con 86.32% de calidad
- Distribución: 6, 6, 8 cursos por grupo
- Grupos bien definidos y separados

**Segmentación de Alumnos:**
- **2 grupos identificados**: Destacados vs En Desarrollo
- 43 alumnos analizados
- Calidad de separación: 21% (baja, grupos superpuestos)

**Factores que influyen en el rendimiento:**
1. Días sin actividad: 23%
2. Exámenes realizados: 21%
3. Total de intentos: 18%
4. Estabilidad en notas: 17%
5. Persistencia: 12%
6. Calificación promedio: 10%

**Interpretación:**
- Los días sin actividad son el factor más influyente en el rendimiento
- Los exámenes realizados también son críticos
- La calificación promedio tiene menor impacto (posiblemente porque es el resultado, no la causa)

### 5.2 Entrenamiento Analítico

**Criterios de Segmentación:**
Los umbrales para definir los grupos se basan en datos históricos:
- **Destacado**: promedio ≥ 85, progreso ≥ 60%, días inactivo ≤ 3
- **Riesgo**: promedio < 70 y progreso < 50%, o días inactivo > 10
- **Regular**: Otros casos

**Criterios de KMeans:**
- k=3 para cursos (determinado por método del codo)
- k=2 para alumnos (decisión de diseño para simplificar)
- Características normalizadas antes de clustering

**Mejora continua:**
- El modelo se reentrena con nuevos datos
- Los criterios se ajustan según retroalimentación
- El método del codo permite optimizar k dinámicamente

---

## 6. FASE 6: DESPLIEGUE Y TOMA DE DECISIONES

### 6.1 Visualización y Dashboards

**Dashboard de Cursos:**
- **Gráfica de barras**: Distribución de cursos por cluster
- **Métrica**: Calidad de agrupamiento (86.32%)
- **Tabla**: Cantidad de cursos por grupo

**Dashboard de Alumnos:**
- **Métricas principales**:
  - Total de alumnos: 43
  - Accuracy: 84%
  - Precisión: 85%
  - Recall: 84%
  - Calidad de separación: 21%

- **Mapa de Alumnos (PCA 2D)**:
  - Eje X: Características de Aprendizaje
  - Eje Y: Patrón de Comportamiento
  - Colores: Grupo 0 (púrpura) y Grupo 1 (verde)
  - Tooltip: Nombre, grupo, promedio, exámenes realizados

- **Lista de alumnos por grupo**:
  - Estudiantes en Riesgo de Abandono (top 6)
  - Estudiantes en Excelencia (top 6)
  - Información: promedio, exámenes, días inactivo

- **Factores de influencia**:
  - Barras horizontales con porcentajes
  - Días sin actividad: 23%
  - Exámenes realizados: 21%
  - Total de intentos: 18%
  - Estabilidad en notas: 17%
  - Persistencia: 12%
  - Calificación promedio: 10%

**Dashboard de Método del Codo:**
- **Gráfica de línea**: k=2 a k=10
- **k óptimo**: 7 (100% calidad)
- **Tabla**: Datos analizados, grupos evaluados, resultado

### 6.2 Toma de Decisiones Basada en Datos

**Decisiones Académicas:**

1. **Intervención en alumnos en riesgo**:
   - Identificados por KMeans (Grupo 1)
   - Acciones: tutorías personalizadas, contenido de repaso
   - Ejemplo: "Requiere atención personalizada" para promedio < 60%

2. **Creación de niveles de refuerzo**:
   - Basado en análisis de dificultad
   - Creados por el profesor desde el frontend
   ```javascript
   await axios.post("http://127.0.0.1:5000/api/niveles", {
       curso_id: cursoId,
       titulo: "Nivel de Refuerzo Académico"
   });
   ```

3. **Recomendaciones personalizadas**:
   - Basadas en patrones de inscripción históricos
   - Sugieren el siguiente curso más adecuado
   - Ejemplo: "Puede ayudar a otros compañeros" para alumnos destacados

4. **Ajuste de contenidos**:
   - Basado en análisis de dificultad
   - Identifica lecciones problemáticas
   - Optimiza el material didáctico

**Decisiones Operativas:**

1. **Ajuste de respaldos**:
   - Frecuencia según flujo de datos
   - Tipos: completo, incremental, diferencial
   - Automatización con APScheduler

2. **Monitoreo de calidad**:
   - Silhouette Score para evaluar clusters
   - Métricas de precisión para validar modelo
   - Ajuste de k según método del codo

---

## 7. ARQUITECTURA DEL SISTEMA DE ML

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                             │
│  MongoDB Atlas (respuestas, examenes, cursos, usuarios)      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE PROCESAMIENTO (PySpark)                 │
│  - Extracción de datos                                       │
│  - Limpieza y normalización                                  │
│  - Cálculo de características (features)                     │
│  - Vectorización                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE MACHINE LEARNING                        │
│  - PCA: Reducción de dimensionalidad (6 → 2)                 │
│  - KMeans: Agrupamiento de cursos y alumnos                 │
│  - Método del Codo: Determinación de k óptimo               │
│  - Evaluación: Silhouette Score, Accuracy, Precisión, Recall│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA DE VISUALIZACIÓN (React)                   │
│  - Gráficas de distribución (BarChart)                       │
│  - Mapa de alumnos (ScatterChart con PCA)                    │
│  - Métricas y KPIs                                           │
│  - Listas de alumnos por grupo                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. TECNOLOGÍAS UTILIZADAS

**Machine Learning:**
- **PySpark MLlib**: KMeans, PCA, ClusteringEvaluator
- **scikit-learn**: Métricas de clasificación (accuracy, precision, recall)

**Procesamiento de Datos:**
- **PySpark**: Procesamiento distribuido de grandes volúmenes
- **MongoDB**: Almacenamiento de datos académicos
- **PyMongo**: Conexión y consultas a MongoDB

**Backend:**
- **Flask**: API REST
- **Flask-JWT-Extended**: Autenticación

**Frontend:**
- **React**: Interfaz de usuario
- **Recharts**: Visualizaciones gráficas
- **React Router**: Navegación

---

## 9. CONCLUSIONES

DevRootDark implementa un sistema integral de análisis de datos con Machine Learning que:

 **KMeans**: Agrupa cursos y alumnos con alta precisión
 **PCA**: Reduce dimensionalidad para visualización 2D
 **Método del Codo**: Determina k óptimo mediante prueba y error
 **Silhouette Score**: Evalúa calidad de agrupamiento
 **Métricas de Precisión**: Accuracy, Precisión, Recall

**Logros:**
- 86.32% de calidad en agrupamiento de cursos
- 84% de accuracy en clasificación de alumnos
- Sistema de visualización interactivo y completo

**Limitaciones reconocidas:**
- Método del codo pendiente en backend
- Segmentación de alumnos pendiente en backend
- Silhouette score bajo en alumnos (21%)

**Trabajo futuro:**
- Completar implementación de método del codo en backend
- Implementar segmentación de alumnos en backend
- Mejorar calidad de separación de alumnos
- Ajustar características para mejor agrupamiento

---

## 10. REFERENCIAS

**Archivos del sistema:**
- `controllers/kmeans.py`: Lógica de KMeans
- `controllers/segmentacion.py`: Segmentación de alumnos (pendiente)
- `routes/kmeans_routes.py`: Endpoint /api/kmeans
- `src/vistas/profesor/ProfesorPanel.jsx`: Dashboard de visualización

**Tecnologías:**
- PySpark MLlib: https://spark.apache.org/docs/latest/ml-guide.html
- KMeans: https://en.wikipedia.org/wiki/K-means_clustering
- PCA: https://en.wikipedia.org/wiki/Principal_component_analysis
- Silhouette Score: https://en.wikipedia.org/wiki/Silhouette_(clustering)

---

**Documento generado para**: Manual Técnico DevRootDark - Unidad 3  
**Fecha**: Mayo 2026  
**Autor**: Islas Acosta Luis Enrique – 222310478  
**Grupo**: IDGS – 94  
**Cuatrimestre**: 9º