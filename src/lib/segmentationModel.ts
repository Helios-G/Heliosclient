import * as tf from "@tensorflow/tfjs";
import { ensureGpuBackend } from "./tfBackend";
import { XRAY_LESION_SEGMENTATION_MODEL_PATH, XRAY_SEGMENTATION_SIZE } from "./taskTypes";

let cachedModel: tf.GraphModel | tf.LayersModel | null = null;
let cachedError: Error | null = null;

// rose-500 (Tailwind) — 마스크 표시 색상
const MASK_COLOR_R = 244;
const MASK_COLOR_G = 63;
const MASK_COLOR_B = 94;

// soft 마스크 (number[][], [0,1]) → rose 색 + alpha PNG dataURL
// threshold 이상이면 픽셀에 rose 색을 입히고, alpha 는 강도에 비례
function imageDataUrlFromSoftMask(soft: number[][], threshold = 0.4): string {
  const h = soft.length;
  const w = soft[0]?.length ?? 0;
  if (h === 0 || w === 0) return "";

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imageData = ctx.createImageData(w, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const v = soft[y][x];
      const show = v >= threshold;
      const offset = (y * w + x) * 4;
      imageData.data[offset] = show ? MASK_COLOR_R : 0;
      imageData.data[offset + 1] = show ? MASK_COLOR_G : 0;
      imageData.data[offset + 2] = show ? MASK_COLOR_B : 0;
      imageData.data[offset + 3] = show ? Math.round(Math.min(1, v) * 200) : 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

// Occlusion-based saliency: 입력 일부를 가린 후 target class score 의 감소량으로 영역 중요도 측정
// 그래디언트 미사용 → CheXpert(GraphModel) / DR(LayersModel, nested InceptionV3) 모두 동작
async function computeOcclusionSaliency(
  model: tf.LayersModel | tf.GraphModel,
  inputTensor: tf.Tensor,
  classIdx: number,
  layout: "nchw" | "nhwc",
  toProbs: (raw: tf.Tensor) => tf.Tensor,
  gridSize = 12,
  onProgress?: (done: number, total: number) => void,
): Promise<number[][]> {
  const shape = inputTensor.shape;
  const H = layout === "nchw" ? (shape[2] as number) : (shape[1] as number);
  const W = layout === "nchw" ? (shape[3] as number) : (shape[2] as number);

  const getScore = async (input: tf.Tensor): Promise<number> => {
    const raw = model.predict(input) as tf.Tensor;
    const probs = toProbs(raw);
    const arr = await probs.data();
    if (probs !== raw) probs.dispose();
    raw.dispose();
    return arr[classIdx];
  };

  const baseScore = await getScore(inputTensor);
  const cellH = Math.max(1, Math.floor(H / gridSize));
  const cellW = Math.max(1, Math.floor(W / gridSize));
  const total = gridSize * gridSize;
  const saliency: number[][] = [];

  let done = 0;
  for (let gy = 0; gy < gridSize; gy += 1) {
    const row: number[] = [];
    const y0 = gy * cellH;
    const y1 = Math.min(H, y0 + cellH);
    for (let gx = 0; gx < gridSize; gx += 1) {
      const x0 = gx * cellW;
      const x1 = Math.min(W, x0 + cellW);

      const maskData = new Float32Array(H * W);
      maskData.fill(1);
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          maskData[y * W + x] = 0;
        }
      }

      const occluded = tf.tidy(() => {
        const mask2d = tf.tensor2d(maskData, [H, W]);
        const mask = layout === "nchw"
          ? mask2d.reshape([1, 1, H, W])
          : mask2d.reshape([1, H, W, 1]);
        return inputTensor.mul(mask);
      });

      const score = await getScore(occluded);
      occluded.dispose();
      row.push(baseScore - score);

      done += 1;
      if (onProgress && (done % 8 === 0 || done === total)) onProgress(done, total);
      await tf.nextFrame();
    }
    saliency.push(row);
  }

  // 음수(가렸을 때 score 가 오히려 오른 영역) 는 0 clip, max 로 [0,1] 정규화
  const flat = saliency.flat();
  const maxV = Math.max(...flat);
  const range = maxV > 0 ? maxV : 1;
  return saliency.map((r) => r.map((v) => Math.max(0, v) / range));
}

