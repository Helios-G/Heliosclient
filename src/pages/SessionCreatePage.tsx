import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { authFetch } from "../lib/authFetch";
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
import { X, Plus, Sparkles, AlertCircle, Settings2, CheckCircle2, FlaskConical, Users } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { readApiData, readApiErrorMessage } from "../lib/api";
import { CohereMetricCard, CoherePage, CoherePageHeader } from "../components/CoherePage";
import { CLASSIFICATION_TASK, SEGMENTATION_TASK, XRAY_LESION_SEGMENTATION_LABELS, type HeliosTaskType } from "../lib/taskTypes";

const DR_CLASSES = [
  { index: 0, en: "No DR",         kr: "당뇨망막병증 없음 (정상)" },
  { index: 1, en: "Mild",          kr: "경증" },
  { index: 2, en: "Moderate",      kr: "중등도" },
  { index: 3, en: "Severe",        kr: "중증" },
  { index: 4, en: "Proliferative", kr: "증식성 당뇨망막병증" },
];

const CHEXPERT_CLASSES = [
  { index: 0,  en: "No Finding",                  kr: "특이사항 없음 (정상)" },
  { index: 1,  en: "Enlarged Cardiomediastinum",  kr: "심장종격동 비대" },
  { index: 2,  en: "Cardiomegaly",                kr: "심장비대증" },
  { index: 3,  en: "Lung Opacity",                kr: "폐 혼탁" },
  { index: 4,  en: "Lung Lesion",                 kr: "폐 병변" },
  { index: 5,  en: "Edema",                       kr: "폐부종" },
  { index: 6,  en: "Consolidation",               kr: "폐경화" },
  { index: 7,  en: "Pneumonia",                   kr: "폐렴" },
  { index: 8,  en: "Atelectasis",                 kr: "무기폐" },
  { index: 9,  en: "Pneumothorax",                kr: "기흉" },
  { index: 10, en: "Pleural Effusion",            kr: "흉수" },
  { index: 11, en: "Pleural Other",               kr: "기타 흉막 질환" },
  { index: 12, en: "Fracture",                    kr: "골절" },
  { index: 13, en: "Support Devices",             kr: "의료 보조 장치" }
];

