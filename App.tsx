
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import BandejaCasos from './pages/BandejaCasos';
import CaseDetail from './pages/CaseDetail';
import Unauthorized from './pages/Unauthorized';
import GerenteDashboard from './pages/GerenteDashboard';
import SupervisorPanel from './pages/SupervisorPanel';
import AlertasCriticas from './pages/AlertasCriticas';
import GestionAgentes from './pages/GestionAgentes';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Rutas Públicas de Autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Vistas Principales por Rol */}
                <Route path="agente" element={<BandejaCasos />} />
                <Route path="supervisor" element={<SupervisorPanel />} />
                <Route path="gerencia" element={<GerenteDashboard />} />
                
                {/* Casos */}
                <Route path="casos" element={<BandejaCasos />} />
                <Route path="casos/:id" element={<CaseDetail />} />

                {/* Supervisor & Gerencia */}
                <Route path="alertas" element={
                  <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.GERENTE]}>
                    <AlertasCriticas />
                  </ProtectedRoute>
                } />
                <Route path="agentes" element={
                  <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                    <GestionAgentes />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="casos" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
