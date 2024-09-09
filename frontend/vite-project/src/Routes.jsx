// MainRoutes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import InnerContent from "./pages/InnerContent";
import ProtectedRoutes from "./AppRoutes/ProtectedRoutes";
import PublicRoutes from "./AppRoutes/PublicRoutes";
import SignUp from "./pages/authentication/SignUp";
import SignIn from "./pages/authentication/SignIn";
import ClientProjectPage from "./pages/client/ClientProject";
import KeyManagement from "./pages/client/KeyManagement";

const MainRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<InnerContent/>}>
              
                <Route
                    path="client"
                    element={<ProtectedRoutes />}
                >
                   
                    <Route path="projects" element={<ClientProjectPage/>} />
                    <Route path="keys" element={<KeyManagement/>} />
                </Route>
                <Route path="login" element={<PublicRoutes />} >
                    <Route index element={<SignIn />} />
                </Route>
                <Route path="register" element={<PublicRoutes />} >
                    <Route index element={<SignUp />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default MainRoutes;
