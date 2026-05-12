export type PlaygroundModelId = "chexpert-browser" | "dr-browser";

export type PlaygroundModelLoadType = "graph" | "layers";
export type PlaygroundInferenceProfile = "chexpert-xray" | "dr-fundus";

export interface PlaygroundModelSpec {
  id: PlaygroundModelId;
  title: string;
  subtitle: string;
  description: string;
  domainLabel: string;
  modelPath: string;
  loadType: PlaygroundModelLoadType;
  inferenceProfile: PlaygroundInferenceProfile;
  classes: string[];
  imageAccept: string;
}

export const CHEXPERT_CLASSES = [
  "No Finding",
  "Enlarged Cardiomediastinum",
  "Cardiomegaly",
  "Lung Opacity",
  "Lung Lesion",
  "Edema",
  "Consolidation",
  "Pneumonia",
  "Atelectasis",
  "Pneumothorax",
  "Pleural Effusion",
  "Pleural Other",
  "Fracture",
  "Support Devices",
] as const;

export const DR_CLASSES = [
  "No DR",
  "Mild",
  "Moderate",
  "Severe",
  "Proliferative",
] as const;

export const PLAYGROUND_MODELS: PlaygroundModelSpec[] = [
  {
    id: "chexpert-browser",
    title: "CheXpert X-ray",
    subtitle: "흉부 X-ray 14클래스",
    description: "브라우저에서 바로 로드되는 CheXpert 진단 모델입니다.",
    domainLabel: "X-ray",
    modelPath: "/models/chexpert_tfjs/model.json",
    loadType: "graph",
    inferenceProfile: "chexpert-xray",
    classes: [...CHEXPERT_CLASSES],
    imageAccept: "image/*",
  },
  {
    id: "dr-browser",
    title: "DR Fundus",
    subtitle: "당뇨망막병증 5단계",
    description: "브라우저에서 바로 로드되는 안저 DR 분류 모델입니다.",
    domainLabel: "Fundus",
    modelPath: "/models/dr_tfjs_manual/model.json",
    loadType: "layers",
    inferenceProfile: "dr-fundus",
    classes: [...DR_CLASSES],
    imageAccept: "image/*",
  },
];

export function getPlaygroundModelById(modelId: string | null | undefined) {
  return PLAYGROUND_MODELS.find((item) => item.id === modelId) ?? PLAYGROUND_MODELS[0];
}
