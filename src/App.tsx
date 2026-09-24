import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { store } from "./store/index.js";
import { RootState } from "./store/index.js";
import AuthPage from "./pages/AuthPage.js";
import HomePage from "./pages/HomePage.js";
import AdminPage from "./pages/AdminPage.js";
import ProfileViewPage from "./pages/ProfileViewPage.js";

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage onAuthSuccess={() => {}} />
              </PublicRoute>
            }
          />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/login" element={<AdminPage />} />
          <Route path="/profile/:id" element={<ProfileViewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
