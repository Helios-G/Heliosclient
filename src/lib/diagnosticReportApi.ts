import type { PlaygroundReportPayload, PlaygroundResultItem } from "./playgroundReport";

const AI_BASE_URL = "http://localhost:8000";

export interface DiagnosticDraftRequest {
  sessionId?: string;
  generatedAt?: string;
  modelId?: string;
  modelTitle: string;
  domainLabel: string;
  imageFileName?: string;
  results: PlaygroundResultItem[];
  notes?: string;
  // X-ray lesion segmentation 동반 실행 여부 (AI 서버 LLM 프롬프트에 반영용)
  segmentation?: {
    label: string;
    threshold: number;
    detected: boolean;
  };
}

export interface DiagnosticDraftResponse {
  generatedAt: string;
  provider: string;
  model: string;
  summary: string;
  findings: string;
  recommendations: string[];
  caution: string;
  draft: string;
  storedPath: string;
}

export function buildDiagnosticDraftRequest(
  payload: PlaygroundReportPayload,
): DiagnosticDraftRequest {
  return {
    generatedAt: payload.generatedAt,
    modelId: payload.modelId,
    modelTitle: payload.modelTitle,
    domainLabel: payload.domainLabel,
    imageFileName: payload.imageFileName,
    results: payload.results,
    notes: payload.notes,
    segmentation: payload.segmentationModel
      ? {
          label: payload.segmentationModel.label,
          threshold: payload.segmentationModel.threshold,
          detected: Boolean(payload.segmentationMaskUrl),
        }
      : undefined,
  };
}

export async function createDiagnosticDraft(
  payload: PlaygroundReportPayload,
): Promise<DiagnosticDraftResponse> {
  const response = await fetch(`${AI_BASE_URL}/reports/diagnostic-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildDiagnosticDraftRequest(payload)),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: unknown }).detail ?? "")
        : "";
    throw new Error(detail || "리포트 생성 API 호출에 실패했습니다.");
  }

  return body as DiagnosticDraftResponse;
}
