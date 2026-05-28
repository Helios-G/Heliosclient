import * as tf from "@tensorflow/tfjs";
import { ensureGpuBackend } from "./tfBackend";
import { XRAY_LESION_SEGMENTATION_MODEL_PATH, XRAY_SEGMENTATION_SIZE } from "./taskTypes";

let cachedModel: tf.GraphModel | tf.LayersModel | null = null;
let cachedError: Error | null = null;

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

function imageDataUrlFromBinaryMask(mask: Uint8Array, size = XRAY_SEGMENTATION_SIZE): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imageData = ctx.createImageData(size, size);
  for (let index = 0; index < mask.length; index += 1) {
    const value = mask[index] > 0 ? 255 : 0;
    const offset = index * 4;
    imageData.data[offset] = value;
    imageData.data[offset + 1] = value;
    imageData.data[offset + 2] = value;
    imageData.data[offset + 3] = value > 0 ? 255 : 0;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
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
