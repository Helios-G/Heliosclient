# HELIOS 로컬 설치 및 실행 가이드

HELIOS 연합학습 플랫폼을 로컬 환경에서 실행하는 방법입니다.

## 📋 사전 요구사항

- **Node.js**: 18.x 이상 (권장: 20.x)
- **npm**: 9.x 이상 (Node.js와 함께 설치됨)

Node.js가 설치되어 있지 않다면 [https://nodejs.org/](https://nodejs.org/)에서 다운로드하세요.

## 🚀 설치 및 실행 방법

### 1. 프로젝트 다운로드

GitHub에서 프로젝트를 다운로드하거나 클론합니다:

```bash
# Git을 사용하는 경우
git clone <repository-url>
cd helios

# 또는 ZIP 파일을 다운로드하여 압축 해제 후 해당 폴더로 이동
```

### 2. 의존성 패키지 설치

#### 자동 설치 (권장)

**Windows 사용자:**
```cmd
setup.bat
```
명령 프롬프트(CMD)를 열고 프로젝트 폴더에서 `setup.bat`를 실행하거나 파일을 더블클릭하세요.

**Mac/Linux 사용자:**
```bash
chmod +x setup.sh
./setup.sh
```
터미널을 열고 프로젝트 폴더에서 위 명령어를 실행하세요.

#### 수동 설치

자동 설치가 작동하지 않는 경우:

```bash
npm install
```

이 과정은 몇 분 정도 소요될 수 있습니다.

### 3. 개발 서버 실행

다음 명령어로 개발 서버를 시작합니다:

```bash
npm run dev
```

성공적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
VITE v6.0.7  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 4. 브라우저에서 접속

브라우저를 열고 `http://localhost:5173/`로 접속하면 HELIOS 플랫폼을 사용할 수 있습니다.

## 🛠️ 기타 명령어

### 프로덕션 빌드

배포용 파일을 생성하려면:

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 프로덕션 빌드 미리보기

빌드된 파일을 로컬에서 미리 확인:

```bash
npm run preview
```

### 코드 린팅

코드 품질 검사:

```bash
npm run lint
```

## 📁 프로젝트 구조

```
helios/
├── src/
│   └── main.tsx              # 애플리케이션 진입점
├── App.tsx                   # 메인 App 컴포넌트 및 라우팅
├── components/               # 재사용 가능한 컴포넌트
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx
│   ├── SignUpPage.tsx       # 회원가입 컴포넌트
│   └── ui/                   # UI 컴포넌트 라이브러리
├── pages/                    # 페이지 컴포넌트
│   ├── HomePage.tsx
│   ├── SignUpPage.tsx
│   ├── LoginPage.tsx
│   ├── SessionListPage.tsx
│   ├── SessionCreatePage.tsx
│   ├── LabelingAutoPage.tsx
│   ├── LabelingManualPage.tsx
│   ├── SessionTrainingPage.tsx
│   ├── SessionResultsPage.tsx
│   ├── ModelDownloadPage.tsx
│   ├── ModelDetailPage.tsx
│   ├── MyPage.tsx
│   └── AdminPage.tsx
├── contexts/                 # React Context
│   └── AuthContext.tsx
├── styles/
│   └── globals.css          # 전역 스타일 및 Tailwind CSS
├── index.html               # HTML 진입점
├── package.json             # 프로젝트 의존성 및 스크립트
├── vite.config.ts           # Vite 설정
├── tsconfig.json            # TypeScript 설정
├── setup.bat                # Windows 자동 설치 스크립트
├── setup.sh                 # Mac/Linux 자동 설치 스크립트
├── QUICKSTART.md            # 빠른 시작 가이드
└── README.md                # 프로젝트 설명
```

## 🎨 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 및 개발 서버
- **React Router** - 라우팅
- **Tailwind CSS** - 스타일링
- **Radix UI** - 접근성 있는 UI 컴포넌트
- **Recharts** - 차트 라이브러리
- **Lucide React** - 아이콘

## 🔑 테스트 계정

### 일반 병원 계정
- 이메일: `test@hospital.com`
- 비밀번호: 아무거나 입력 (데모용)

### 관리자 계정
- 이메일: `admin@helios.com`
- 비밀번호: 아무거나 입력 (데모용)

## 📱 주요 기능

1. **회원가입 및 로그인** - 병원 정보 등록 및 인증
   - 심플하고 깔끔한 UI
   - 병원명, 이메일, 비밀번호, 사업자번호 입력
   
2. **세션 생성** - 연합학습 세션 생성
   - 데이터 형식 선택 (X-ray, CT, MRI 등)
   - 질환 클래스 설정
   - **CheXpert 프리셋**: 버튼 클릭 한 번으로 14개 클래스 자동 설정
     * 특이사항 없음 (정상)
     * 심장종격동 비대
     * 심장비대증
     * 폐 혼탁
     * 폐 병변
     * 폐부종
     * 폐경화
     * 폐렴
     * 무기폐
     * 기흉
     * 흉수
     * 기타 흉막 질환
     * 골절
     * 의료 보조 장치
   
3. **학습 참여** - 세션 참여 및 라벨링
   - **자동 라벨링**: 폴더 업로드 후 AI가 자동으로 라벨 지정
   - **수동 라벨링**: 버튼 클릭으로 빠른 라벨링
   - 폴더 업로드 지원 (파일 하나하나 선택 필요 없음)
   
4. **학습 진행** - 실시간 학습 진행 상황 모니터링
   - 실시간 정확도 및 손실 그래프
   - 참여 병원 현황
   
5. **모델 다운로드** - 학습된 모델 다운로드
   - 상세한 모델 정보 제공
   - CSV 라벨링 결과 다운로드
   
6. **관리자 페이지** - 회원 승인, 병원 관리, 모델 관리

## ⚠️ 주의사항

- 이 프로젝트는 **프론트엔드 데모**입니다. 실제 백엔드 서버 없이 작동합니다.
- 모든 데이터는 브라우저 메모리에만 저장되며, 페이지를 새로고침하면 초기화됩니다.
- 실제 파일 업로드는 로컬에서만 처리되며 서버로 전송되지 않습니다.
- CSV 다운로드는 시뮬레이션된 데이터를 사용합니다.
- 폴더 업로드 기능은 최신 브라우저에서만 작동합니다 (Chrome, Edge 권장).

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

다른 포트를 사용하려면:

```bash
npm run dev -- --port 3000
```

### 의존성 설치 오류

캐시를 삭제하고 다시 설치:

**Windows:**
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

**Mac/Linux:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 브라우저 호환성

모던 브라우저(Chrome, Firefox, Safari, Edge 최신 버전)를 사용하세요.
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 폴더 업로드가 작동하지 않는 경우

- Chrome, Edge 브라우저 사용을 권장합니다.
- Firefox와 Safari는 폴더 업로드 지원이 제한적일 수 있습니다.

## 🆕 최신 업데이트

### 회원가입/로그인 UI 개선
- 더 심플하고 깔끔한 디자인
- 필수 정보만 입력하는 간소화된 폼
- 직관적인 인증 프로세스

### 세션 생성 - CheXpert 프리셋
- CheXpert 14개 클래스를 버튼 클릭 한 번으로 자동 설정
- 데이터 형식 자동 설정 (X-ray)
- 한글 클래스명 사용으로 가독성 향상

### 라벨링 개선
- **버튼 방식 라벨링**: Select 드롭다운 대신 버튼 클릭으로 빠른 라벨링
- **폴더 업로드**: 파일 하나하나 선택 대신 폴더 전체 업로드 가능
- 더 직관적이고 빠른 워크플로우

## 📞 지원

문제가 발생하거나 질문이 있으면 이슈를 등록해주세요.

## 📄 라이선스

이 프로젝트는 데모 목적으로 제작되었습니다.

---

**HELIOS** - 병원 대상 연합학습 서비스
