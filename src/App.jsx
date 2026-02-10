import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Registro from './user/Registro';
import Login from './user/Login';
import Politicas from './publico/Politicas';
import Inicio from './publico/Inicio_prueba';
import 'bootstrap/dist/css/bootstrap.min.css';

import PrincipalAlumno from './vistas/user/principal_user';
import Cursos from './vistas/user/curso';
import MisCursosAlumno from './vistas/user/MisCursosAlumno';

import PrincipalAdmin from './vistas/admin/principal_admin';
import AdminCursos from './vistas/admin/AdminCursos';
import AdminUsuarios from './vistas/admin/AdminUsuarios';
import EditarPerfil from './vistas/editar';
import Respaldo from './vistas/admin/Respaldo';
import CursoDetalle from './vistas/admin/CursoDetalle';

import Examenes from './vistas/profesor/Examenes';
import ProfesorPanel from './vistas/profesor/ProfesorPanel';
import Inscripciones from './vistas/profesor/Insripciones';
import ProfesorCursos from './vistas/profesor/CursosProfesor';
import EditarCursoProfesor from './vistas/profesor/EditarCursoProfesor';
import VerExamenes from './vistas/profesor/VerExamenes';

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

        {/* ================= ALUMNO ================= */}
        <Route
          path="/principal"
          element={
            <ProtectedRoute>
              <PrincipalAlumno />
            </ProtectedRoute>
          }
        >
          {/* CURSO DETALLE DENTRO DEL PANEL */}
          <Route path="cursos/:id" element={<Cursos />} />

          {/* MIS CURSOS */}
          <Route path="alumno/mis-cursos" element={<MisCursosAlumno />} />
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
          <Route path="examenes" element={<Examenes />} />
          <Route path="inscripciones" element={<Inscripciones />} />
          <Route path="cursos" element={<ProfesorCursos />} />
          <Route path="cursos/:id/editar" element={<EditarCursoProfesor />} />
          <Route path="editar-perfil" element={<EditarPerfil />} />
          <Route path="ver-examenes" element={<VerExamenes />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
