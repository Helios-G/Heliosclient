export interface ContributedModelDetail {
  id: string;
  version: string;
  sessionTitle: string;
  completedAt: string;
  status: string;
  modelArchitecture: string;
  finalAccuracy: number;
  finalLoss: number;
  totalRounds: number;
  participatingUsers: number;
  trainingDuration: string;
  startTime: string;
  endTime: string;
  dataType: string;
  algorithm: string;
  notes: string;
  source?: "contribution" | "download";
  trainingHistory: Array<{
    round: number;
    accuracy: number;
    loss: number;
  }>;
}

export const mockContributedModels: ContributedModelDetail[] = [
  {
    id: "contrib-chexpert-v1",
    version: "v1.0",
    sessionTitle: "폐렴 진단 연합학습",
    completedAt: "2026-03-28",
    status: "완료",
    modelArchitecture: "CheXpert-Light (Custom CNN)",
    finalAccuracy: 0.942,
    finalLoss: 0.1562,
    totalRounds: 9,
    participatingUsers: 4,
    trainingDuration: "18분 42초",
    startTime: "2026-03-28 14:10:00",
    endTime: "2026-03-28 14:28:42",
    dataType: "X-ray",
    algorithm: "FedAvg",
    notes: "흉부 X-ray 데이터 기반으로 학습이 완료된 기여 모델입니다.",
    source: "contribution",
    trainingHistory: [
      { round: 1, accuracy: 0.71, loss: 0.542 },
      { round: 2, accuracy: 0.79, loss: 0.421 },
      { round: 3, accuracy: 0.84, loss: 0.336 },
      { round: 4, accuracy: 0.87, loss: 0.281 },
      { round: 5, accuracy: 0.89, loss: 0.241 },
      { round: 6, accuracy: 0.91, loss: 0.209 },
      { round: 7, accuracy: 0.925, loss: 0.188 },
      { round: 8, accuracy: 0.936, loss: 0.171 },
      { round: 9, accuracy: 0.942, loss: 0.1562 },
    ],
  },
  {
    id: "contrib-chexpert-v11",
    version: "v1.1",
    sessionTitle: "CheXpert 데이터 학습",
    completedAt: "2026-03-24",
    status: "완료",
    modelArchitecture: "CheXpert-Light (Custom CNN)",
    finalAccuracy: 0.931,
    finalLoss: 0.1748,
    totalRounds: 7,
    participatingUsers: 3,
    trainingDuration: "15분 09초",
    startTime: "2026-03-24 09:02:00",
    endTime: "2026-03-24 09:17:09",
    dataType: "X-ray",
    algorithm: "FedAvg",
    notes: "기존 모델을 업데이트한 기여 버전입니다.",
    source: "contribution",
    trainingHistory: [
      { round: 1, accuracy: 0.69, loss: 0.603 },
      { round: 2, accuracy: 0.75, loss: 0.492 },
      { round: 3, accuracy: 0.81, loss: 0.387 },
      { round: 4, accuracy: 0.86, loss: 0.301 },
      { round: 5, accuracy: 0.89, loss: 0.243 },
      { round: 6, accuracy: 0.917, loss: 0.201 },
      { round: 7, accuracy: 0.931, loss: 0.1748 },
    ],
  },
  {
    id: "contrib-dr-v2",
    version: "v2.0",
    sessionTitle: "안저 이미지 DR 분류",
    completedAt: "2026-03-20",
    status: "완료",
    modelArchitecture: "DR-Classifier (ResNet50)",
    finalAccuracy: 0.908,
    finalLoss: 0.2214,
    totalRounds: 8,
    participatingUsers: 5,
    trainingDuration: "22분 11초",
    startTime: "2026-03-20 16:30:00",
    endTime: "2026-03-20 16:52:11",
    dataType: "Fundus",
    algorithm: "FedAdam",
    notes: "당뇨망막병증 분류를 위한 안저 이미지 기반 기여 모델입니다.",
    source: "contribution",
    trainingHistory: [
      { round: 1, accuracy: 0.61, loss: 0.711 },
      { round: 2, accuracy: 0.68, loss: 0.598 },
      { round: 3, accuracy: 0.74, loss: 0.486 },
      { round: 4, accuracy: 0.79, loss: 0.397 },
      { round: 5, accuracy: 0.83, loss: 0.334 },
      { round: 6, accuracy: 0.86, loss: 0.291 },
      { round: 7, accuracy: 0.887, loss: 0.254 },
      { round: 8, accuracy: 0.908, loss: 0.2214 },
    ],
  },
];

