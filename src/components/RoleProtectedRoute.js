import React from "react";
import { Navigate } from "react-router-dom";
import { getRoleHomePath } from "../utils/authHelpers";


const RoleProtectedRoute = ({ user, allowedRoles, allowedCountries, children }) => {
  if (!user || !user.role) {
    return <Navigate to="/" replace />;
  }

  const roleAllowed = allowedRoles.includes(user.role);

  // Admins can skip country checks, others must match the allowedCountries if provided
  const countryAllowed = user.role === 'admin' || !allowedCountries || allowedCountries.includes(user.country);

  if (!roleAllowed || !countryAllowed) {
    // Redirect unauthorized users to their own dashboard instead of login
    return <Navigate to={getRoleHomePath(user)} replace />;
  }

  return children;
};

export default RoleProtectedRoute;
