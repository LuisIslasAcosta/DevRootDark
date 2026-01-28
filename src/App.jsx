import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Registro from './user/Registro';
import Login from './user/Login';
import Politicas from './publico/Politicas';
import Inicio from './publico/Inicio_prueba';
import 'bootstrap/dist/css/bootstrap.min.css';
import PrincipalUser from './vistas/user/principal_user';
import Cursos from './vistas/user/curso';
import PrincipalAdmin from './vistas/admin/principal_admin';
import AdminCursos from './vistas/admin/AdminCursos';
import AdminUsuarios from './vistas/admin/AdminUsuarios';
import EditarPerfil from './vistas/editar';
import Respaldo from './vistas/admin/Respaldo';
import CursoDetalle from './vistas/admin/CursoDetalle';

import ProtectedRoute from './RutasProtegidas/ProtectedRoute';
import AdminRoute from './RutasProtegidas/AdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/register" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/politicas" element={<Politicas />} />
        <Route path="/" element={<Inicio />} />

        {/* Rutas protegidas para usuarios */}
        <Route
          path="/cursos/:id"
          element={
            <ProtectedRoute>
              <Cursos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/principal"
          element={
            <ProtectedRoute>
              <PrincipalUser />
            </ProtectedRoute>
          }
        />

        {/* Ruta exclusiva para administradores */}
        <Route path="/admin" element={<AdminRoute><PrincipalAdmin /></AdminRoute>}>
          <Route path="cursos" element={<AdminCursos />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="respaldo" element={<Respaldo />} />
          <Route path='editar-perfil' element={<EditarPerfil />} />
          <Route path="curso/:id" element={<CursoDetalle />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;