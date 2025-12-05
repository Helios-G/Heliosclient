import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner"; // 버전 명시(@2.0.3)는 지워도 됩니다
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
// ... 페이지 import 들 ...
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

// ✅ Context 추가
import { TrainingDataProvider } from "./contexts/TrainingDataContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* ✅ Layout 바깥으로 뺐습니다. (데이터가 UI보다 상위에 존재하도록) */}
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
              
              {/* 라벨링 & 학습 (핵심 기능) */}
              <Route path="/session/:sessionId/labeling/auto" element={<LabelingAutoPage />} />
              <Route path="/session/:sessionId/labeling/manual" element={<LabelingManualPage />} />
              <Route path="/session/:sessionId/training" element={<SessionTrainingPage />} />
              <Route path="/session/:sessionId/results" element={<SessionResultsPage />} />
              
              {/* 모델 & 관리자 */}
              <Route path="/download" element={<ModelDownloadPage />} />
              <Route path="/model/:modelId" element={<ModelDetailPage />} />
              <Route path="/admin" element={<AdminPage />} />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </TrainingDataProvider>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}