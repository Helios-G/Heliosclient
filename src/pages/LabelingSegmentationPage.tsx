import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as tf from "@tensorflow/tfjs";
import { Folder, Loader2, Wand2 } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { CohereMetricCard, CoherePage, CoherePageHeader } from "../components/CoherePage";
import { MaskEditor } from "../components/segmentation/MaskEditor";
import { useAuth } from "../contexts/AuthContext";
import { useTrainingData } from "../contexts/TrainingDataContext";
import { normalizeSessionDomain, screenFilesForSessionDomain, type DomainScreeningResult } from "../lib/domainScreening";
import { predictXrayLesionMask, loadXrayLesionSegmentationModel } from "../lib/segmentationModel";
import { SEGMENTATION_TASK, XRAY_SEGMENTATION_SIZE } from "../lib/taskTypes";
import { authFetch } from "../lib/authFetch";
import { readApiData } from "../lib/api";
import { useSession } from "../contexts/SessionContext";

interface SegmentationImage {
  filename: string;
  imageUrl: string;
  maskUrl?: string;
}

type AutoModelState = "checking" | "available" | "missing";

async function imageUrlToTensor(imageUrl: string): Promise<tf.Tensor3D> {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  return tf.tidy(() => {
    const canvas = document.createElement("canvas");
    canvas.width = XRAY_SEGMENTATION_SIZE;
    canvas.height = XRAY_SEGMENTATION_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지 canvas를 생성하지 못했습니다.");
    ctx.drawImage(image, 0, 0, XRAY_SEGMENTATION_SIZE, XRAY_SEGMENTATION_SIZE);
    return tf.browser.fromPixels(canvas).toFloat().div(255) as tf.Tensor3D;
  });
}

async function maskUrlToTensor(maskUrl: string): Promise<tf.Tensor3D> {
  const image = new Image();
  image.src = maskUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = XRAY_SEGMENTATION_SIZE;
  canvas.height = XRAY_SEGMENTATION_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("마스크 canvas를 생성하지 못했습니다.");
  ctx.drawImage(image, 0, 0, XRAY_SEGMENTATION_SIZE, XRAY_SEGMENTATION_SIZE);

  return tf.tidy(() => {
    const rgba = tf.browser.fromPixels(canvas, 4).toFloat();
    const alpha = rgba.slice([0, 0, 3], [XRAY_SEGMENTATION_SIZE, XRAY_SEGMENTATION_SIZE, 1]);
    return alpha.greater(16).toFloat() as tf.Tensor3D;
  });
}

