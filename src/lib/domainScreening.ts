export type SessionDomain = "xray" | "fundus" | "unknown";

export interface DomainScreeningResult {
  expectedDomain: SessionDomain;
  detectedDomain: SessionDomain;
  compatibilityScore: number;
  xrayScore: number;
  fundusScore: number;
  samplesInspected: number;
  accepted: boolean;
  summary: string;
}

interface ImageDomainMetrics {
  xrayScore: number;
  fundusScore: number;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSessionDomain(rawValue?: string | null): SessionDomain {
  const value = String(rawValue || "").trim().toLowerCase();
  if (value.includes("fundus") || value.includes("retina") || value.includes("dr")) {
    return "fundus";
  }
  if (value.includes("x-ray") || value.includes("xray") || value.includes("chex") || value.includes("chest")) {
    return "xray";
  }
  return "unknown";
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = imageUrl;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function analyzeImageElement(img: HTMLImageElement): ImageDomainMetrics {
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { xrayScore: 0.5, fundusScore: 0.5 };
  }

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let totalGap = 0;
  let centerLuma = 0;
  let borderLuma = 0;
  let centerCount = 0;
  let borderCount = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const r = data[index] / 255;
      const g = data[index + 1] / 255;
      const b = data[index + 2] / 255;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      totalR += r;
      totalG += g;
      totalB += b;
      totalGap += (Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b)) / 3;

      const isBorder = x < size * 0.12 || y < size * 0.12 || x > size * 0.88 || y > size * 0.88;
      if (isBorder) {
        borderLuma += luma;
        borderCount += 1;
      } else {
        centerLuma += luma;
        centerCount += 1;
      }
    }
  }

  const pixelCount = size * size;
  const meanR = totalR / pixelCount;
  const meanG = totalG / pixelCount;
  const meanB = totalB / pixelCount;
  const colorGap = totalGap / pixelCount;
  const grayscaleScore = clamp(1 - colorGap * 1.8);
  const warmth = clamp(((meanR + meanG) * 0.5) - meanB + 0.1);
  const borderContrast = clamp((centerLuma / Math.max(centerCount, 1)) - (borderLuma / Math.max(borderCount, 1)));

  const xrayScore = clamp(grayscaleScore * 0.8 + (1 - warmth) * 0.2);
  const fundusScore = clamp(colorGap * 1.1 * 0.5 + warmth * 0.25 + borderContrast * 0.25);

  return { xrayScore, fundusScore };
}

export async function screenFilesForSessionDomain(
  files: File[],
  rawExpectedDomain?: string | null,
  sampleLimit = 5,
): Promise<DomainScreeningResult> {
  const expectedDomain = normalizeSessionDomain(rawExpectedDomain);
  const sampleFiles = files.slice(0, sampleLimit);

  if (sampleFiles.length === 0) {
    return {
      expectedDomain,
      detectedDomain: "unknown",
      compatibilityScore: 0,
      xrayScore: 0,
      fundusScore: 0,
      samplesInspected: 0,
      accepted: false,
      summary: "검사할 샘플 이미지가 없습니다.",
    };
  }

  const metrics: ImageDomainMetrics[] = [];
  for (const file of sampleFiles) {
    try {
      const img = await loadImageElement(file);
      metrics.push(analyzeImageElement(img));
    } catch (error) {
      console.warn("도메인 샘플 분석에 실패했습니다.", file.name, error);
    }
  }

  if (metrics.length === 0) {
    return {
      expectedDomain,
      detectedDomain: "unknown",
      compatibilityScore: 0,
      xrayScore: 0,
      fundusScore: 0,
      samplesInspected: 0,
      accepted: false,
      summary: "샘플 이미지를 해석할 수 없습니다.",
    };
  }

  const xrayScore = metrics.reduce((sum, item) => sum + item.xrayScore, 0) / metrics.length;
  const fundusScore = metrics.reduce((sum, item) => sum + item.fundusScore, 0) / metrics.length;
  const detectedDomain =
    xrayScore > fundusScore + 0.08 ? "xray" : fundusScore > xrayScore + 0.08 ? "fundus" : "unknown";
  const compatibilityScore =
    expectedDomain === "xray"
      ? xrayScore
      : expectedDomain === "fundus"
        ? fundusScore
        : Math.max(xrayScore, fundusScore);
  const accepted =
    expectedDomain === "unknown"
      ? true
      : compatibilityScore >= 0.58 && (detectedDomain === expectedDomain || detectedDomain === "unknown");

  return {
    expectedDomain,
    detectedDomain,
    compatibilityScore: Number(compatibilityScore.toFixed(4)),
    xrayScore: Number(xrayScore.toFixed(4)),
    fundusScore: Number(fundusScore.toFixed(4)),
    samplesInspected: metrics.length,
    accepted,
    summary: `expected=${expectedDomain}, detected=${detectedDomain}, score=${compatibilityScore.toFixed(2)}`,
  };
}
