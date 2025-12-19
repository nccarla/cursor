
import React from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

/**
 * Componente que protege rutas, permitiendo acceso solo a colaboradores autenticados.
 * 
 * - Si no hay usuario autenticado, redirige al login (público)
 * - Si hay roles específicos requeridos y el usuario no tiene uno de esos roles, redirige a /unauthorized
 * - Los assets estáticos en /public son accesibles públicamente sin pasar por este componente
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const user = api.getUser();

  // Verificar autenticación: solo colaboradores autenticados pueden acceder
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles específicos si se requieren
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
