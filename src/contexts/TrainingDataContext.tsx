import React, { createContext, useContext, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

interface TrainingDataContextType {
  xTrain: tf.Tensor | null;
  yTrain: tf.Tensor | null;
  setTrainingData: (x: tf.Tensor, y: tf.Tensor) => void;
}

const TrainingDataContext = createContext<TrainingDataContextType | undefined>(undefined);

export function TrainingDataProvider({ children }: { children: React.ReactNode }) {
  const [xTrain, setXTrain] = useState<tf.Tensor | null>(null);
  const [yTrain, setYTrain] = useState<tf.Tensor | null>(null);

  const setTrainingData = (x: tf.Tensor, y: tf.Tensor) => {
    setXTrain(x);
    setYTrain(y);
  };

  return (
    <TrainingDataContext.Provider value={{ xTrain, yTrain, setTrainingData }}>
      {children}
    </TrainingDataContext.Provider>
  );
}

// 👇 이 부분이 빠져있거나 export가 없으면 에러가 납니다!
export function useTrainingData() {
  const context = useContext(TrainingDataContext);
  if (context === undefined) {
    throw new Error('useTrainingData must be used within a TrainingDataProvider');
  }
  return context;
}