export function LabelingSegmentationPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setTrainingData, setScreeningMeta } = useTrainingData();
  const { getSession, upsertSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"select" | "labeling">("select");
  const [images, setImages] = useState<SegmentationImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoModelState, setAutoModelState] = useState<AutoModelState>("checking");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [domainCheckResult, setDomainCheckResult] = useState<DomainScreeningResult | null>(null);
  const [sessionData, setSessionData] = useState<any | null>(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return;
      const localSession = getSession(sessionId);
      try {
        const response = await authFetch(`/sessions/${sessionId}`);
        if (response.ok) {
          const serverSession = await readApiData<any>(response);
          setSessionData(serverSession);
          upsertSession({
            id: String(serverSession.sessionId ?? sessionId),
            title: serverSession.title ?? "제목 없음",
            dataType: serverSession.dataFormat ?? "X-ray",
            classNames:
              typeof serverSession.labelClassList === "string" && serverSession.labelClassList.length > 0
                ? serverSession.labelClassList.split(",").map((item: string) => item.trim())
                : ["Lesion Mask"],
            taskType: SEGMENTATION_TASK,
            algorithm: serverSession.algorithm ?? localSession?.algorithm ?? "FedAvg",
            rounds: serverSession.rounds ?? localSession?.rounds ?? 5,
            createdAt: serverSession.createdAt ?? localSession?.createdAt ?? new Date().toISOString(),
            createdBy: serverSession.createdBy ?? localSession?.createdBy ?? "unknown",
            status:
              serverSession.status === "IN_PROGRESS"
                ? "running"
                : serverSession.status === "COMPLETED"
                  ? "completed"
                  : "waiting",
            participants: serverSession.participantCount ?? localSession?.participants ?? 0,
            targetParticipants: serverSession.maxParticipants ?? localSession?.targetParticipants ?? 0,
          });
          return;
        }
      } catch (error) {
        console.warn("세션 상세를 불러오지 못했습니다.", error);
      }
      setSessionData(localSession ?? null);
    };

    loadSession();
  }, [sessionId, getSession, upsertSession]);

  useEffect(() => {
    const checkModel = async () => {
      try {
        await loadXrayLesionSegmentationModel();
        setAutoModelState("available");
      } catch (error) {
        console.warn("X-ray 병변 segmentation TF.js 모델을 사용할 수 없습니다.", error);
        setAutoModelState("missing");
      }
    };
    checkModel();
  }, []);

  if (!user) return null;

  const currentImage = images[currentIndex];
  const labeledCount = images.filter((image) => Boolean(image.maskUrl)).length;
  const canStartTraining = images.length > 0 && labeledCount === images.length;

  const handleFolderSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    const expectedDomain = normalizeSessionDomain(sessionData?.dataFormat ?? sessionData?.dataType ?? "X-ray");
    const gate = await screenFilesForSessionDomain(imageFiles, expectedDomain);
    setDomainCheckResult(gate);
    if (!gate.accepted) {
      alert(`세션 도메인과 맞지 않는 데이터입니다.\n${gate.summary}`);
      return;
    }

    setImages(imageFiles.map((file) => ({
      filename: file.name,
      imageUrl: URL.createObjectURL(file),
    })));
    setCurrentIndex(0);
    setStep("labeling");
  };

  const updateCurrentMask = (maskUrl: string) => {
    setImages((prev) => prev.map((image, index) => (
      index === currentIndex ? { ...image, maskUrl } : image
    )));
  };

  const autoLabelCurrent = async () => {
    if (!currentImage || autoModelState !== "available") return;
    setIsProcessing(true);
    try {
      const maskUrl = await predictXrayLesionMask(currentImage.imageUrl);
      updateCurrentMask(maskUrl);
    } catch (error) {
      console.error(error);
      alert("브라우저 오토라벨링 중 오류가 발생했습니다. 수동 마스크로 계속 진행해주세요.");
      setAutoModelState("missing");
    } finally {
      setIsProcessing(false);
    }
  };

  const autoLabelAll = async () => {
    if (autoModelState !== "available") return;
    setIsProcessing(true);
    setProgressValue(0);
    try {
      const updated = [...images];
      for (let index = 0; index < updated.length; index += 1) {
        if (!updated[index].maskUrl) {
          updated[index] = {
            ...updated[index],
            maskUrl: await predictXrayLesionMask(updated[index].imageUrl),
          };
        }
        setProgressValue(((index + 1) / updated.length) * 100);
        await tf.nextFrame();
      }
      setImages(updated);
    } catch (error) {
      console.error(error);
      alert("전체 오토라벨링 중 오류가 발생했습니다. 생성된 마스크를 검수하고 나머지는 수동으로 진행해주세요.");
      setAutoModelState("missing");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTraining = async () => {
    if (!canStartTraining) {
      alert("모든 이미지에 병변 마스크를 작성하거나 확인해주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const xTensors: tf.Tensor3D[] = [];
      const yTensors: tf.Tensor3D[] = [];

      for (const item of images) {
        if (!item.maskUrl) continue;
        xTensors.push(await imageUrlToTensor(item.imageUrl));
        yTensors.push(await maskUrlToTensor(item.maskUrl));
        await tf.nextFrame();
      }

      const xAll = tf.stack(xTensors);
      const yAll = tf.stack(yTensors);
      const testCount = xTensors.length === 1 ? 1 : Math.max(1, Math.floor(xTensors.length * 0.2));
      const trainCount = xTensors.length === 1 ? 1 : xTensors.length - testCount;

      setTrainingData(
        xAll.slice([0, 0, 0, 0], [trainCount, -1, -1, -1]),
        yAll.slice([0, 0, 0, 0], [trainCount, -1, -1, -1]),
        xTensors.length === 1 ? xAll.clone() : xAll.slice([trainCount, 0, 0, 0], [testCount, -1, -1, -1]),
        xTensors.length === 1 ? yAll.clone() : yAll.slice([trainCount, 0, 0, 0], [testCount, -1, -1, -1]),
      );

      setScreeningMeta({
        expectedDomain: domainCheckResult?.expectedDomain ?? "xray",
        detectedDomain: domainCheckResult?.detectedDomain ?? "xray",
        domainScore: domainCheckResult?.compatibilityScore ?? 1,
        sampleCount: images.length,
        taskType: SEGMENTATION_TASK,
        maskShape: [XRAY_SEGMENTATION_SIZE, XRAY_SEGMENTATION_SIZE, 1],
        metricLabel: "Dice",
      });

      navigate(`/session/${sessionId}/training`);
    } catch (error) {
      console.error(error);
      alert("segmentation 학습 텐서 생성 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === "select") {
    return (
      <CoherePage>
        <CoherePageHeader
          eyebrow="Segmentation Labeling"
          title="X-ray 병변 Segmentation"
          description="X-ray 이미지는 브라우저 안에서만 처리되며, 병변 영역을 binary mask로 준비합니다."
        />

        <div className="cohere-upload-zone">
          <div>
            <Folder className="mx-auto mb-5 h-16 w-16" />
            <h3 className="cohere-section-title mb-2">X-ray 폴더 선택</h3>
            <p className="mx-auto mb-7 max-w-lg text-slate-600">
              병변 segmentation에 사용할 X-ray 이미지 폴더를 선택하세요.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFolderSelect}
              style={{ display: "none" }}
              // @ts-ignore
              webkitdirectory="" directory=""
            />
            <Button onClick={() => fileInputRef.current?.click()} className="cohere-gradient-button h-12 px-7">
              <Folder className="mr-2 h-5 w-5" /> 폴더 선택
            </Button>
          </div>
        </div>
      </CoherePage>
    );
  }

  return (
    <CoherePage wide>
      <CoherePageHeader
        eyebrow="Mask Workspace"
        title="병변 마스크 검수"
        description="오토라벨 결과가 있으면 수정하고, 없으면 브러시로 병변 영역을 직접 칠하세요."
      />

      {isProcessing && (
        <Card className="cohere-surface mb-6 p-5 shadow-none">
          <div className="mb-3 flex items-center gap-2 text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>브라우저에서 처리 중입니다.</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </Card>
      )}

      <div className="cohere-stat-grid mb-8">
        <CohereMetricCard label="이미지" value={images.length} caption="선택된 X-ray" />
        <CohereMetricCard label="마스크" value={`${labeledCount}/${images.length}`} caption="검수 완료" tone="cyan" />
        <CohereMetricCard
          label="오토라벨"
          value={autoModelState === "available" ? "Ready" : autoModelState === "checking" ? "Loading" : "Manual"}
          caption={autoModelState === "missing" ? "TF.js 모델 없음" : "브라우저 로컬"}
          tone="violet"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="clinical-panel p-5 shadow-none">
          {currentImage && (
            <MaskEditor
              imageUrl={currentImage.imageUrl}
              maskUrl={currentImage.maskUrl}
              onMaskChange={updateCurrentMask}
            />
          )}
        </Card>

        <aside className="space-y-4">
          <Card className="cohere-surface p-5 shadow-none">
            <p className="cohere-eyebrow">Current Image</p>
            <h3 className="mt-2 break-words text-lg font-semibold text-slate-950">{currentImage?.filename}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {currentIndex + 1} / {images.length}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}>
                이전
              </Button>
              <Button variant="outline" disabled={currentIndex >= images.length - 1} onClick={() => setCurrentIndex((value) => Math.min(images.length - 1, value + 1))}>
                다음
              </Button>
            </div>
          </Card>

          <Card className="cohere-surface p-5 shadow-none">
            <p className="cohere-eyebrow">Auto Label</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              TF.js segmentation 모델이 public asset에 있을 때만 브라우저에서 병변 마스크를 생성합니다.
            </p>
            <div className="mt-5 space-y-2">
              <Button className="w-full" disabled={autoModelState !== "available" || isProcessing} onClick={autoLabelCurrent}>
                <Wand2 className="mr-2 h-4 w-4" /> 현재 이미지 오토라벨
              </Button>
              <Button className="w-full" variant="outline" disabled={autoModelState !== "available" || isProcessing} onClick={autoLabelAll}>
                전체 빈 마스크 오토라벨
              </Button>
            </div>
          </Card>

          <Button
            className="cohere-gradient-button w-full py-6"
            disabled={!canStartTraining || isProcessing}
            onClick={handleStartTraining}
          >
            Segmentation 학습 시작
          </Button>
        </aside>
      </div>
    </CoherePage>
  );
}
