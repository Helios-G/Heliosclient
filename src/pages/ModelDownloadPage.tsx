import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Download, Star, Clock, FileJson } from "lucide-react";
import { downloadModelFiles } from "../utils/download"; // ✅ 헬퍼 함수 사용
import { mockDownloadModels } from "../data/mockContributedModels";
import { CohereMetricCard, CoherePage, CoherePageHeader } from "../components/CoherePage";

export function ModelDownloadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  return (
    <CoherePage wide>
        <CoherePageHeader
          eyebrow="Model Registry"
          title="모델 다운로드"
          description="연합학습을 통해 검증된 의료 AI 모델을 다운로드하거나 진단실에서 바로 활용하세요."
          actions={
            <Button
              onClick={() => navigate("/playground")}
              className="cohere-gradient-button"
            >
              AI 진단실에서 바로 사용하기
            </Button>
          }
        />

        <div className="cohere-stat-grid mb-8">
          <CohereMetricCard label="등록 모델" value={mockDownloadModels.length} caption="다운로드 가능" />
          <CohereMetricCard label="실행 방식" value="Browser" caption="진단실 자동 로드 지원" tone="cyan" />
          <CohereMetricCard label="검증 지표" value="FL" caption="연합학습 결과 기반" tone="violet" />
        </div>

        <div className="grid gap-6">
          {mockDownloadModels.map((model) => (
            <Card
              key={model.id}
              className="cohere-model-card cursor-pointer"
              onClick={() => navigate(`/model/${model.id}`)}
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* 모델 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{model.sessionTitle}</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-[#0f62fe]">
                      {model.version}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{model.notes}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[model.dataType, model.algorithm, model.modelArchitecture].map(tag => (
                      <Badge key={tag} variant="outline" className="text-gray-500">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-gray-700">정확도 {(model.finalAccuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileJson className="w-4 h-4" />
                      <span>{model.modelArchitecture}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{model.completedAt}</span>
                    </div>
                  </div>
                </div>

                {/* 다운로드 버튼 */}
                <div className="flex items-center">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadModelFiles(model.id);
                    }}
                    className="cohere-gradient-button h-auto w-full px-6 py-6 text-lg md:w-auto"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    다운로드
                  </Button>
                </div>

              </div>
            </Card>
          ))}
        </div>
    </CoherePage>
  );
}
