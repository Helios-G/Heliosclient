export interface PlaygroundResultItem {
  name: string;
  score: number;
}

export interface PlaygroundReportPayload {
  generatedAt: string;
  modelId: string;
  modelTitle: string;
  domainLabel: string;
  imageUrl: string;
  imageFileName: string;
  results: PlaygroundResultItem[];
  draft: string;
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

