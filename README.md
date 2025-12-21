
# HELIOS 🏥

**웹 기반 경량화 의료 연합학습(Federated Learning) 플랫폼**

## 📖 프로젝트 소개

HELIOS는 고성능 인프라가 없는 중소병원도 웹 브라우저만으로 참여할 수 있는 **실시간 연합학습 플랫폼**입니다.
**TensorFlow.js**를 활용한 **On-device Learning** 기술을 통해 의료 데이터가 병원 외부로 유출되지 않도록 보호하며, **Python Flower 서버**와 연동하여 다기관 협력 AI 모델을 구축합니다.

### 🎯 핵심 기술 및 특징

- **🔒 완벽한 프라이버시 (Data Locality)**: 원본 데이터는 브라우저(Local)를 절대 떠나지 않으며, 암호화된 가중치(Weight)만 서버로 전송됩니다.
- **⚡ Zero-Install 환경**: 별도의 소프트웨어 설치 없이 웹 브라우저 접속만으로 학습에 참여할 수 있습니다.
- **🤖 Client-side 오토라벨링**: CheXpert로 사전 학습된 경량화 모델(DenseNet121 기반)이 브라우저 내에서 X-ray를 즉시 분석하여 라벨링을 자동화합니다.
- **🤝 실시간 연합학습**: Python WebSocket 서버와 연동하여 `FedAvg`, `FedAdam` 등의 알고리즘으로 글로벌 모델을 실시간 업데이트합니다.
- **📊 실시간 대시보드**: 학습 진행 상황(Loss, Accuracy)을 실시간 그래프로 시각화합니다.

---

## 🚀 빠른 시작 (Quick Start)

이 프로젝트는 **Backend(Python)**와 **Frontend(React)**를 각각 실행해야 합니다.

### 1. 사전 요구사항 (Prerequisites)
- **Node.js** 18.x 이상
- **Python** 3.9 이상

### 2. Backend 서버 실행 (Python)
연합학습을 중개하는 중앙 서버를 먼저 실행합니다.

```bash
# 서버 폴더로 이동
cd federated/server

# 가상환경 생성 및 활성화 (권장)
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)

# 의존성 설치
pip install flwr websockets numpy torch torchvision

# 서버 실행 (Port: 8080)
python simple_server.py
```

### 3. Frontend 클라이언트 실행 (React)
사용자 인터페이스 및 학습 엔진을 실행합니다.

```bash
# 클라이언트 폴더로 이동
cd Heliosclient

# 의존성 설치
npm install

# 개발 서버 실행 (Port: 5173)
npm run dev
```

브라우저에서 **http://localhost:5173** 접속

---

## 🎨 기술 스택 (Tech Stack)

### Frontend & AI Engine
- **Framework**: React 18, TypeScript, Vite
- **AI/ML**: **TensorFlow.js** (WebGL Backend)
- **Styling**: Tailwind CSS, Radix UI
- **Visualization**: Recharts

### Backend & Orchestration
- **Language**: Python 3.9+
- **FL Framework**: **Flower (Flwr)** (Custom WebSocket Implementation)
- **Communication**: WebSockets (Asyncio)
- **Computation**: NumPy, PyTorch (for model conversion)

---

## 📁 프로젝트 구조

```
HELIOS/
├── federated/
│   └── server/               # 🐍 Python 연합학습 서버
│       ├── simple_server.py  # WebSocket 기반 FL 서버 (FedAvg/FedAdam)
│       ├── convert.py        # PyTorch -> TF.js 모델 변환 스크립트
│       └── saved_models/     # 학습된 글로벌 모델 저장소 (.npz)
│
├── Heliosclient/             # ⚛️ React 웹 클라이언트
│   ├── public/
│   │   └── models/           # 변환된 TF.js 모델 파일 (CheXpert)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── fl_client.js  # TF.js 기반 로컬 학습 로직 (CNN 모델)
│   │   │   └── flwr/         # Flower WebSocket 통신 모듈
│   │   ├── pages/            # 주요 페이지 (라벨링, 학습, 결과 등)
│   │   ├── contexts/         # 전역 상태 관리 (데이터, 세션)
│   │   └── ...
│   └── ...
└── ...
```

---

## 💡 주요 기능 시연

### 1. 세션 생성 및 알고리즘 선택
- 학습 목표에 따라 **FedAvg** (기본) 또는 **FedAdam** (Non-IID 특화) 알고리즘을 선택하여 세션을 생성할 수 있습니다.
- CheXpert 기준 14개 질환 클래스를 자동으로 설정하는 프리셋을 제공합니다.

### 2. 하이브리드 라벨링 (Auto + Manual)
- **자동 라벨링**: 이미지를 업로드하면 브라우저 내장 AI가 320x320 해상도로 분석하여 즉시 라벨을 제안합니다.
- **수동 검수**: 의료진이 AI의 결과를 확인하고 수정할 수 있으며, 확정된 데이터는 학습용 텐서(Tensor)로 변환됩니다.

### 3. 웹 기반 연합학습 (Web-FL)
- **데이터 파이프라인**: 이미지(Canvas) → 텐서 변환(224x224) → 정규화 → 배치 처리.
- **학습 프로세스**:
  1. 서버로부터 글로벌 가중치 수신
  2. 브라우저(GPU)에서 로컬 데이터로 학습 수행
  3. 갱신된 가중치를 서버로 전송
  4. 실시간 Loss/Accuracy 그래프 업데이트

### 4. 결과 분석 및 모델 활용
- 학습이 완료되면 최종 정확도와 손실 값을 확인하고, 학습된 모델을 다운로드하여 활용할 수 있습니다.

---

## ⚠️ 실행 시 주의사항

1. **브라우저 호환성**: WebGL 가속을 위해 **Chrome** 또는 **Edge** 브라우저 사용을 권장합니다.
2. **메모리 관리**: 대량의 이미지(100장 이상) 학습 시 브라우저 메모리 보호를 위해 배치 단위 처리가 적용되어 있습니다.
3. **서버 연결**: `[연합학습 시작]` 버튼을 누르기 전에 반드시 **Python 서버(`simple_server.py`)**가 켜져 있어야 합니다.

---

## 📄 라이선스

이 프로젝트는 교육 및 연구 목적으로 제작되었습니다.

---

**HELIOS Team** - Connecting Hospitals, Empowering AI 🏥✨
