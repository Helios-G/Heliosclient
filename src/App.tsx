import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner@2.0.3";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { SessionListPage } from "./pages/SessionListPage";
import { SessionCreatePage } from "./pages/SessionCreatePage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { SessionJoinPage } from "./pages/SessionJoinPage";
import { LabelingAutoPage } from "./pages/LabelingAutoPage";
import { LabelingManualPage } from "./pages/LabelingManualPage";
import { SessionTrainingPage } from "./pages/SessionTrainingPage";
import { SessionResultsPage } from "./pages/SessionResultsPage";
import { ModelDownloadPage } from "./pages/ModelDownloadPage";
import { ModelDetailPage } from "./pages/ModelDetailPage";
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
            <Route path="/upload" element={<SessionListPage />} />
            <Route path="/session/list" element={<SessionListPage />} />
            <Route path="/session/create" element={<SessionCreatePage />} />
            <Route path="/session/:sessionId" element={<SessionDetailPage />} />
            <Route path="/session/:sessionId/join" element={<SessionJoinPage />} />
            <Route path="/session/:sessionId/labeling/auto" element={<LabelingAutoPage />} />
            <Route path="/session/:sessionId/labeling/manual" element={<LabelingManualPage />} />
            <Route path="/session/:sessionId/training" element={<SessionTrainingPage />} />
            <Route path="/session/:sessionId/results" element={<SessionResultsPage />} />
            <Route path="/download" element={<ModelDownloadPage />} />
            <Route path="/model/:modelId" element={<ModelDetailPage />} />
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