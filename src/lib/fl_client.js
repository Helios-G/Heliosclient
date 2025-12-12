import * as tf from "@tensorflow/tfjs";
import { FlowerClient } from "./flwr";

export class MyFlowerClient extends FlowerClient {
  constructor() {
    super();
    
    this.model = tf.sequential();
    
    // 모델 구조 (기존과 동일)
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

    // 컴파일
    this.model.compile({ 
        optimizer: tf.train.adam(0.0001), 
        loss: "binaryCrossentropy", 
        metrics: ["binaryAccuracy"] // 정확도 메트릭
    });
    
    this.trainData = null;
    this.trainLabel = null;
    this.onEpochEnd = null; 
  }

  setRoundCallback(callback) {
    this.onEpochEnd = callback;
  }

  addData(imageTensor, labelTensor) {
    if (!imageTensor || !labelTensor) return;
    this.trainData = imageTensor;
    this.trainLabel = labelTensor;
    console.log(`📸 학습 데이터 로드됨: ${imageTensor.shape}`);
  }

  async getParameters() {
    return this.model.getWeights().map((w) => Array.from(w.dataSync()));
  }

  async fit(parameters, config) {
    console.log("💪 로컬 학습 시작...");
    
    // 1. 가중치 적용
    if (parameters && parameters.length > 0) {
        try {
            const originalWeights = this.model.getWeights();
            const tensorParams = parameters.map((param, i) => {
                const shape = originalWeights[i].shape;
                return tf.tensor(param).reshape(shape);
            });
            this.model.setWeights(tensorParams);
            console.log("📥 글로벌 모델 가중치 적용 완료");
        } catch (err) { console.error("⚠️ 가중치 적용 실패"); }
    }

    // 2. 데이터 준비 (가짜 데이터 삭제!)
    if (!this.trainData || !this.trainLabel) {
        console.error("⛔ [치명적 오류] 학습 데이터가 없습니다! 학습을 중단합니다.");
        // 빈 결과 반환해서 서버가 이 클라이언트를 무시하게 함 (혹은 에러 발생)
        throw new Error("No Training Data");
    }

    let xs = this.trainData;
    let ys = this.trainLabel;

    // NCHW -> NHWC 변환 방어 로직
    if (xs.shape[1] === 3 && xs.shape[2] === 224) {
        xs = xs.transpose([0, 2, 3, 1]);
    }

    // 데이터 분할 (Train 80% / Val 20%)
    const numSamples = xs.shape[0];
    let xTrain, yTrain, xVal, yVal;

    if (numSamples > 1) {
        const splitIdx = Math.floor(numSamples * 0.8);
        xTrain = xs.slice([0,0,0,0], [splitIdx, 224, 224, 3]);
        yTrain = ys.slice([0,0], [splitIdx, 14]);
        xVal = xs.slice([splitIdx,0,0,0], [numSamples-splitIdx, 224, 224, 3]);
        yVal = ys.slice([splitIdx,0], [numSamples-splitIdx, 14]);
    } else {
        // 데이터가 1개면 학습/검증 동일하게
        xTrain = xs; yTrain = ys;
        xVal = xs; yVal = ys;
    }

    // 3. 학습 수행
    const history = await this.model.fit(xTrain, yTrain, {
      epochs: 1, 
      batchSize: 8,
      validationData: [xVal, yVal],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // ✅ [수정] 정확도 키값 확실하게 찾기
          // binaryAccuracy가 없으면 acc를 찾고, 그것도 없으면 0
          const valAcc = logs.val_binaryAccuracy || logs.val_acc || 0;
          const valLoss = logs.val_loss || 0;
          
          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, valLoss, valAcc);
          }
          console.log(`Epoch ${epoch+1}: Val_Loss=${valLoss.toFixed(4)}, Val_Acc=${valAcc.toFixed(4)}`);
        }
      }
    });
    
    const newWeights = this.model.getWeights().map((w) => Array.from(w.dataSync()));
    return { parameters: newWeights, num_examples: xTrain.shape[0], metrics: {} };
  }

  async evaluate(parameters, config) {
    return { loss: 10, num_examples: 1, metrics: { accuracy: 0 } };
  }
}