import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const useAuth = () => {
   const role = localStorage.getItem('userRole');
   return {
      isAuthenticated: !!role,
      role,
   };
}

const PublicRoutes = () => {
    const auth = useAuth();
    
    const navigateBasedOnRole = () => {
        // Assuming auth.role contains the user's role
        switch (auth.role) {
            // case "admin":
            //     return <Navigate to="/admin/dashboard" />;
            case "client":
                return <Navigate to="/client/projects" />;
            // case "employee":
            //     return <Navigate to="/employee/dashboard" />;
            default:
                // Redirect to a default route if the role is not recognized
                return <Navigate to="/login" />;
        }
    };
  
    return auth.isAuthenticated ? navigateBasedOnRole() : <Outlet />;
};

export default PublicRoutes;
