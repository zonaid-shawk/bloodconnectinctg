import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const isLoggedIn = false; // Temporary until Supabase Auth is connected

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