// CheXpert / DR 공통: occlusion saliency 로 pseudo-segmentation 마스크 PNG dataURL 생성
export async function predictPseudoSegmentationMask(
  model: tf.LayersModel | tf.GraphModel,
  inputTensor: tf.Tensor,
  classIdx: number,
  layout: "nchw" | "nhwc",
  toProbs: (raw: tf.Tensor) => tf.Tensor,
  options?: {
    gridSize?: number;
    threshold?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<string> {
  const gridSize = options?.gridSize ?? 12;
  const threshold = options?.threshold ?? 0.4;
  const saliency = await computeOcclusionSaliency(
    model,
    inputTensor,
    classIdx,
    layout,
    toProbs,
    gridSize,
    options?.onProgress,
  );
  return imageDataUrlFromSoftMask(saliency, threshold);
}

// ─────────────────────────────────────────────────────────────────────
// LabelingSegmentationPage 용 전용 X-ray lesion segmentation 모델
// /playground 의 pseudo-segmentation 과는 별도 — 학습 데이터 라벨링 시
// 사전학습된 U-Net 으로 마스크를 자동 생성해 라벨링 워크플로우를 가속화
// ─────────────────────────────────────────────────────────────────────

function imageDataUrlFromBinaryMask(mask: Uint8Array, size = XRAY_SEGMENTATION_SIZE): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imageData = ctx.createImageData(size, size);
  for (let index = 0; index < mask.length; index += 1) {
    const lesion = mask[index] > 0;
    const offset = index * 4;
    imageData.data[offset] = lesion ? MASK_COLOR_R : 0;
    imageData.data[offset + 1] = lesion ? MASK_COLOR_G : 0;
    imageData.data[offset + 2] = lesion ? MASK_COLOR_B : 0;
    imageData.data[offset + 3] = lesion ? 200 : 0;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function loadXrayLesionSegmentationModel() {
  if (cachedModel) return cachedModel;
  if (cachedError) throw cachedError;

  try {
    await ensureGpuBackend();
    cachedModel = await tf.loadGraphModel(XRAY_LESION_SEGMENTATION_MODEL_PATH);
    return cachedModel;
  } catch (graphError) {
    try {
      cachedModel = await tf.loadLayersModel(XRAY_LESION_SEGMENTATION_MODEL_PATH);
      return cachedModel;
    } catch (layersError) {
      cachedError = layersError instanceof Error ? layersError : new Error(String(layersError || graphError));
      throw cachedError;
    }
  }
}

export async function predictXrayLesionMask(imageUrl: string, threshold = 0.5): Promise<string> {
  const model = await loadXrayLesionSegmentationModel();
  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  const input = tf.tidy(() => {
    const canvas = document.createElement("canvas");
    canvas.width = XRAY_SEGMENTATION_SIZE;
    canvas.height = XRAY_SEGMENTATION_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to create preprocessing canvas");
    ctx.drawImage(image, 0, 0, XRAY_SEGMENTATION_SIZE, XRAY_SEGMENTATION_SIZE);
    return tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0);
  });

  const rawOutput = model.predict(input) as tf.Tensor | tf.Tensor[];
  const output = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;
  const probabilities = await output.reshape([XRAY_SEGMENTATION_SIZE * XRAY_SEGMENTATION_SIZE]).data();
  const binaryMask = new Uint8Array(probabilities.length);
  for (let index = 0; index < probabilities.length; index += 1) {
    binaryMask[index] = probabilities[index] >= threshold ? 1 : 0;
  }

  input.dispose();
  output.dispose();
  if (Array.isArray(rawOutput)) {
    rawOutput.forEach((tensor) => {
      if (tensor !== output) tensor.dispose();
    });
  }

  return imageDataUrlFromBinaryMask(binaryMask);
}
