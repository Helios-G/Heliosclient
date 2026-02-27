import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Download, Star, Clock, FileJson } from "lucide-react";
import { downloadModelFiles } from "../utils/download"; // ✅ 헬퍼 함수 사용

interface Model {
  id: string;
  title: string;
  description: string;
  accuracy: string;
  size: string;
  updatedAt: string;
  tags: string[];
}

export function ModelDownloadPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();

  useEffect(() => {
    if (!hospital) navigate("/login");
  }, [hospital, navigate]);

  if (!hospital) return null;

  // 더미 모델 데이터
  const models: Model[] = [
    {
      id: "chexnet-v1",
      title: "CheXNet (DenseNet121)",
      description: "흉부 X-ray 14가지 질환을 진단할 수 있는 고성능 모델입니다. (Stanford CheXpert 기반)",
      accuracy: "94.2%",
      size: "28 MB",
      updatedAt: "2025-12-04",
      tags: ["X-ray", "Lung", "DenseNet"]
    },
    {
      id: "resnet-50",
      title: "ResNet-50 (Pneumonia)",
      description: "폐렴 진단에 특화된 경량화 모델입니다. 빠른 추론 속도가 장점입니다.",
      accuracy: "91.5%",
      size: "15 MB",
      updatedAt: "2025-11-20",
      tags: ["X-ray", "Pneumonia", "Lightweight"]
    },
    {
      id: "skin-cancer-v2",
      title: "DermNet (Skin Cancer)",
      description: "피부 병변 이미지를 분석하여 악성 흑색종을 분류합니다.",
      accuracy: "89.8%",
      size: "45 MB",
      updatedAt: "2025-10-15",
      tags: ["Dermoscopy", "Skin", "CNN"]
    }
  ];

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">모델 다운로드</h1>
          <p className="text-gray-600">
            연합학습을 통해 검증된 고성능 의료 AI 모델을 다운로드하여 활용하세요.
          </p>
        </div>

        <div className="grid gap-6">
          {models.map((model) => (
            <Card key={model.id} className="p-6 border-2 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* 모델 정보 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{model.title}</h3>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      v1.0
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{model.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {model.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-gray-500">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-gray-700">정확도 {model.accuracy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileJson className="w-4 h-4" />
                      <span>{model.size}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{model.updatedAt}</span>
                    </div>
                  </div>
                </div>

                {/* 다운로드 버튼 */}
                <div className="flex items-center">
                  <Button 
                    onClick={() => downloadModelFiles(model.id)}
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