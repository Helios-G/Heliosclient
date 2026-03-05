import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { X, Plus, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

// DR(당뇨망막병증) 프리셋
const DR_CLASSES = [
  { index: 0, en: "No DR",         kr: "당뇨망막병증 없음 (정상)" },
  { index: 1, en: "Mild",          kr: "경증" },
  { index: 2, en: "Moderate",      kr: "중등도" },
  { index: 3, en: "Severe",        kr: "중증" },
  { index: 4, en: "Proliferative", kr: "증식성 당뇨망막병증" },
];

// CheXpert 프리셋 데이터
const CHEXPERT_CLASSES = [
  { index: 0, en: "No Finding", kr: "특이사항 없음 (정상)", desc: "병변이 발견되지 않음" },
  { index: 1, en: "Enlarged Cardiomediastinum", kr: "심장종격동 비대", desc: "심장이나 종격동(가슴 중앙)이 커 보임" },
  { index: 2, en: "Cardiomegaly", kr: "심장비대증", desc: "심장이 비정상적으로 커짐" },
  { index: 3, en: "Lung Opacity", kr: "폐 혼탁", desc: "폐가 뿌옇게 보임 (포괄적인 소견)" },
  { index: 4, en: "Lung Lesion", kr: "폐 병변", desc: "폐에 결절이나 종괴 같은 덩어리가 보임" },
  { index: 5, en: "Edema", kr: "폐부종", desc: "폐에 물이 차거나 부음 (심부전 등 원인)" },
  { index: 6, en: "Consolidation", kr: "폐경화", desc: "폐포에 액체나 고체가 차서 딱딱해짐 (폐렴의 특징)" },
  { index: 7, en: "Pneumonia", kr: "폐렴", desc: "폐에 염증이 생김" },
  { index: 8, en: "Atelectasis", kr: "무기폐", desc: "폐의 일부가 찌그러져 공기가 안 들어감" },
  { index: 9, en: "Pneumothorax", kr: "기흉", desc: "폐에 구멍이 나서 흉강에 공기가 참" },
  { index: 10, en: "Pleural Effusion", kr: "흉수", desc: "흉막강(폐 껍질 사이)에 물이 고임" },
  { index: 11, en: "Pleural Other", kr: "기타 흉막 질환", desc: "흉막 비후, 섬유화 등 기타 흉막 문제" },
  { index: 12, en: "Fracture", kr: "골절", desc: "갈비뼈나 쇄골 등이 부러짐" },
  { index: 13, en: "Support Devices", kr: "의료 보조 장치", desc: "튜브, 심박동기, 라인 등이 몸에 삽입되어 있음" }
];

export function SessionCreatePage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const { addSession } = useSession();

  const [sessionTitle, setSessionTitle] = useState("");
  const [dataType, setDataType] = useState("");
  
  // ✅ [추가됨] 알고리즘 선택 State
  const [algorithm, setAlgorithm] = useState("FedAvg");

  const [classCount, setClassCount] = useState("");
  const [classNames, setClassNames] = useState<string[]>([]);
  const [currentClassName, setCurrentClassName] = useState("");
  const [notes, setNotes] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  const handleAddClass = () => {
    if (currentClassName.trim() && classNames.length < parseInt(classCount || "0")) {
      setClassNames([...classNames, currentClassName.trim()]);
      setCurrentClassName("");
    }
  };

  const handleRemoveClass = (index: number) => {
    setClassNames(classNames.filter((_, i) => i !== index));
  };

  // CheXpert 프리셋 적용
  const handleApplyCheXpert = () => {
    const classNamesOnly = CHEXPERT_CLASSES.map(cls => cls.en);
    setClassCount("14");
    setClassNames(classNamesOnly);
    setDataType("X-ray");
    alert("CheXpert 14개 클래스가 자동으로 설정되었습니다!");
  };

  // DR 프리셋 적용
  const handleApplyDR = () => {
    setClassCount("5");
    setClassNames(DR_CLASSES.map(c => c.en));
    setDataType("Fundus");
    alert("DR(당뇨망막병증) 5단계 클래스가 자동으로 설정되었습니다!");
  };

  const handleSubmit = () => {
    if (!sessionTitle.trim()) {
      alert("세션 제목을 입력해주세요.");
      return;
    }
    if (!dataType) {
      alert("데이터 형식을 선택해주세요.");
      return;
    }
    if (!classCount) {
      alert("질환 개수를 입력해주세요.");
      return;
    }
    if (classNames.length !== parseInt(classCount)) {
      alert(`${classCount}개의 질환명을 모두 입력해주세요. (현재 ${classNames.length}개)`);
      return;
    }

    // 세션 정보 저장
    const newSessionId = Date.now().toString();

    const newSession = {
      id: newSessionId,
      title: sessionTitle,
      dataType,
      algorithm, // ✅ 저장할 때 알고리즘 정보 포함
      classNames,
      createdAt: new Date().toISOString(),
      createdBy: hospital.name
    };

    addSession(newSession);
    console.log("세션 생성 완료:", newSession);

    // 성공 알림 표시
    setShowSuccessAlert(true);

    // 2초 후 세션 목록으로 이동
    setTimeout(() => {
      navigate("/session/list");
    }, 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* 성공 알림 */}
        {showSuccessAlert && (
          <Alert className="mb-8 border-2 border-green-500 bg-green-50">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <p>연합학습 세션이 생성되었습니다.</p>
              <p className="text-sm mt-1">
                참여 병원을 모집하고 조건 인원 수가 차면 자동으로 학습이 시작됩니다.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-gray-800">연합학습 세션 생성</h1>
          <p className="text-gray-600 mt-2">새로운 연합학습 세션을 생성합니다</p>
        </div>

        {/* 세션 정보 입력 폼 */}
        <div className="space-y-8">
          {/* 세션 제목 */}
          <div>
            <Label htmlFor="session-title" className="mb-2 block">
              세션 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="session-title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="예: 유방암 조기진단 AI 모델"
              className="border-2"
            />
          </div>

          {/* 데이터 형식 */}
          <div>
            <Label htmlFor="data-type" className="mb-2 block">
              데이터 형식 <span className="text-red-500">*</span>
            </Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger className="border-2">
                <SelectValue placeholder="데이터 형식을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X-ray">X-ray</SelectItem>
                <SelectItem value="CT">CT</SelectItem>
                <SelectItem value="MRI">MRI</SelectItem>
                <SelectItem value="Ultrasound">초음파</SelectItem>
                <SelectItem value="Pathology">병리 이미지</SelectItem>
                <SelectItem value="Fundus">안저 이미지</SelectItem>
                <SelectItem value="Other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ 알고리즘 선택 (추가됨) */}
          <div>
            <Label htmlFor="algorithm" className="mb-2 block">
              연합학습 알고리즘 <span className="text-red-500">*</span>
            </Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger className="border-2">
                <SelectValue placeholder="알고리즘을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FedAvg">FedAvg (기본 - 가중 평균)</SelectItem>
                <SelectItem value="FedAdam">FedAdam (고급 - Non-IID 데이터에 강함)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              * FedAvg: 일반적인 상황에 적합<br/>
              * FedAdam: 병원 간 데이터 차이가 클 때(Non-IID) 성능 우수
            </p>
          </div>

          {/* 질환 개수 */}
          <div>
            <Label htmlFor="class-count" className="mb-2 block">
              질환 개수 (클래스 수) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="class-count"
              type="number"
              min="2"
              max="20"
              value={classCount}
              onChange={(e) => {
                setClassCount(e.target.value);
                const count = parseInt(e.target.value) || 0;
                if (classNames.length > count) {
                  setClassNames(classNames.slice(0, count));
                }
              }}
              placeholder="예: 2"
              className="border-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              분류할 질환의 개수를 입력하세요 (2-20개)
            </p>
          </div>

          {/* 질환명 입력 */}
          {classCount && parseInt(classCount) > 0 && (
            <div>
              <Label className="mb-2 block">
                질환명 입력 <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                {classNames.length} / {classCount}개 입력됨
              </p>

              {/* 입력된 질환명 목록 */}
              {classNames.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {classNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border-2"
                      style={{ backgroundColor: '#FFF9F5', borderColor: '#FF9500' }}
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => handleRemoveClass(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 새 질환명 입력 */}
              {classNames.length < parseInt(classCount) && (
                <div className="flex gap-2">
                  <Input
                    value={currentClassName}
                    onChange={(e) => setCurrentClassName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddClass();
                      }
                    }}
                    placeholder={`질환명 ${classNames.length + 1}을 입력하세요 (예: No Finding, Pneumonia)`}
                    className="border-2 flex-1"
                  />
                  <Button
                    onClick={handleAddClass}
                    style={{ backgroundColor: '#FF9500' }}
                    className="text-white"
                    disabled={!currentClassName.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </div>
              )}

              {/* 프리셋 카드 2개 나란히 */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* CheXpert 프리셋 */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>🫁 CheXpert (흉부 X-ray)</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 text-xs text-blue-700 mb-3">
                    {CHEXPERT_CLASSES.map((cls) => (
                      <span key={cls.index} className="px-2 py-0.5 bg-blue-100 rounded">
                        {cls.en}
                      </span>
                    ))}
                  </div>
                  <Button
                    onClick={handleApplyCheXpert}
                    style={{ backgroundColor: '#FF9500' }}
                    className="text-white w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    CheXpert 14클래스 적용
                  </Button>
                </Card>

                {/* DR 프리셋 */}
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <p className="text-sm text-emerald-800 mb-2">
                    <strong>👁️ DR (당뇨망막병증)</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 text-xs text-emerald-700 mb-3">
                    {DR_CLASSES.map((cls) => (
                      <span key={cls.index} className="px-2 py-0.5 bg-emerald-100 rounded">
                        Lv{cls.index}: {cls.en}
                      </span>
                    ))}
                  </div>
                  <Button
                    onClick={handleApplyDR}
                    style={{ backgroundColor: '#059669' }}
                    className="text-white w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    DR 5단계 클래스 적용
                  </Button>
                </Card>

              </div>
            </div>
          )}

          {/* 주의사항 */}
          <div>
            <Label htmlFor="notes" className="mb-2 block">
              주의사항 및 설명
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="세션에 대한 설명이나 주의사항을 입력하세요"
              className="min-h-32 border-2"
              style={{ backgroundColor: '#FFF9F5' }}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <Button
          onClick={handleSubmit}
          style={{ backgroundColor: '#6B3131' }}
          className="text-white hover:opacity-90 w-full py-8 text-lg mt-8"
        >
          연합학습 세션 생성하기
        </Button>
      </div>
    </div>
  );
}