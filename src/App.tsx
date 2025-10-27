import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner@2.0.3";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { ModelUploadPage } from "./pages/ModelUploadPage";
import { ModelDownloadPage } from "./pages/ModelDownloadPage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/upload" element={<ModelUploadPage />} />
            <Route path="/download" element={<ModelDownloadPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {/* 나중에 추가할 페이지들 */}
            {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
            {/* <Route path="/services" element={<ServicesPage />} /> */}
            
            {/* 404 페이지 - 모든 매칭되지 않는 경로 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
