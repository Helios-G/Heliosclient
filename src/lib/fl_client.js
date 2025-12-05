import * as tf from "@tensorflow/tfjs";
import { FlowerClient } from "./flwr";

export class MyFlowerClient extends FlowerClient {
  constructor() {
    super();
    
    this.model = tf.sequential();
    this.model.add(tf.layers.conv2d({ inputShape: [224, 224, 3], kernelSize: 3, filters: 16, activation: 'relu' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: 'relu' }));
    this.model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    this.model.add(tf.layers.flatten());
    this.model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    this.model.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));

    this.model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] });
    
    this.trainData = null;
    this.trainLabel = null;
    this.onEpochEnd = null; 
    
    console.log("🏥 CNN 모델 초기화 완료!");
  }

  // ✅ [수정 핵심] 함수 이름을 setRoundCallback으로 변경!
  setRoundCallback(callback) {
    this.onEpochEnd = callback;
  }

  addData(imageTensor, labelTensor) {
    this.trainData = imageTensor;
    this.trainLabel = labelTensor;
    console.log("📸 학습 데이터가 로드되었습니다.");
  }

  async getParameters() {
    return this.model.getWeights().map((w) => Array.from(w.dataSync()));
  }

  async fit(parameters, config) {
    console.log("💪 로컬 학습 시작...");
    
    if (parameters && parameters.length > 0) {
        try {
            const tensorParams = parameters.map((p) => tf.tensor(p));
            this.model.setWeights(tensorParams);
        } catch (err) { console.error("⚠️ 가중치 무시"); }
    }

    let xs, ys;
    if (this.trainData && this.trainLabel) {
        xs = this.trainData;
        ys = this.trainLabel;
    } else {
        console.log("⚠️ 가짜 데이터 사용");
        xs = tf.randomNormal([1, 224, 224, 3]);
        ys = tf.tensor([[0]]);
    }

    const history = await this.model.fit(xs, ys, {
      epochs: 1, 
      batchSize: 1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, logs.loss, logs.acc);
          }
          console.log(`Epoch 완료: Loss=${logs.loss.toFixed(4)}`);
        }
      }
    });
    
    const newWeights = this.model.getWeights().map((w) => Array.from(w.dataSync()));
    return { parameters: newWeights, num_examples: 1, metrics: {} };
  }

  async evaluate(parameters, config) {
    const xs = tf.randomNormal([1, 224, 224, 3]);
    const ys = tf.tensor([[0]]);
    const result = this.model.evaluate(xs, ys);
    return { loss: result[0].dataSync()[0], num_examples: 1, metrics: { accuracy: result[1].dataSync()[0] } };
  }
}