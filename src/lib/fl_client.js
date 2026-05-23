import * as tf from "@tensorflow/tfjs";
import { FlowerClient } from "./flwr";
import { ensureGpuBackend } from "./tfBackend";
import { SEGMENTATION_TASK } from "./taskTypes";

const DIAGNOSTIC_SKIP_SERVER_WEIGHTS = false;

function diceCoefficient(yTrue, yPred) {
  return tf.tidy(() => {
    const smooth = tf.scalar(1e-6);
    const clipped = yPred.clipByValue(1e-7, 1 - 1e-7);
    const intersection = yTrue.mul(clipped).sum();
    const denominator = yTrue.sum().add(clipped.sum()).add(smooth);
    return intersection.mul(2).add(smooth).div(denominator);
  });
}

function iouCoefficient(yTrue, yPred) {
  return tf.tidy(() => {
    const smooth = tf.scalar(1e-6);
    const clipped = yPred.clipByValue(1e-7, 1 - 1e-7);
    const intersection = yTrue.mul(clipped).sum();
    const union = yTrue.add(clipped).sub(yTrue.mul(clipped)).sum().add(smooth);
    return intersection.add(smooth).div(union);
  });
}

function segmentationLoss(yTrue, yPred) {
  return tf.tidy(() => {
    const clipped = yPred.clipByValue(1e-7, 1 - 1e-7);
    const bce = tf.metrics.binaryCrossentropy(yTrue, clipped).mean();
    return bce.add(tf.scalar(1).sub(diceCoefficient(yTrue, clipped)));
  });
}

export class MyFlowerClient extends FlowerClient {
  constructor(options = {}) {
    super();
    this.taskType = options.taskType || "classification";
    this.model = this.taskType === SEGMENTATION_TASK
      ? this.createSegmentationModel()
      : this.createClassificationModel();

    this.xTrain = null; this.yTrain = null;
    this.xVal = null; this.yVal = null;
    this.onEpochEnd = null; 
    this.trainingMeta = null;
    this.dataProfile = null;
    
    console.log(this.taskType === SEGMENTATION_TASK
      ? "X-ray 병변 segmentation 모델 초기화 완료"
      : "CheXpert 경량화 모델 초기화 완료");
  }

