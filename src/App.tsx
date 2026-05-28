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
import { LabelingSegmentationPage } from "./pages/LabelingSegmentationPage";
import { SessionTrainingPage } from "./pages/SessionTrainingPage";
import { SessionResultsPage } from "./pages/SessionResultsPage";
import { ModelDownloadPage } from "./pages/ModelDownloadPage";
import { ModelDetailPage } from "./pages/ModelDetailPage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ModelInferencePage } from "./pages/ModelInferencePage";
import { ModelInferenceReportPage } from "./pages/ModelInferenceReportPage";

import { TrainingDataProvider } from "./contexts/TrainingDataContext";
import { SessionProvider } from "./contexts/SessionContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

//추후 중첩라우팅으로 리팩토링
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <TrainingDataProvider>
            <Layout>
              <Routes>
                {/* 🟢 누구나 접근 가능 (Public Routes) */}
                <Route path="/" element={<HomePage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* 🔴 로그인이 필요한 페이지들 (Protected Routes) */}
                <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><SessionListPage /></ProtectedRoute>} />
                <Route path="/session/list" element={<ProtectedRoute><SessionListPage /></ProtectedRoute>} />
                <Route path="/session/create" element={<ProtectedRoute><SessionCreatePage /></ProtectedRoute>} />
                <Route path="/session/:sessionId" element={<ProtectedRoute><SessionDetailPage /></ProtectedRoute>} />
                <Route path="/session/:sessionId/join" element={<ProtectedRoute><SessionJoinPage /></ProtectedRoute>} />
                
                {/* 라벨링 & 학습 */}
                <Route path="/session/:sessionId/labeling/auto" element={<ProtectedRoute><LabelingAutoPage /></ProtectedRoute>} />
                <Route path="/session/:sessionId/labeling/manual" element={<ProtectedRoute><LabelingManualPage /></ProtectedRoute>} />
                <Route path="/session/:sessionId/labeling/segmentation" element={<ProtectedRoute><LabelingSegmentationPage /></ProtectedRoute>} />
                <Route path="/session/:sessionId/training" element={<ProtectedRoute><SessionTrainingPage /></ProtectedRoute>} />
                <Route path="/session/:sessionId/results" element={<ProtectedRoute><SessionResultsPage /></ProtectedRoute>} />
                
                {/* 모델 & 관리자 */}
                <Route path="/download" element={<ModelDownloadPage />} />
                <Route path="/model/:modelId" element={<ModelDetailPage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* ✅ AI 진단실 (Playground) */}
                <Route path="/playground" element={<ModelInferencePage />} />
                <Route path="/playground/report" element={<ModelInferenceReportPage />} />
                
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