export const mockDownloadModels: ContributedModelDetail[] = [
  {
    id: "chexnet-v1",
    version: "v1.0",
    sessionTitle: "CheXNet (DenseNet121)",
    completedAt: "2025-12-04",
    status: "배포중",
    modelArchitecture: "DenseNet121",
    finalAccuracy: 0.942,
    finalLoss: 0.156,
    totalRounds: 12,
    participatingUsers: 6,
    trainingDuration: "2시간 30분",
    startTime: "2025-12-04 10:00:00",
    endTime: "2025-12-04 12:30:00",
    dataType: "X-ray",
    algorithm: "FedAvg",
    notes: "흉부 X-ray 14가지 질환을 진단할 수 있는 고성능 모델입니다. (Stanford CheXpert 기반)",
    source: "download",
    trainingHistory: [
      { round: 1, accuracy: 0.58, loss: 0.812 },
      { round: 2, accuracy: 0.66, loss: 0.703 },
      { round: 3, accuracy: 0.74, loss: 0.585 },
      { round: 4, accuracy: 0.8, loss: 0.472 },
      { round: 5, accuracy: 0.84, loss: 0.388 },
      { round: 6, accuracy: 0.872, loss: 0.321 },
      { round: 7, accuracy: 0.894, loss: 0.269 },
      { round: 8, accuracy: 0.908, loss: 0.228 },
      { round: 9, accuracy: 0.921, loss: 0.201 },
      { round: 10, accuracy: 0.931, loss: 0.183 },
      { round: 11, accuracy: 0.937, loss: 0.169 },
      { round: 12, accuracy: 0.942, loss: 0.156 },
    ],
  },
  {
    id: "resnet-50",
    version: "v1.0",
    sessionTitle: "ResNet-50 (Pneumonia)",
    completedAt: "2025-11-20",
    status: "배포중",
    modelArchitecture: "ResNet-50",
    finalAccuracy: 0.915,
    finalLoss: 0.208,
    totalRounds: 10,
    participatingUsers: 4,
    trainingDuration: "1시간 48분",
    startTime: "2025-11-20 13:00:00",
    endTime: "2025-11-20 14:48:00",
    dataType: "X-ray",
    algorithm: "FedAdam",
    notes: "폐렴 진단에 특화된 경량화 모델입니다. 빠른 추론 속도가 장점입니다.",
    source: "download",
    trainingHistory: [
      { round: 1, accuracy: 0.55, loss: 0.781 },
      { round: 2, accuracy: 0.63, loss: 0.672 },
      { round: 3, accuracy: 0.7, loss: 0.558 },
      { round: 4, accuracy: 0.76, loss: 0.451 },
      { round: 5, accuracy: 0.81, loss: 0.369 },
      { round: 6, accuracy: 0.848, loss: 0.304 },
      { round: 7, accuracy: 0.874, loss: 0.263 },
      { round: 8, accuracy: 0.892, loss: 0.237 },
      { round: 9, accuracy: 0.904, loss: 0.219 },
      { round: 10, accuracy: 0.915, loss: 0.208 },
    ],
  },
  {
    id: "skin-cancer-v2",
    version: "v2.0",
    sessionTitle: "DermNet (Skin Cancer)",
    completedAt: "2025-10-15",
    status: "배포중",
    modelArchitecture: "DermNet-CNN",
    finalAccuracy: 0.898,
    finalLoss: 0.244,
    totalRounds: 11,
    participatingUsers: 5,
    trainingDuration: "2시간 05분",
    startTime: "2025-10-15 09:30:00",
    endTime: "2025-10-15 11:35:00",
    dataType: "Dermoscopy",
    algorithm: "FedAvg",
    notes: "피부 병변 이미지를 분석하여 악성 흑색종을 분류합니다.",
    source: "download",
    trainingHistory: [
      { round: 1, accuracy: 0.51, loss: 0.902 },
      { round: 2, accuracy: 0.6, loss: 0.781 },
      { round: 3, accuracy: 0.67, loss: 0.668 },
      { round: 4, accuracy: 0.73, loss: 0.551 },
      { round: 5, accuracy: 0.78, loss: 0.462 },
      { round: 6, accuracy: 0.818, loss: 0.389 },
      { round: 7, accuracy: 0.846, loss: 0.334 },
      { round: 8, accuracy: 0.867, loss: 0.298 },
      { round: 9, accuracy: 0.881, loss: 0.272 },
      { round: 10, accuracy: 0.891, loss: 0.255 },
      { round: 11, accuracy: 0.898, loss: 0.244 },
    ],
  },
];