  createClassificationModel() {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({ inputShape: [224, 224, 3], kernelSize: 3, filters: 16, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 14, activation: 'softmax'}));
    return model;
  }

  createSegmentationModel() {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({ inputShape: [256, 256, 3], kernelSize: 3, filters: 8, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 16, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.upSampling2d({ size: [2, 2] }));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 16, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.upSampling2d({ size: [2, 2] }));
    model.add(tf.layers.conv2d({ kernelSize: 3, filters: 8, activation: 'relu', padding: 'same' }));
    model.add(tf.layers.conv2d({ kernelSize: 1, filters: 1, activation: 'sigmoid', padding: 'same' }));
    return model;
  }

  setRoundCallback(callback) {
    this.onEpochEnd = callback;
  }

  addData(xTrain, yTrain, xTest, yTest) {
    this.xTrain = xTrain;
    this.yTrain = yTrain;
    this.xVal = xTest;
    this.yVal = yTest;
    console.log(`📊 데이터 로드 완료: Train ${this.xTrain.shape[0]}장 / Test ${this.xVal.shape[0]}장`);
    if (this.taskType === SEGMENTATION_TASK) {
      console.log("segmentation tensor shapes:", {
        xTrain: this.xTrain.shape,
        yTrain: this.yTrain.shape,
        xVal: this.xVal.shape,
        yVal: this.yVal.shape,
      });
      return;
    }
    tf.tidy(() => {
      const trainLabelSums = tf.sum(this.yTrain, 0);
      const testLabelSums = tf.sum(this.yVal, 0);
      console.log("🏷️ train label sums:", Array.from(trainLabelSums.dataSync()));
      console.log("🏷️ test label sums:", Array.from(testLabelSums.dataSync()));
      console.log("🏷️ first train labels:", this.yTrain.slice([0, 0], [Math.min(3, this.yTrain.shape[0]), -1]).arraySync());
    });
  }

  setTrainingMeta(meta) {
    this.trainingMeta = meta;
  }

  pickMetric(logs, keys, fallback = 0) {
    for (const key of keys) {
      const value = logs?.[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
    }
    return fallback;
  }

  async summarizeLocalData() {
    if (this.dataProfile || !this.xTrain) {
      return this.dataProfile;
    }

    const channelMeansTensor = tf.mean(this.xTrain, [0, 1, 2]);
    const moments = tf.moments(this.xTrain, [0, 1, 2]);
    const channelMeans = Array.from(await channelMeansTensor.data());
    const channelStddevs = Array.from(await tf.sqrt(moments.variance).data());
    channelMeansTensor.dispose();
    moments.mean.dispose();
    moments.variance.dispose();

    this.dataProfile = {
      inputShape: this.xTrain.shape,
      labelShape: this.yTrain?.shape || [],
      channelMeans: channelMeans.map((value) => Number(value.toFixed(4))),
      channelStddevs: channelStddevs.map((value) => Number(value.toFixed(4))),
    };
    return this.dataProfile;
  }

  async buildHelloPayload() {
    const profile = await this.summarizeLocalData();
    return {
      type: "client_hello",
      profile: {
        expectedDomain: this.trainingMeta?.expectedDomain || "unknown",
        detectedDomain: this.trainingMeta?.detectedDomain || "unknown",
        domainScore: this.trainingMeta?.domainScore || 0,
        trainSamples: this.xTrain?.shape?.[0] || 0,
        testSamples: this.xVal?.shape?.[0] || 0,
        sampleCount: this.trainingMeta?.sampleCount || this.xTrain?.shape?.[0] || 0,
        inputShape: profile?.inputShape || [],
        labelShape: profile?.labelShape || [],
        taskType: this.taskType,
        maskShape: this.trainingMeta?.maskShape || [],
        channelMeans: profile?.channelMeans || [],
        channelStddevs: profile?.channelStddevs || [],
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      },
    };
  }

  // 🌟 WebGPU 대응: 비동기로 가중치 추출
  async getParameters() {
    const weights = this.model.getWeights();
    const weightData = [];
    for (const w of weights) {
        const data = await w.data(); // dataSync() 대신 data() 사용
        weightData.push(Array.from(data));
    }
    return weightData;
  }

  async fit(parameters, config) {
    console.log("💪 로컬 학습 시작...");
    const fitStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    await ensureGpuBackend();
    
    if (parameters && parameters.length > 0) {
        try {
            if (DIAGNOSTIC_SKIP_SERVER_WEIGHTS) {
                console.warn("🧪 진단 모드: 서버 가중치 적용을 건너뜁니다.");
            } else {
                const originalWeights = this.model.getWeights();
                const tensorParams = parameters.map((param, i) => {
                    const shape = originalWeights[i].shape;
                    return tf.tensor(param, shape, 'float32');
                });
                this.model.setWeights(tensorParams);
                console.log("📥 글로벌 모델 가중치 적용 완료");
            }
        } catch (err) { console.error("⚠️ 가중치 적용 실패"); }
    }

    if (this.taskType === SEGMENTATION_TASK) {
      this.model.compile({
        optimizer: tf.train.adam(0.0003),
        loss: segmentationLoss,
        metrics: [diceCoefficient, iouCoefficient],
      });
    } else {
      this.model.compile({
          optimizer: tf.train.adam(0.0005),
          loss: "categoricalCrossentropy",
          metrics: ["categoricalAccuracy"]
      });
    }

    if (!this.xTrain || !this.yTrain) return { parameters: [], num_examples: 0, metrics: {} };

    // 마지막 에폭의 메트릭을 저장할 변수
    let lastAcc = 0;
    let lastLoss = 0;
    let trainLoss = 0;

    await this.model.fit(this.xTrain, this.yTrain, {
      epochs: 1, 
      batchSize: this.taskType === SEGMENTATION_TASK ? 2 : 8,
      validationData: [this.xVal, this.yVal],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          lastAcc = this.pickMetric(logs, [
            "val_diceCoefficient",
            "val_dice_coefficient",
            "diceCoefficient",
            "dice_coefficient",
            "val_iouCoefficient",
            "val_iou_coefficient",
            "val_categoricalAccuracy",
            "val_categorical_accuracy",
            "categoricalAccuracy",
            "categorical_accuracy",
            "val_accuracy",
            "val_acc",
            "accuracy",
            "acc",
          ]);
          lastLoss = this.pickMetric(logs, ["val_loss", "loss"]);

          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, lastLoss, lastAcc);
          }
          trainLoss = this.pickMetric(logs, ["loss"]);
          console.log("🧪 fit logs:", logs);
          console.log(
            `Epoch ${epoch+1}: [Train] Loss=${trainLoss.toFixed(4)} | [Test] Loss=${lastLoss.toFixed(4)} Metric=${lastAcc.toFixed(4)}`
          );
        }
      }
    });

    if (this.xVal && this.yVal) {
      const diagnostics = tf.tidy(() => {
        const rawPredictions = this.model.predict(this.xVal);
        const predictions = Array.isArray(rawPredictions) ? rawPredictions[0] : rawPredictions;
        const clippedPredictions = predictions.clipByValue(1e-7, 1 - 1e-7);
        const manualLossTensor = this.taskType === SEGMENTATION_TASK
          ? segmentationLoss(this.yVal, clippedPredictions)
          : tf.metrics.categoricalCrossentropy(this.yVal, clippedPredictions).mean();
        const manualAccuracyTensor = this.taskType === SEGMENTATION_TASK
          ? diceCoefficient(this.yVal, clippedPredictions)
          : clippedPredictions
            .argMax(-1)
            .equal(this.yVal.argMax(-1))
            .cast("float32")
            .mean();
        const predictionMin = clippedPredictions.min();
        const predictionMax = clippedPredictions.max();
        const predictionMean = clippedPredictions.mean();

        return {
          manualLoss: manualLossTensor.dataSync()[0],
          manualAccuracy: manualAccuracyTensor.dataSync()[0],
          predictionMin: predictionMin.dataSync()[0],
          predictionMax: predictionMax.dataSync()[0],
          predictionMean: predictionMean.dataSync()[0],
          predictionSample: this.taskType === SEGMENTATION_TASK
            ? clippedPredictions.slice([0, 0, 0, 0], [1, 4, 4, 1]).arraySync()
            : clippedPredictions.slice([0, 0], [1, Math.min(5, clippedPredictions.shape[1])]).arraySync(),
        };
      });

      lastLoss = Number(diagnostics.manualLoss || 0);
      lastAcc = Number(diagnostics.manualAccuracy || 0);
      console.log(
        `📏 manual metrics: val_loss=${lastLoss.toFixed(4)} val_acc=${lastAcc.toFixed(4)}`
      );
      console.log("🔬 prediction stats:", diagnostics);
    } else {
      lastLoss = trainLoss;
    }
    
    // 🌟 가중치 추출 시에도 비동기 처리 적용
    const newWeights = await this.getParameters();
    
    // 🌟 에러 해결: metrics 반환 시 undefined 방지 로직 적용
    return { 
        parameters: newWeights, 
        num_examples: this.xTrain.shape[0], 
        metrics: {
          accuracy: lastAcc,
          loss: lastLoss,
          taskType: this.taskType,
          metricLabel: this.taskType === SEGMENTATION_TASK ? "Dice" : "Accuracy",
          fitDurationMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - fitStartedAt),
        } 
    };
  }

  async evaluate(parameters, config) {
    await ensureGpuBackend();

    if (parameters && parameters.length > 0) {
        try {
            const originalWeights = this.model.getWeights();
            const tensorParams = parameters.map((param, i) => {
                const shape = originalWeights[i].shape;
                return tf.tensor(param).reshape(shape);
            });
            this.model.setWeights(tensorParams);
        } catch (e) {}
    }

    if (!this.xVal || !this.yVal) return { loss: 0, num_examples: 0, metrics: { accuracy: 0 } };

    if (this.taskType === SEGMENTATION_TASK) {
      this.model.compile({
        optimizer: tf.train.adam(0.0003),
        loss: segmentationLoss,
        metrics: [diceCoefficient, iouCoefficient],
      });
    }

    const result = this.model.evaluate(this.xVal, this.yVal);
    const resultList = Array.isArray(result) ? result : [result];
    const loss = resultList[0].dataSync()[0];
    const accuracy = resultList[1]?.dataSync()[0] || 0;

    return { loss, num_examples: this.xVal.shape[0], metrics: { accuracy, taskType: this.taskType } };
  }
}
