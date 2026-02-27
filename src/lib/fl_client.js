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

    // 여기서는 컴파일하지 않음 (fit에서 매번 리셋)
    
    this.xTrain = null; this.yTrain = null;
    this.xVal = null; this.yVal = null;
    this.onEpochEnd = null; 
    
    console.log("🏥 CheXpert 경량화 모델 초기화 완료!");
  }

  setRoundCallback(callback) {
    this.onEpochEnd = callback;
  }

  // ✅ [수정] 4개 인자를 받도록 변경 (Train/Test 분리된 상태 그대로 수신)
  addData(xTrain, yTrain, xTest, yTest) {
    // 기존 데이터 메모리 해제 (메모리 누수 방지)
    if (this.xTrain) {
        this.xTrain.dispose(); this.yTrain.dispose();
        if (this.xVal) { this.xVal.dispose(); this.yVal.dispose(); }
    }

    this.xTrain = xTrain;
    this.yTrain = yTrain;
    this.xVal = xTest;
    this.yVal = yTest;

    // NHWC(높이, 너비, 채널) 포맷 확인 및 변환
    if (this.xTrain && this.xTrain.shape[1] === 3 && this.xTrain.shape[2] === 224) {
        console.log("🔄 Train 데이터 포맷 변환 (NCHW -> NHWC)");
        this.xTrain = this.xTrain.transpose([0, 2, 3, 1]);
    }
    if (this.xVal && this.xVal.shape[1] === 3 && this.xVal.shape[2] === 224) {
        console.log("🔄 Test 데이터 포맷 변환 (NCHW -> NHWC)");
        this.xVal = this.xVal.transpose([0, 2, 3, 1]);
    }

    console.log(`📊 데이터 로드 완료: Train ${this.xTrain.shape[0]}장 / Test ${this.xVal ? this.xVal.shape[0] : 0}장`);
  }

  async getParameters() {
    return this.model.getWeights().map((w) => Array.from(w.dataSync()));
  }

  async fit(parameters, config) {
    console.log("💪 로컬 학습 시작...");
    
    // 1. 서버 가중치 적용
    if (parameters && parameters.length > 0) {
        try {
            const originalWeights = this.model.getWeights();
            const tensorParams = parameters.map((param, i) => {
                const shape = originalWeights[i].shape;
                return tf.tensor(param).reshape(shape);
            });
            this.model.setWeights(tensorParams);
            console.log("📥 글로벌 모델 가중치 적용 완료");
        } catch (err) { console.error("⚠️ 가중치 적용 실패 (무시하고 진행)"); }
    }

    // ✅ 2. Optimizer 리셋 (매 라운드 새로 컴파일해야 학습이 꼬이지 않음)
    this.model.compile({ 
        optimizer: tf.train.adam(0.0005), 
        loss: "binaryCrossentropy", 
        metrics: ["binaryAccuracy"] 
    });

    if (!this.xTrain || !this.yTrain) {
        console.warn("⚠️ 학습 데이터가 없습니다!");
        return { parameters: [], num_examples: 0, metrics: {} };
    }

    // 3. 디버깅용 예측 (학습 전 상태 확인)
    if (this.xVal) {
        const samplePred = this.model.predict(this.xVal.slice([0,0,0,0], [1, 224, 224, 3]));
        console.log("🕵️‍♂️ [진단] 학습 전 예측값 샘플:", samplePred.dataSync().slice(0, 5));
    }

    // 4. 학습 수행
    const history = await this.model.fit(this.xTrain, this.yTrain, {
      epochs: 1, 
      batchSize: 8, // 메모리 상황에 따라 조절 (4~16)
      validationData: (this.xVal && this.yVal) ? [this.xVal, this.yVal] : null,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // Validation 값이 있으면 그걸 쓰고, 없으면 Train 값 사용
          let valAcc = logs.val_binaryAccuracy || logs.val_acc || logs.binaryAccuracy || 0;
          let valLoss = logs.val_loss || logs.loss || 0;

          if (isNaN(valLoss)) {
              console.error(`🚨 Epoch ${epoch+1}: Loss is NaN! (학습 발산)`);
              valLoss = 99.99;
          }

          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, valLoss, valAcc);
          }
          console.log(`Epoch ${epoch+1}: [Train] Loss=${logs.loss.toFixed(4)} | [Test] Loss=${valLoss.toFixed(4)} Acc=${valAcc.toFixed(4)}`);
        }
      }
    });
    
    const newWeights = this.model.getWeights().map((w) => Array.from(w.dataSync()));
    return { parameters: newWeights, num_examples: this.xTrain.shape[0], metrics: {} };
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