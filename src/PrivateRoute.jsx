import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from './context/AuthContext';
import Loader from './components/Loader';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // While Firebase is restoring the session, show a loader instead of
  // redirecting — this is the key fix that prevents the "flash to login" problem.
  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;