import * as tf from "@tensorflow/tfjs";
import { FlowerClient } from "./flwr";

export class MyFlowerClient extends FlowerClient {
  constructor() {
    super();
    this.model = tf.sequential();
    
    // 모델 정의 (기존과 동일)
    this.model.add(tf.layers.conv2d({ inputShape: [224, 224, 3], kernelSize: 3, filters: 16, activation: 'relu', padding: 'same' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu', padding: 'same' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu', padding: 'same' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'same' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.conv2d({ kernelSize: 3, filters: 64, activation: 'relu', padding: 'same' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.flatten());
    this.model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    this.model.add(tf.layers.dense({units: 14, activation: 'sigmoid'}));

    this.xTrain = null; this.yTrain = null;
    this.xVal = null; this.yVal = null;
    this.onEpochEnd = null; 
    
    console.log("🏥 CheXpert 경량화 모델 초기화 완료!");
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
    
    if (parameters && parameters.length > 0) {
        try {
            const originalWeights = this.model.getWeights();
            const tensorParams = parameters.map((param, i) => {
                const shape = originalWeights[i].shape;
                return tf.tensor(param, shape, 'float32');
            });
            this.model.setWeights(tensorParams);
            console.log("📥 글로벌 모델 가중치 적용 완료");
        } catch (err) { console.error("⚠️ 가중치 적용 실패"); }
    }

    this.model.compile({ 
        optimizer: tf.train.adam(0.0005), 
        loss: "binaryCrossentropy", 
        metrics: ["accuracy"]
    });

    if (!this.xTrain || !this.yTrain) return { parameters: [], num_examples: 0, metrics: {} };

    // 마지막 에폭의 메트릭을 저장할 변수
    let lastAcc = 0;
    let lastLoss = 0;

    const history = await this.model.fit(this.xTrain, this.yTrain, {
      epochs: 1, 
      batchSize: 8,
      validationData: [this.xVal, this.yVal],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          lastAcc = logs.val_accuracy || logs.val_acc || logs.accuracy || 0;
          lastLoss = logs.val_loss || logs.loss || 0;

          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, lastLoss, lastAcc);
          }
          console.log(`Epoch ${epoch+1}: [Train] Loss=${logs.loss.toFixed(4)} | [Test] Loss=${lastLoss.toFixed(4)} Acc=${lastAcc.toFixed(4)}`);
        }
      }
    });
    
    // 🌟 가중치 추출 시에도 비동기 처리 적용
    const newWeights = await this.getParameters();
    
    // 🌟 에러 해결: metrics 반환 시 undefined 방지 로직 적용
    return { 
        parameters: newWeights, 
        num_examples: this.xTrain.shape[0], 
        metrics: { accuracy: lastAcc } 
    };
  }

  async evaluate(parameters, config) {
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

    const result = this.model.evaluate(this.xVal, this.yVal);
    const loss = result[0].dataSync()[0];
    const accuracy = result[1].dataSync()[0];

    return { loss, num_examples: this.xVal.shape[0], metrics: { accuracy } };
  }
}