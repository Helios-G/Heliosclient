import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
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

// ✅ [추가됨] 이 줄이 빠져서 에러가 났던 겁니다!
import { ModelInferencePage } from "./pages/ModelInferencePage";

import { TrainingDataProvider } from "./contexts/TrainingDataContext";
import { SessionProvider } from "./contexts/SessionContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <TrainingDataProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/mypage" element={<MyPage />} />
                
                {/* 세션 관련 */}
                <Route path="/upload" element={<SessionListPage />} />
                <Route path="/session/list" element={<SessionListPage />} />
                <Route path="/session/create" element={<SessionCreatePage />} />
                <Route path="/session/:sessionId" element={<SessionDetailPage />} />
                <Route path="/session/:sessionId/join" element={<SessionJoinPage />} />
                
                {/* 라벨링 & 학습 */}
                <Route path="/session/:sessionId/labeling/auto" element={<LabelingAutoPage />} />
                <Route path="/session/:sessionId/labeling/manual" element={<LabelingManualPage />} />
                <Route path="/session/:sessionId/training" element={<SessionTrainingPage />} />
                <Route path="/session/:sessionId/results" element={<SessionResultsPage />} />
                
                {/* 모델 & 관리자 */}
                <Route path="/download" element={<ModelDownloadPage />} />
                <Route path="/model/:modelId" element={<ModelDetailPage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* ✅ AI 진단실 (Playground) */}
                <Route path="/playground" element={<ModelInferencePage />} />
                
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </TrainingDataProvider>
        </SessionProvider>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}