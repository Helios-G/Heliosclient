export interface PlaygroundResultItem {
  name: string;
  score: number;
}

export interface PlaygroundGeneratedReport {
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

export interface PlaygroundReportPayload {
  generatedAt: string;
  modelId: string;
  modelTitle: string;
  domainLabel: string;
  imageUrl: string;
  imageFileName: string;
  results: PlaygroundResultItem[];
  notes?: string;
  clientDraft?: string;
  generatedReport?: PlaygroundGeneratedReport;
}

const STORAGE_KEY = "helios.playground.report";

export function savePlaygroundReport(payload: PlaygroundReportPayload) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadPlaygroundReport(): PlaygroundReportPayload | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PlaygroundReportPayload;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPlaygroundReport() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function updatePlaygroundReport(
  patch: Partial<PlaygroundReportPayload>,
): PlaygroundReportPayload | null {
  const current = loadPlaygroundReport();
  if (!current) return null;

  const next = {
    ...current,
    ...patch,
  };
  savePlaygroundReport(next);
  return next;
}
