import React, { createContext, useContext, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

interface FinalMetrics {
  accuracy: number;
  loss: number;
  rounds: number;
  startTime: string;
  endTime: string;
}

interface ScreeningMeta {
  expectedDomain: string;
  detectedDomain: string;
  domainScore: number;
  sampleCount: number;
}

interface TrainingDataContextType {
  // ✅ Train 데이터
  xTrain: tf.Tensor | null;
  yTrain: tf.Tensor | null;
  // ✅ [추가됨] Test 데이터
  xTest: tf.Tensor | null;
  yTest: tf.Tensor | null;
  
  // ✅ 함수 인자도 4개로 변경
  setTrainingData: (xTr: tf.Tensor, yTr: tf.Tensor, xTe: tf.Tensor, yTe: tf.Tensor) => void;
  screeningMeta: ScreeningMeta | null;
  setScreeningMeta: (meta: ScreeningMeta | null) => void;
  
  finalMetrics: FinalMetrics | null;
  setFinalMetrics: (metrics: FinalMetrics) => void;
}

const TrainingDataContext = createContext<TrainingDataContextType | undefined>(undefined);

export function TrainingDataProvider({ children }: { children: React.ReactNode }) {
  const [xTrain, setXTrain] = useState<tf.Tensor | null>(null);
  const [yTrain, setYTrain] = useState<tf.Tensor | null>(null);
  
  // ✅ Test 데이터 상태 추가
  const [xTest, setXTest] = useState<tf.Tensor | null>(null);
  const [yTest, setYTest] = useState<tf.Tensor | null>(null);
  const [screeningMeta, setScreeningMeta] = useState<ScreeningMeta | null>(null);
  
  const [finalMetrics, setFinalMetrics] = useState<FinalMetrics | null>(null);

  // ✅ 데이터 4개를 받아서 저장하는 함수로 변경
  const setTrainingData = (xTr: tf.Tensor, yTr: tf.Tensor, xTe: tf.Tensor, yTe: tf.Tensor) => {
    setXTrain(xTr);
    setYTrain(yTr);
    setXTest(xTe);
    setYTest(yTe);
  };

  return (
    <TrainingDataContext.Provider value={{ 
        xTrain, yTrain, xTest, yTest, setTrainingData,
        screeningMeta, setScreeningMeta,
        finalMetrics, setFinalMetrics 
    }}>
      {children}
    </TrainingDataContext.Provider>
  );
}

export function useTrainingData() {
  const context = useContext(TrainingDataContext);
  if (context === undefined) {
    throw new Error('useTrainingData must be used within a TrainingDataProvider');
  }
  return context;
}
