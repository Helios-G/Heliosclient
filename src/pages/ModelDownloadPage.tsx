import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";

interface Model {
  id: string;
  title: string;
  dataset: string;
  updatedTime: string;
}

export function ModelDownloadPage() {
  const { hospital } = useAuth();
  const navigate = useNavigate();

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 모델 목록 데이터
  const models: Model[] = [
    {
      id: "1",
      title: "세션 제목 v1.",
      dataset: "사용 데이터 셋",
      updatedTime: "updated 5 hours ago"
    },
    {
      id: "2",
      title: "세션 제목 (version)",
      dataset: "사용 데이터 셋",
      updatedTime: "updated 5 hours ago"
    },
    {
      id: "3",
      title: "세션 제목 v1.",
      dataset: "사용 데이터 셋",
      updatedTime: "updated 5 hours ago"
    },
  ];

  const handleModelClick = (modelId: string) => {
    navigate(`/model/${modelId}`);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-800">모델 목록</h1>
        </div>

        {/* 모델 카드 목록 */}
        <div className="space-y-4">
          {models.map((model) => (
            <Card
              key={model.id}
              className="p-6 border-2 cursor-pointer transition-all hover:border-[#FF9500] hover:bg-orange-50"
              onClick={() => handleModelClick(model.id)}
            >
              <h3 className="mb-2" style={{ color: '#6B3131' }}>
                {model.title}
              </h3>
              <p className="text-gray-600">
                {model.dataset} / {model.updatedTime}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}