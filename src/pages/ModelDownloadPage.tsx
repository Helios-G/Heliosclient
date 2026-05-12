import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Download, Star, Clock, FileJson } from "lucide-react";
import { downloadModelFiles } from "../utils/download"; // ✅ 헬퍼 함수 사용
import { mockDownloadModels } from "../data/mockContributedModels";

export function ModelDownloadPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();

  useEffect(() => {
    if (!hospital) navigate("/login");
  }, [hospital, navigate]);

  if (!hospital) return null;

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">모델 다운로드</h1>
          <p className="text-gray-600">
            연합학습을 통해 검증된 고성능 의료 AI 모델을 다운로드하여 활용하세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/playground")}
              style={{ backgroundColor: "#6B3131" }}
              className="text-white hover:opacity-90"
            >
              AI 진단실에서 바로 사용하기
            </Button>
            <p className="self-center text-sm text-gray-500">
              브라우저 지원 모델은 파일 다운로드 없이 진단실에서 바로 자동 로드됩니다.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {mockDownloadModels.map((model) => (
            <Card
              key={model.id}
              className="p-6 border-2 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/model/${model.id}`)}
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* 모델 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{model.sessionTitle}</h3>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
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
                    style={{ backgroundColor: '#6B3131' }}
                    className="text-white hover:opacity-90 px-6 py-6 h-auto text-lg w-full md:w-auto"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    다운로드
                  </Button>
                </div>

              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