export function SessionCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addSession } = useSession();

  const [sessionTitle, setSessionTitle] = useState("");
  const [dataType, setDataType] = useState("");
  const [algorithm, setAlgorithm] = useState("FedAvg");
  const [maxParticipants, setMaxParticipants] = useState("5");
  const [rounds, setRounds] = useState("5");
  const [classCount, setClassCount] = useState("");
  const [classNames, setClassNames] = useState<string[]>([]);
  const [taskType, setTaskType] = useState<HeliosTaskType>(CLASSIFICATION_TASK);
  const [currentClassName, setCurrentClassName] = useState("");
  const [notes, setNotes] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleAddClass = () => {
    if (currentClassName.trim() && classNames.length < parseInt(classCount || "0")) {
      setClassNames([...classNames, currentClassName.trim()]);
      setCurrentClassName("");
    }
  };

  const handleRemoveClass = (index: number) => {
    setClassNames(classNames.filter((_, i) => i !== index));
  };

  const handleApplyCheXpert = () => {
    setTaskType(CLASSIFICATION_TASK);
    setClassCount("14");
    setClassNames(CHEXPERT_CLASSES.map(cls => cls.en));
    setDataType("X-ray");
    alert("CheXpert 14개 클래스가 자동으로 설정되었습니다!");
  };

  const handleApplyDR = () => {
    setTaskType(CLASSIFICATION_TASK);
    setClassCount("5");
    setClassNames(DR_CLASSES.map(c => c.en));
    setDataType("Fundus");
    alert("DR(당뇨망막병증) 5단계 클래스가 자동으로 설정되었습니다!");
  };

  const handleApplyXraySegmentation = () => {
    setTaskType(SEGMENTATION_TASK);
    setClassCount("1");
    setClassNames(XRAY_LESION_SEGMENTATION_LABELS);
    setDataType("X-ray");
    alert("X-ray 병변 segmentation 설정이 적용되었습니다.");
  };

  // ✅ async 추가
  const handleSubmit = async () => {
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
      alert(`${classCount}개의 질환명을 모두 입력해주세요.`);
      return;
    }

    const sessionRequest = {
      title: sessionTitle,
      description: notes || "설명 없음",
      maxParticipants: parseInt(maxParticipants),
      rounds: parseInt(rounds),
        dataFormat: dataType,
        labelClassCount: parseInt(classCount),
        labelClassList: classNames,
      createdBy: user.id 
    };
  
    try {
      console.log("📤 세션 생성 요청:", sessionRequest);

      const response = await authFetch("/sessions", {
        method: "POST",
        body: JSON.stringify(sessionRequest)
      });

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, "세션 생성 실패"));
      }
  
      const result = await readApiData<{ sessionId: number; status: string }>(response);
      console.log("📥 생성 성공:", result);

      const newSession = {
        ...sessionRequest,
        id: result.sessionId.toString(),
        algorithm: algorithm,
        taskType,
        rounds: result.rounds ?? parseInt(rounds),
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        status: "WAITING",
        participants: 1,
        targetParticipants: parseInt(maxParticipants) 
      };
  
      addSession(newSession); 
      setShowSuccessAlert(true);
      setTimeout(() => navigate(`/session/${result.sessionId}/labeling/${taskType === SEGMENTATION_TASK ? "segmentation" : "auto"}`), 2000);
  
    } catch (error) {
      console.error("❌ 세션 생성 실패:", error);
      alert("세션을 생성하지 못했습니다. 관리자에게 문의하세요.");
    }
  };

  return (
    <CoherePage wide>
        {showSuccessAlert && (
          <Alert className="mb-8 border border-green-200 bg-green-50">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <p>연합학습 세션이 생성되었습니다.</p>
              <p className="text-sm mt-1">
                라벨링 페이지로 이동합니다...
              </p>
            </AlertDescription>
          </Alert>
        )}

        <CoherePageHeader
          eyebrow="Session Builder"
          title="연합학습 세션 생성"
          description="기관 참여 조건, 데이터 도메인, 라벨 클래스를 정의합니다."
        />

        <div className="cohere-two-column">
          <div>

        <div className="clinical-panel session-create-panel p-6 md:p-9">
          <div className="session-create-heading flex items-start gap-4 border-b border-slate-200 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#0f62fe]">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">세션 계약 정보</h2>
              <p className="text-sm text-slate-500">이 값은 백엔드 세션과 AI 학습 시작 요청에 사용됩니다.</p>
            </div>
          </div>

          <div className="session-field">
            <Label htmlFor="session-title" className="session-label">
              세션 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="session-title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="예: 유방암 조기진단 AI 모델"
              className="h-12 border-slate-300 bg-white"
            />
          </div>

          <div className="grid gap-7 md:grid-cols-2">
            <div className="session-field">
              <Label className="session-label">참여 목표 기관 수 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="2"
                max="20"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="예: 5"
                className="h-12 border-slate-300 bg-white"
              />
              <p className="session-help">설정한 인원수가 모두 모집되면 연합학습이 자동으로 시작됩니다.</p>
            </div>

            <div className="session-field">
              <Label className="session-label">학습 라운드 수 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                placeholder="예: 5"
                className="h-12 border-slate-300 bg-white"
              />
              <p className="session-help">이 값이 백엔드 세션에 저장되고, 학습 시작 시 AI 서버로 전달됩니다.</p>
            </div>
          </div>

          <div className="session-field">
            <Label className="session-label">학습 Task <span className="text-red-500">*</span></Label>
            <Select value={taskType} onValueChange={(value) => setTaskType(value as HeliosTaskType)}>
              <SelectTrigger className="h-12 border-slate-300 bg-white">
                <SelectValue placeholder="학습 task를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CLASSIFICATION_TASK}>Classification</SelectItem>
                <SelectItem value={SEGMENTATION_TASK}>Segmentation</SelectItem>
              </SelectContent>
            </Select>
            <p className="session-help">Segmentation은 X-ray 병변 binary mask 학습에 사용됩니다.</p>
          </div>

          <div className="session-field">
            <Label htmlFor="data-type" className="session-label">
              데이터 형식 <span className="text-red-500">*</span>
            </Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger className="h-12 border-slate-300 bg-white">
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

          <div className="session-field">
            <Label htmlFor="algorithm" className="session-label">
              연합학습 알고리즘 <span className="text-red-500">*</span>
            </Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger className="h-12 border-slate-300 bg-white">
                <SelectValue placeholder="알고리즘을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FedAvg">FedAvg (기본 - 가중 평균)</SelectItem>
                <SelectItem value="FedAdam">FedAdam (고급 - Non-IID 데이터에 강함)</SelectItem>
              </SelectContent>
            </Select>
            <p className="session-help session-help-lines">
              <span>FedAvg: 일반적인 상황에 적합</span>
              <span>FedAdam: 병원 간 데이터 차이가 클 때 성능 우수</span>
            </p>
          </div>

          <div className="session-field">
            <Label htmlFor="class-count" className="session-label">
              질환 개수 (클래스 수) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="class-count"
              type="number"
              min="1"
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
              className="h-12 border-slate-300 bg-white"
            />
            <p className="session-help">분류는 2-20개 클래스, segmentation은 1개 mask 클래스를 사용합니다.</p>
          </div>

          {classCount && parseInt(classCount) > 0 && (
            <div className="session-field">
              <Label className="session-label">
                질환명 입력 <span className="text-red-500">*</span>
              </Label>
              <p className="session-help">
                {classNames.length} / {classCount}개 입력됨
              </p>

              {classNames.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {classNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-[#0f62fe]"
                    >
                      <span>{name}</span>
                      <button onClick={() => handleRemoveClass(index)} className="text-red-500 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {classNames.length < parseInt(classCount) && (
                <div className="flex gap-3">
                  <Input
                    value={currentClassName}
                    onChange={(e) => setCurrentClassName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddClass();
                      }
                    }}
                    placeholder={`질환명 ${classNames.length + 1}을 입력하세요`}
                    className="h-12 flex-1 border-slate-300 bg-white"
                  />
                  <Button
                    onClick={handleAddClass}
                    className="h-12 bg-[#0f62fe] px-5 text-white hover:bg-[#0043ce]"
                    disabled={!currentClassName.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 추가
                  </Button>
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>🫁 CheXpert (흉부 X-ray)</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 text-xs text-blue-700 mb-3">
                    {CHEXPERT_CLASSES.map((cls) => (
                      <span key={cls.index} className="px-2 py-0.5 bg-blue-100 rounded">{cls.en}</span>
                    ))}
                  </div>
                  <Button onClick={handleApplyCheXpert} className="w-full bg-[#0f62fe] text-white hover:bg-[#0043ce]">
                    <Sparkles className="w-4 h-4 mr-1" /> CheXpert 14클래스 적용
                  </Button>
                </Card>

                <Card className="p-4 bg-emerald-50 border-emerald-200">
                  <p className="text-sm text-emerald-800 mb-2">
                    <strong>👁️ DR (당뇨망막병증)</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 text-xs text-emerald-700 mb-3">
                    {DR_CLASSES.map((cls) => (
                      <span key={cls.index} className="px-2 py-0.5 bg-emerald-100 rounded">Lv{cls.index}: {cls.en}</span>
                    ))}
                  </div>
                  <Button onClick={handleApplyDR} className="w-full bg-[#24a148] text-white hover:bg-[#198038]">
                    <Sparkles className="w-4 h-4 mr-1" /> DR 5단계 클래스 적용
                  </Button>
                </Card>

                <Card className="border-cyan-100 bg-cyan-50 p-4 md:col-span-2">
                  <p className="text-sm text-cyan-800 mb-2">
                    <strong>X-ray 병변 Segmentation</strong>
                  </p>
                  <p className="mb-3 text-xs leading-5 text-cyan-700">
                    binary lesion mask를 수동 또는 브라우저 TF.js 오토라벨링으로 준비합니다.
                  </p>
                  <Button onClick={handleApplyXraySegmentation} className="w-full bg-[#0e7490] text-white hover:bg-[#155e75]">
                    <Sparkles className="w-4 h-4 mr-1" /> X-ray 병변 Segmentation 적용
                  </Button>
                </Card>
              </div>
            </div>
          )}

          <div className="session-field">
            <Label htmlFor="notes" className="session-label">주의사항 및 설명</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="세션에 대한 설명이나 주의사항을 입력하세요"
              className="min-h-36 border-slate-300 bg-white"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="cohere-gradient-button mt-8 w-full py-8 text-lg"
        >
          연합학습 세션 생성하기
        </Button>
          </div>

          <aside className="cohere-side-panel space-y-5">
            <div className="cohere-surface p-5">
              <p className="cohere-eyebrow">Live Preview</p>
              <h2 className="cohere-section-title mt-2">{sessionTitle || "새 연구 세션"}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {notes || "세션 설명을 입력하면 참여 기관이 확인할 요약으로 표시됩니다."}
              </p>
              <div className="mt-5 grid gap-3">
                <CohereMetricCard label="참여 목표" value={`${maxParticipants || 0}곳`} caption="학습 시작 조건" tone="cyan" />
                <CohereMetricCard label="라운드" value={rounds || 0} caption={algorithm} tone="violet" />
                <CohereMetricCard label={taskType === SEGMENTATION_TASK ? "마스크" : "클래스"} value={classNames.length || classCount || 0} caption={`${dataType || "데이터 형식 미선택"} / ${taskType}`} tone="blue" />
              </div>
            </div>

            <div className="cohere-surface p-5">
              <p className="cohere-eyebrow">Checklist</p>
              <div className="cohere-check-list mt-4">
                <div className="cohere-check-item">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <strong>세션 계약 정보</strong>
                    <p>제목, 참여 목표, 라운드 수를 먼저 확정합니다.</p>
                  </div>
                </div>
                <div className="cohere-check-item">
                  <FlaskConical className="h-5 w-5" />
                  <div>
                    <strong>데이터 도메인</strong>
                    <p>X-ray 또는 Fundus처럼 모델 로딩에 필요한 도메인을 선택합니다.</p>
                  </div>
                </div>
                <div className="cohere-check-item">
                  <Users className="h-5 w-5" />
                  <div>
                    <strong>기관 모집</strong>
                    <p>목표 기관 수가 채워지면 학습 단계로 이어집니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
    </CoherePage>
  );
}
