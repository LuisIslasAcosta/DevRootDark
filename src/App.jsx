import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// ================= PUBLICO =================
import Registro from './user/Registro';
import Login from './user/Login';
import Politicas from './publico/Politicas';
import Inicio from './publico/Inicio_prueba';
import Recuperar from './user/Recuperar';

// ================= ALUMNO =================
import PrincipalAlumno from './vistas/user/principal_user';
import Cursos from './vistas/user/curso';
import MisCursosAlumno from './vistas/user/MisCursosAlumno';
import ResponderExamen from './vistas/user/ResponderExamen';
import ResultadosAlumno from './vistas/user/ResultadosAlumno';
import EditarPerfil from './vistas/editar';

// ================= ADMIN =================
import PrincipalAdmin from './vistas/admin/principal_admin';
import AdminCursos from './vistas/admin/AdminCursos';
import AdminUsuarios from './vistas/admin/AdminUsuarios';
import Respaldo from './vistas/admin/Respaldo';
import CursoDetalle from './vistas/admin/CursoDetalle';

// ================= PROFESOR =================
import ProfesorPanel from './vistas/profesor/ProfesorPanel';
import ProfesorCursos from './vistas/profesor/CursosProfesor';
import EditarCursoProfesor from './vistas/profesor/EditarCursoProfesor';
import Examenes from './vistas/profesor/Examenes';
import VerExamenes from './vistas/profesor/VerExamenes';
import Inscripciones from './vistas/profesor/Insripciones';
import AlumnosCursoProfesor from './vistas/profesor/AlumnosCursoProfesor';
import CrearLeccionProfesor from './vistas/profesor/CrearLeccionProfesor';
import VerLeccionesProfesor from './vistas/profesor/VerLeccionesProfesor';
import ReportesProfesor from './vistas/profesor/ReportesProfesor';
import VerNivelesProfesor from './vistas/profesor/VerNivelesProfesor';
import CrearNivelProfesor from './vistas/profesor/CrearNivelProfesor';

// ================= RUTAS PROTEGIDAS =================
import ProtectedRoute from './RutasProtegidas/ProtectedRoute';
import AdminRoute from './RutasProtegidas/AdminRoute';
import ProfesorRoute from './RutasProtegidas/ProfesorRoute';

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLICAS ================= */}
        <Route path="/" element={<Inicio />} />
        <Route path="/register" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/politicas" element={<Politicas />} />
        <Route path="/recuperar" element={<Recuperar/>}/>

        {/* ================= ALUMNO ================= */}
        <Route
          path="/principal"
          element={
            <ProtectedRoute>
              <PrincipalAlumno />
            </ProtectedRoute>
          }
        >
          <Route path="cursos/:id" element={<Cursos />} />
          <Route path="mis-cursos" element={<MisCursosAlumno />} />

          {/* RESPONDER EXAMEN */}
          <Route path="examen/:id" element={<ResponderExamen />} />

          {/* RESULTADOS */}
          <Route path="resultados" element={<ResultadosAlumno />} />
        </Route>

        {/* PERFIL ALUMNO */}
        <Route
          path="/alumno/perfil"
          element={
            <ProtectedRoute>
              <EditarPerfil />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PrincipalAdmin />
            </AdminRoute>
          }
        >
          <Route path="cursos" element={<AdminCursos />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="respaldo" element={<Respaldo />} />
          <Route path="editar-perfil" element={<EditarPerfil />} />
          <Route path="curso/:id" element={<CursoDetalle />} />
        </Route>

        {/* ================= PROFESOR ================= */}
        <Route
          path="/profesor"
          element={
            <ProfesorRoute>
              <ProfesorPanel />
            </ProfesorRoute>
          }
        >
          {/* CURSOS */}
          <Route path="cursos" element={<ProfesorCursos />} />
          <Route path="cursos/:id/editar" element={<EditarCursoProfesor />} />

          {/* VER ALUMNOS INSCRITOS */}
          <Route path="cursos/:id/alumnos" element={<AlumnosCursoProfesor />} />

          {/* LECCIONES */}
          <Route path="cursos/:id/lecciones" element={<VerLeccionesProfesor />} />
          <Route path="cursos/:id/lecciones/crear" element={<CrearLeccionProfesor />} />

          {/* NIVELES */}
          <Route path="cursos/:id/niveles" element={<VerNivelesProfesor />} />
          <Route path="cursos/:id/niveles/crear" element={<CrearNivelProfesor />} />

          {/* EXAMENES */}
          <Route path="examenes" element={<Examenes />} />
          <Route path="cursos/:cursoId/examenes" element={<VerExamenes />} />

          {/* INSCRIPCIONES */}
          <Route path="inscripciones" element={<Inscripciones />} />

          {/* REPORTES & RESULTADOS */}
          <Route path="reportes" element={<ReportesProfesor />} />

          {/* PERFIL */}
          <Route path="editar-perfil" element={<EditarPerfil />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
