import * as tf from "@tensorflow/tfjs";

let configuredBackend: string | null = null;

export async function ensureGpuBackend() {
  if (configuredBackend && tf.getBackend() === configuredBackend) {
    return configuredBackend;
  }

  const preferredBackends = ["webgl"];

  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      await import("@tensorflow/tfjs-backend-webgpu");
      preferredBackends.unshift("webgpu");
    } catch (error) {
      console.warn("TFJS webgpu backend package unavailable, falling back to webgl", error);
    }
  }

  for (const backend of preferredBackends) {
    try {
      const success = await tf.setBackend(backend);
      if (success) {
        await tf.ready();
        configuredBackend = backend;
        console.log(`🧠 TFJS backend ready: ${backend}`);
        return backend;
      }
    } catch (error) {
      console.warn(`TFJS backend ${backend} unavailable`, error);
    }
  }

  throw new Error("사용 가능한 GPU 백엔드를 찾지 못했습니다.");
}
