import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Practice from "./pages/Practice";
import Admin from "./pages/Admin";
import Teacher, { TeacherClass } from "./pages/Teacher";
import TeacherActivity from "./pages/TeacherActivity";
import StudentClasses, { StudentClass } from "./pages/Classrooms";
import Warmup from "./pages/Warmup";
import { Journey, Collection, HistoryPage } from "./pages/Progress";
import "@fontsource-variable/nunito";
import "./styles.css";
import "./readability.css";
import "./companion.css";
import "./personalization.css";
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-error">
        <h1>Mimo cần bắt nhịp lại một chút</h1>
        <p>Bạn tải lại trang để tiếp tục nhé.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Home() {
  const { user, ready } = useApp();
  return ready && user?.role === "teacher" ? (
    <Navigate to="/teacher" replace />
  ) : (
    <Dashboard />
  );
}
const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppProvider>
          <a className="skip-link" href="#main-content">
            Đến nội dung chính
          </a>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="teacher" element={<Teacher />} />
              <Route path="teacher/:classId" element={<TeacherClass />} />
              <Route
                path="teacher/:classId/topics/:activityId"
                element={<TeacherActivity />}
              />
              <Route path="classes" element={<StudentClasses />} />
              <Route path="classes/:classId" element={<StudentClass />} />
              <Route
                path="classes/:classId/warmup/:activityId"
                element={<Warmup />}
              />
              <Route path="practice/:id" element={<Practice />} />
              <Route path="journey" element={<Journey />} />
              <Route path="collection" element={<Collection />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="admin" element={<Admin />} />
              <Route path="account" element={<Account />} />
              <Route
                path="*"
                element={
                  <div className="page-wrap empty-state">
                    <h1>Mimo chưa tìm thấy lối này</h1>
                    <p>Về khu vườn khám phá và cùng bắt đầu lại nhé.</p>
                    <Link className="button" to="/">
                      Về khám phá
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

// Vite can reload this entry when provider exports change during development.
// Dispose the old React root before a replacement entry takes ownership.
if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}
