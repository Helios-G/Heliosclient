# HELIOS 🏥

병원 대상 연합학습(Federated Learning) 서비스 플랫폼

## 📖 프로젝트 소개

HELIOS는 여러 병원이 데이터를 공유하지 않고도 함께 AI 모델을 학습할 수 있는 연합학습 플랫폼입니다. 의료 데이터의 프라이버시를 보호하면서도 더 정확하고 강력한 AI 모델을 만들 수 있습니다.

### 🎯 주요 특징

- **프라이버시 보호**: 데이터를 병원 밖으로 내보내지 않음
- **협력 학습**: 여러 병원이 함께 더 나은 AI 모델 개발
- **간편한 라벨링**: 자동/수동 라벨링 지원, 폴더 업로드 기능
- **실시간 모니터링**: 학습 진행 상황을 실시간 그래프로 확인
- **CheXpert 프리셋**: X-ray 진단을 위한 14개 클래스 자동 설정
- **관리자 기능**: 회원 승인, 병원 관리, 모델 관리

## 🚀 빠른 시작

### 필요 사항
- Node.js 18.x 이상

### 설치 및 실행

**Windows:**
```cmd
setup.bat
npm run dev
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
npm run dev
```

브라우저에서 http://localhost:5173 접속

자세한 내용은 [QUICKSTART.md](./QUICKSTART.md)를 참조하세요.

## 🎨 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Routing**: React Router v7

## 📁 프로젝트 구조

```
helios/
├── src/
│   └── main.tsx              # 앱 진입점
├── App.tsx                   # 메인 App 컴포넌트, 라우팅
├── components/               # 재사용 가능한 컴포넌트
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx
│   └── ui/                   # UI 컴포넌트 라이브러리
├── pages/                    # 페이지 컴포넌트
│   ├── HomePage.tsx          # 메인 페이지
│   ├── SignUpPage.tsx        # 회원가입
│   ├── LoginPage.tsx         # 로그인
│   ├── SessionListPage.tsx   # 세션 목록
│   ├── SessionCreatePage.tsx # 세션 생성 (CheXpert 프리셋!)
│   ├── SessionJoinPage.tsx   # 세션 참여
│   ├── LabelingAutoPage.tsx  # 자동 라벨링
│   ├── LabelingManualPage.tsx # 수동 라벨링 (폴더 업로드!)
│   ├── SessionTrainingPage.tsx # 학습 진행
│   ├── SessionResultsPage.tsx  # 학습 결과
│   ├── ModelDownloadPage.tsx   # 모델 다운로드
│   ├── ModelDetailPage.tsx     # 모델 상세
│   ├── MyPage.tsx             # 회원 정보
│   └── AdminPage.tsx          # 관리자 페이지
├── contexts/
│   └── AuthContext.tsx       # 인증 컨텍스트
├── styles/
│   └── globals.css          # 전역 스타일
└── package.json
```

## 🔑 테스트 계정

### 일반 병원 계정
```
이메일: test@hospital.com
비밀번호: (아무거나)
```

### 관리자 계정
```
이메일: admin@helios.com
비밀번호: (아무거나)
```

## 💡 주요 기능

### 1. 회원가입 / 로그인
- 심플하고 깔끔한 UI
- 병원명, 이메일, 비밀번호, 사업자번호 입력
- 관리자 승인 후 이용 가능

### 2. 세션 생성
- 데이터 형식 선택 (X-ray, CT, MRI 등)
- 질환 클래스 설정
- **🆕 CheXpert 프리셋**: 버튼 클릭으로 14개 클래스 자동 설정
  - 특이사항 없음, 심장종격동 비대, 심장비대증, 폐 혼탁, 폐 병변
  - 폐부종, 폐경화, 폐렴, 무기폐, 기흉, 흉수
  - 기타 흉막 질환, 골절, 의료 보조 장치

### 3. 학습 참여
- **자동 라벨링**: AI가 자동으로 라벨 지정
- **수동 라벨링**: 
  - 🆕 버튼 클릭으로 빠른 라벨링
  - 🆕 폴더 업로드 기능 (파일 하나하나 선택 불필요)
  - 이미지 미리보기

### 4. 학습 모니터링
- 실시간 정확도 및 손실 그래프
- 참여 병원 현황
- 라운드별 진행 상황

### 5. 모델 다운로드
- 학습된 모델 다운로드
- CSV 라벨링 결과 다운로드
- 상세한 모델 정보 (구조, 성능, 참여 기관 등)

### 6. 관리자 페이지
- 회원가입 승인/거부
- 병원 화이트리스트 관리
- 병원 차단
- 업로드된 모델 관리

## 🎨 브랜드 컬러

- Primary: `#FF9500` (오렌지)
- Secondary: `#6B3131` (브라운)

## ⚠️ 중요 안내

이 프로젝트는 **프론트엔드 데모**입니다:

- ❌ 실제 백엔드 서버 없음
- ❌ 실제 파일 업로드/저장 없음
- ❌ 데이터베이스 없음 (새로고침 시 초기화)
- ✅ UI/UX 및 워크플로우 시연용
- ✅ 모든 기능 시뮬레이션 가능

## 📦 빌드

프로덕션 빌드:
```bash
npm run build
```

빌드 미리보기:
```bash
npm run preview
```

## 🔧 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 코드 린팅
npm run lint
```

## 🌐 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**권장**: 폴더 업로드 기능은 Chrome, Edge에서 가장 잘 작동합니다.

## 📚 문서

- [QUICKSTART.md](./QUICKSTART.md) - 빠른 시작 가이드
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - 상세 설치 가이드

## 🎓 학습 워크플로우

1. 회원가입 → 관리자 승인 대기
2. 세션 생성 (CheXpert 프리셋 사용 가능)
3. 다른 병원들이 세션 참여
4. 각 병원에서 데이터 라벨링 (자동/수동)
5. 연합학습 시작
6. 실시간 학습 진행 상황 모니터링
7. 학습 완료 후 모델 다운로드

## 🎯 향후 계획

- [ ] 실제 백엔드 연동
- [ ] 실제 연합학습 알고리즘 구현
- [ ] 더 많은 의료 데이터 형식 지원
- [ ] 모바일 반응형 개선
- [ ] 다국어 지원

## 📄 라이선스

이 프로젝트는 교육 및 데모 목적으로 제작되었습니다.

---

**HELIOS** - 연합학습으로 더 나은 의료 AI를 만듭니다 🏥✨

문의: helios@example.com
