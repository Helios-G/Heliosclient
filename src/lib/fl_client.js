import * as tf from "@tensorflow/tfjs";
import { FlowerClient } from "./flwr";

export class MyFlowerClient extends FlowerClient {
  constructor() {
    super();
    
    // 1. 모델 정의
    this.model = tf.sequential();
    
    this.model.add(tf.layers.conv2d({ 
        inputShape: [224, 224, 3], 
        kernelSize: 3, filters: 16, activation: 'relu', padding: 'same'
    }));
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
    // ✅ [수정됨] 괄호 오타 수정
    this.model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    this.model.add(tf.layers.dense({units: 14, activation: 'sigmoid'}));

    // 생성자에서는 컴파일하지 않음 (fit에서 매번 리셋)
    
    this.trainData = null;
    this.trainLabel = null;
    this.onEpochEnd = null; 
    
    console.log("🏥 CheXpert 경량화 모델 초기화 완료!");
  }

  setRoundCallback(callback) {
    this.onEpochEnd = callback;
  }

  addData(imageTensor, labelTensor) {
    this.trainData = imageTensor;
    this.trainLabel = labelTensor;
    console.log(`📸 학습 데이터 로드됨: ${imageTensor.shape}`);
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
        } catch (err) { 
            console.error("⚠️ 가중치 적용 실패:", err); 
        }
    }

    // ✅ 2. 매 라운드마다 컴파일 다시 하기 (Optimizer 리셋)
    // 학습률을 0.0001로 낮춰서 안정성 확보
    this.model.compile({ 
        optimizer: tf.train.adam(0.0001), 
        loss: "binaryCrossentropy", 
        metrics: ["binaryAccuracy"] 
    });

    // 3. 데이터 준비
    let xs, ys;
    if (this.trainData && this.trainLabel) {
        xs = this.trainData;
        ys = this.trainLabel;
        if (xs.shape[1] === 3 && xs.shape[2] === 224) {
            xs = xs.transpose([0, 2, 3, 1]);
        }
    } else {
        console.log("⚠️ 가짜 데이터 사용");
        xs = tf.randomNormal([1, 224, 224, 3]);
        ys = tf.zeros([1, 14]);
    }

    // 4. 학습 수행
    // ✅ [수정] 학습 수행 및 로그 디버깅
    const history = await this.model.fit(xs, ys, {
      epochs: 1, 
      batchSize: 1, // 배치 사이즈 1
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // 🔍 [디버깅] 로그 객체 전체를 찍어서 키값을 확인합니다.
          console.log("📊 Logs Object:", logs);

          // 가능한 모든 키를 다 검사
          const acc = logs.acc || logs.accuracy || logs.binaryAccuracy || 0;
          
          if (this.onEpochEnd) {
            this.onEpochEnd(epoch, logs.loss, acc);
          }
          console.log(`Epoch ${epoch+1} 완료: Loss=${logs.loss.toFixed(4)}, Acc=${acc.toFixed(4)}`);
        }
      }
    });
    
    const newWeights = this.model.getWeights().map((w) => Array.from(w.dataSync()));
    return { parameters: newWeights, num_examples: xs.shape[0], metrics: {} };
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

    // 평가 시에도 컴파일
    this.model.compile({ 
        optimizer: "adam", 
        loss: "binaryCrossentropy", 
        metrics: ["acc"]
    });

    let xs, ys;
    if (this.trainData && this.trainLabel) {
        xs = this.trainData;
        ys = this.trainLabel;
        if (xs.shape[1] === 3 && xs.shape[2] === 224) {
            xs = xs.transpose([0, 2, 3, 1]);
        }
    } else {
        xs = tf.randomNormal([1, 224, 224, 3]);
        ys = tf.zeros([1, 14]);
    }

    const result = this.model.evaluate(xs, ys);
    const loss = result[0].dataSync()[0];
    const accuracy = result[1].dataSync()[0];

    return { loss: loss, num_examples: xs.shape[0], metrics: { accuracy: accuracy } };
  }
}