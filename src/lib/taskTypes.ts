export type HeliosTaskType = "classification" | "segmentation";

export const CLASSIFICATION_TASK: HeliosTaskType = "classification";
export const SEGMENTATION_TASK: HeliosTaskType = "segmentation";
export const XRAY_LESION_SEGMENTATION_LABEL = "Lesion Mask";
export const XRAY_LESION_SEGMENTATION_LABELS = [XRAY_LESION_SEGMENTATION_LABEL];
export const XRAY_LESION_SEGMENTATION_MODEL_PATH = "/models/xray_lesion_seg_tfjs/model.json";
export const XRAY_SEGMENTATION_SIZE = 256;

function readClassNames(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw.classNames)) return raw.classNames;
  if (Array.isArray(raw.classList)) return raw.classList;
  if (Array.isArray(raw.labelClassList)) return raw.labelClassList;
  if (typeof raw.labelClassList === "string") {
    return raw.labelClassList.split(",").map((item: string) => item.trim()).filter(Boolean);
  }
  return [];
}

export function inferTaskType(raw: any): HeliosTaskType {
  const explicitTask = String(raw?.taskType ?? raw?.learningTask ?? "").toLowerCase();
  if (explicitTask === SEGMENTATION_TASK) return SEGMENTATION_TASK;
  if (explicitTask === CLASSIFICATION_TASK) return CLASSIFICATION_TASK;

  const classes = readClassNames(raw).map((item) => item.toLowerCase());
  if (classes.length === 1 && classes[0] === XRAY_LESION_SEGMENTATION_LABEL.toLowerCase()) {
    return SEGMENTATION_TASK;
  }

  return CLASSIFICATION_TASK;
}

export function isSegmentationTask(raw: any): boolean {
  return inferTaskType(raw) === SEGMENTATION_TASK;
}

export function labelForTaskType(taskType: HeliosTaskType): string {
  return taskType === SEGMENTATION_TASK ? "Segmentation" : "Classification";
}
