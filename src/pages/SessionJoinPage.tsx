import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";

export function SessionJoinPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const [labelingMethod, setLabelingMethod] = useState<"auto" | "manual" | null>(null);

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 세션 정보 (실제로는 API에서 가져옴)
  const sessionInfo = {
    title: "유방암 조기진단 AI 모델",
    dataType: "X-ray",
    classCount: 4,
    classNames: ["No Finding", "Pneumonia", "Atelectasis", "Cardiomegaly"],
    description: "흉부 X-ray 이미지를 활용한 질환 분류 모델 학습 세션입니다.",
    currentParticipants: 2,
    maxParticipants: 5
  };

  const handleNext = () => {
    if (!labelingMethod) {
      alert("라벨링 방법을 선택해주세요.");
      return;
    }

    if (labelingMethod === "auto") {
      navigate(`/session/${sessionId}/labeling/auto`);
    } else {
      navigate(`/session/${sessionId}/labeling/manual`);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-gray-800">세션 참여하기</h1>
          <p className="text-gray-600 mt-2">라벨링 방법을 선택하여 세션에 참여합니다</p>
        </div>

        {/* 세션 정보 */}
        <Card className="p-6 mb-8 border-2" style={{ backgroundColor: '#FFFFFF' }}>
          <h2 style={{ color: '#6B3131' }} className="mb-4">{sessionInfo.title}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">데이터 형식</p>
              <p>{sessionInfo.dataType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">클래스 수</p>
              <p>{sessionInfo.classCount}개</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">질환 목록</p>
            <div className="flex flex-wrap gap-2">
              {sessionInfo.classNames.map((name, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{ backgroundColor: '#FF9500', color: 'white' }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">참여 현황</p>
            <p>{sessionInfo.currentParticipants} / {sessionInfo.maxParticipants} 병원</p>
          </div>
        </Card>

        {/* 라벨링 방법 선택 */}
        <div className="mb-8">
          <h2 style={{ color: '#6B3131' }} className="mb-4">라벨링 방법 선택</h2>
          <p className="text-gray-600 mb-6">데이터를 자동으로 라벨링할지, 수동으로 라벨링할지 선택하세요</p>

          <RadioGroup
            value={labelingMethod || ""}
            onValueChange={(value) => setLabelingMethod(value as "auto" | "manual")}
            className="space-y-4"
          >
            {/* 자동 라벨링 */}
            <Card
              className={`p-6 border-2 cursor-pointer transition-all ${
                labelingMethod === "auto"
                  ? "border-[#FF9500] bg-orange-50"
                  : "border-gray-200 hover:border-[#FF9500]"
              }`}
              onClick={() => setLabelingMethod("auto")}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="auto" id="auto" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="auto" className="cursor-pointer">
                    <h3 className="mb-2" style={{ color: '#6B3131' }}>자동 라벨링</h3>
                  </Label>
                  <p className="text-gray-700 mb-3">
                    AI가 자동으로 이미지를 분석하여 라벨을 지정합니다. 
                    라벨링 완료 후 검수 단계에서 결과를 확인하고 수정할 수 있습니다.
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>✓ 빠른 라벨링 속도</p>
                    <p>✓ 대량의 데이터 처리에 적합</p>
                    <p>✓ 검수 단계에서 결과 확인 가능</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 수동 라벨링 */}
            <Card
              className={`p-6 border-2 cursor-pointer transition-all ${
                labelingMethod === "manual"
                  ? "border-[#FF9500] bg-orange-50"
                  : "border-gray-200 hover:border-[#FF9500]"
              }`}
              onClick={() => setLabelingMethod("manual")}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="manual" id="manual" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="manual" className="cursor-pointer">
                    <h3 className="mb-2" style={{ color: '#6B3131' }}>수동 라벨링</h3>
                  </Label>
                  <p className="text-gray-700 mb-3">
                    이미지를 하나씩 확인하며 직접 라벨을 지정합니다. 
                    진행 중 언제든지 남은 데이터를 AI로 자동 라벨링할 수 있습니다.
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>✓ 정확한 라벨링</p>
                    <p>✓ 이미지 품질 확인 가능</p>
                    <p>✓ 중간에 자동 라벨링으로 전환 가능</p>
                  </div>
                </div>
              </div>
            </Card>
          </RadioGroup>
        </div>

        {/* 안내 사항 */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <h4 className="mb-2 text-blue-900">참여 전 확인사항</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• 라벨링할 데이터는 로컬에서 선택하며, 데이터는 외부로 전송되지 않습니다</p>
            <p>• 라벨링 결과는 CSV 파일로 다운로드할 수 있습니다</p>
            <p>• 모든 참여 병원이 준비를 완료하면 자동으로 학습이 시작됩니다</p>
            <p>• 세션에서 정의된 클래스만 사용하여 라벨링해주세요</p>
          </div>
        </Card>

        {/* 다음 버튼 */}
        <Button
          onClick={handleNext}
          style={{ backgroundColor: '#6B3131' }}
          className="text-white hover:opacity-90 w-full py-8 text-lg"
          disabled={!labelingMethod}
        >
          다음 단계로
        </Button>
      </div>
    </div>
  );
}
