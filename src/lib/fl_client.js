import * as tf from "@tensorflow/tfjs";
import { FlowerClient } from "./flwr";

export class MyFlowerClient extends FlowerClient {
  constructor() {
    super();
    
    this.model = tf.sequential();
    
    // 모델 정의 (224x224 Input)
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

    this.model.compile({ 
        optimizer: tf.train.adam(0.0005), 
        loss: "binaryCrossentropy", 
        metrics: ["binaryAccuracy"] 
    });
    
    this.xTrain = null; this.yTrain = null;
    this.xVal = null; this.yVal = null;
    this.onEpochEnd = null; 
  }

  setRoundCallback(callback) {
    this.onEpochEnd = callback;
  }

  addData(imageTensor, labelTensor) {
    if (!imageTensor || !labelTensor) return;

    if (this.xTrain) {
        this.xTrain.dispose(); this.yTrain.dispose();
        this.xVal.dispose(); this.yVal.dispose();
    }

    let xs = imageTensor;
    if (xs.shape[1] === 3 && xs.shape[2] === 224) {
        xs = xs.transpose([0, 2, 3, 1]);
    }
    let ys = labelTensor;

    const numSamples = xs.shape[0];
    if (numSamples > 1) {
        const splitIdx = Math.floor(numSamples * 0.8);
        this.xTrain = xs.slice([0,0,0,0], [splitIdx, 224, 224, 3]);
        this.yTrain = ys.slice([0,0], [splitIdx, 14]);
        this.xVal = xs.slice([splitIdx,0,0,0], [numSamples-splitIdx, 224, 224, 3]);
        this.yVal = ys.slice([splitIdx,0], [numSamples-splitIdx, 14]);
        console.log(`📊 데이터 분할 완료: Train ${splitIdx}장 / Test ${numSamples-splitIdx}장`);
    } else {
        this.xTrain = xs; this.yTrain = ys;
        this.xVal = xs; this.yVal = ys;
    }
  }

  async getParameters() {
    return this.model.getWeights().map((w) => Array.from(w.dataSync()));
  }

  async fit(parameters, config) {
    console.log("💪 로컬 학습 시작...");
    
    if (parameters && parameters.length > 0) {
        try {
            const originalWeights = this.model.getWeights();
            const tensorParams = parameters.map((param, i) => {
                const shape = originalWeights[i].shape;
                return tf.tensor(param).reshape(shape);
            });
            this.model.setWeights(tensorParams);
            console.log("📥 글로벌 모델 가중치 적용 완료");
        } catch (err) { console.error("⚠️ 가중치 적용 실패 (무시)"); }
    }

    if (!this.xTrain || !this.yTrain) {
        return { parameters: [], num_examples: 0, metrics: {} };
    }

    // ✅ [진단 로직] 학습 전에 모델이 실제로 뭐라고 예측하는지 1개만 찍어봄
    const samplePred = this.model.predict(this.xVal.slice([0,0,0,0], [1, 224, 224, 3]));
    const sampleTrue = this.yVal.slice([0,0], [1, 14]);
    
    console.log("🕵️‍♂️ [진단] 모델 예측값 샘플 (0에 가까워야 정상, 0.5 근처면 학습 안됨):");
    samplePred.print(); // 콘솔에 텐서 값 출력
    console.log("🎯 [진단] 실제 정답:");
    sampleTrue.print();

    const history = await this.model.fit(this.xTrain, this.yTrain, {
      epochs: 1, 
      batchSize: 4,
      validationData: [this.xVal, this.yVal],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          let valAcc = logs.val_binaryAccuracy ?? logs.val_acc ?? logs.binaryAccuracy ?? 0;
          let valLoss = logs.val_loss ?? logs.loss ?? 0;

          if (isNaN(valLoss)) {
              console.error(`🚨 Epoch ${epoch+1}: Loss is NaN!`);
              valLoss = 99.99;
          }

          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, valLoss, valAcc);
          }
          console.log(`Epoch ${epoch+1}/5: [Train] Loss=${logs.loss.toFixed(4)} | [Test] Loss=${valLoss.toFixed(4)} Acc=${valAcc.toFixed(4)}`);
        }
      }
    });
    
    const newWeights = this.model.getWeights().map((w) => Array.from(w.dataSync()));
    return { parameters: newWeights, num_examples: this.xTrain.shape[0], metrics: {} };
  }

  async evaluate(parameters, config) {
    return { loss: 0, num_examples: 1, metrics: { accuracy: 0 } };
  }
}