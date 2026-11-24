import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Practice from "./pages/Practice";
import Admin from "./pages/Admin";
import { Journey, Collection, HistoryPage } from "./pages/Progress";
import "@fontsource-variable/nunito";
import "./styles.css";
import "./readability.css";
import "./companion.css";
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
              <Route index element={<Dashboard />} />
              <Route path="practice/:id" element={<Practice />} />
              <Route path="journey" element={<Journey />} />
              <Route path="collection" element={<Collection />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="admin" element={<Admin />} />
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
