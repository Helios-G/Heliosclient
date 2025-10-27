# 🏥 HELIOS 로컬 환경 설정 가이드

이 프로젝트를 로컬 환경에서 실행하기 위한 완전한 가이드입니다.

## 📋 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

## 🚀 빠른 시작

### 1️⃣ 파일 구조 확인

현재 파일들이 루트 디렉토리에 있다면, 다음과 같이 `src` 폴더로 이동해야 합니다:

```
프로젝트 루트/
├── index.html              # 루트에 위치
├── package.json            # 루트에 위치
├── vite.config.ts          # 루트에 위치
├── tsconfig.json           # 루트에 위치
├── eslint.config.js        # 루트에 위치
├── .gitignore              # 루트에 위치
├── README.md               # 루트에 위치
└── src/                    # ⬅️ 이 폴더 안에 소스 코드
    ├── main.tsx            # 새로 생성된 엔트리 포인트
    ├── App.tsx
    ├── components/
    ├── contexts/
    ├── pages/
    ├── styles/
    └── guidelines/
```

### 2️⃣ 파일 이동 (필요한 경우)

만약 `App.tsx`, `components/`, `pages/` 등이 루트에 있다면:

**Linux/Mac:**
```bash
# src 폴더가 없다면 생성
mkdir -p src

# 파일들을 src로 이동
mv App.tsx src/
mv components src/
mv contexts src/
mv pages src/
mv styles src/
```

**Windows (PowerShell):**
```powershell
# src 폴더 생성
New-Item -ItemType Directory -Force -Path src

# 파일들을 src로 이동
Move-Item -Path App.tsx -Destination src/
Move-Item -Path components -Destination src/
Move-Item -Path contexts -Destination src/
Move-Item -Path pages -Destination src/
Move-Item -Path styles -Destination src/
```

**또는 수동으로:**
1. `src` 폴더를 생성합니다
2. `App.tsx`, `components/`, `contexts/`, `pages/`, `styles/` 폴더를 `src/` 안으로 이동합니다
3. `guidelines/` 폴더는 `src/` 안으로 이동 (선택사항)

### 3️⃣ 의존성 설치

```bash
npm install
```

또는 yarn을 사용하는 경우:
```bash
yarn install
```

### 4️⃣ 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속하세요!

## ✅ 설치 확인

모든 것이 정상적으로 설정되었는지 확인:

1. **개발 서버 실행 확인**
   - 터미널에 "Local: http://localhost:5173" 메시지가 표시되어야 합니다
   
2. **브라우저에서 확인**
   - 메인 페이지가 정상적으로 로드되어야 합니다
   - HELIOS 로고와 오렌지색 브랜드 컬러가 보여야 합니다

3. **라우팅 확인**
   - `/login` - 로그인 페이지
   - `/signup` - 회원가입 페이지
   - `/upload` - 모델 업로드 페이지 (로그인 후)
   - `/download` - 모델 다운로드 페이지 (로그인 후)
   - `/admin` - 관리자 페이지 (admin@helios.com으로 로그인)

## 🧪 테스트 계정

### 일반 사용자로 테스트
```
이메일: test@hospital.com (또는 아무거나)
비밀번호: 아무거나
```

로그인하면:
- Header에 "서울중앙병원" 버튼이 표시됩니다
- 모델 업로드, 다운로드 페이지에 접근할 수 있습니다
- 회원 정보 페이지를 확인할 수 있습니다

### 관리자로 테스트
```
이메일: admin@helios.com
비밀번호: 아무거나
```

로그인하면:
- Header에 "HELIOS 관리자" 버튼이 표시됩니다
- **관리자 페이지** 메뉴가 오렌지색으로 나타납니다
- 회원가입 승인, 화이트리스트 관리 등을 할 수 있습니다

## 🛠️ 추가 명령어

### 프로덕션 빌드
```bash
npm run build
```
빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 빌드 미리보기
```bash
npm run preview
```
프로덕션 빌드를 로컬에서 테스트합니다.

### 린팅 (코드 검사)
```bash
npm run lint
```

## ⚠️ 자주 발생하는 문제 해결

### 1. "Cannot find module './App'" 에러
**원인:** `App.tsx`가 `src/` 폴더 안에 없음

**해결:**
```bash
# App.tsx를 src/ 폴더로 이동
mv App.tsx src/
```

### 2. "Failed to resolve import" 에러
**원인:** 의존성이 설치되지 않음

**해결:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 3. "Module not found: Can't resolve './styles/globals.css'"
**원인:** styles 폴더가 src/ 안에 없음

**해결:**
```bash
mv styles src/
```

### 4. 포트 5173이 이미 사용중
**해결:**
```bash
# 다른 포트로 실행
npm run dev -- --port 3000
```

### 5. TypeScript 에러
**원인:** 타입 정의가 누락됨

**해결:**
```bash
# React 타입 설치
npm install -D @types/react @types/react-dom
```

### 6. Tailwind 스타일이 적용되지 않음
**확인사항:**
1. `src/styles/globals.css` 파일이 존재하는지
2. `src/main.tsx`에서 `import './styles/globals.css'`가 있는지
3. Tailwind v4 설정이 `globals.css`에 있는지

## 📦 최종 폴더 구조

올바르게 설정되면 다음과 같은 구조가 됩니다:

```
프로젝트-루트/
├── node_modules/           # npm install 후 생성됨
├── dist/                   # npm run build 후 생성됨
├── src/
│   ├── main.tsx           # ✅ 엔트리 포인트
│   ├── App.tsx            # ✅ 메인 라우터
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── GuideSection.tsx
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   └── ui/            # shadcn/ui 컴포넌트들
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MyPage.tsx
│   │   ├── ModelUploadPage.tsx
│   │   ├── ModelDownloadPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── styles/
│   │   └── globals.css
│   └── guidelines/
│       └── Guidelines.md
├── index.html             # ✅ HTML 템플릿
├── package.json           # ✅ 의존성 관리
├── vite.config.ts         # ✅ Vite 설정
├── tsconfig.json          # ✅ TypeScript 설정
├── eslint.config.js       # ✅ ESLint 설정
├── .gitignore             # ✅ Git 무시 파일
├── README.md
├── SETUP.md
└── LOCAL_SETUP.md         # ✅ 이 파일
```

## 🎯 다음 단계

프로젝트가 정상적으로 실행되면:

1. **기능 테스트**
   - 회원가입/로그인 플로우
   - 모델 업로드/다운로드
   - 관리자 페이지

2. **코드 수정**
   - 원하는 기능 추가
   - UI 커스터마이징
   - API 연동 (Supabase 등)

3. **배포 준비**
   - 환경 변수 설정
   - 프로덕션 빌드 테스트
   - 호스팅 서비스 선택 (Vercel, Netlify 등)

## 💡 유용한 팁

### VS Code 확장 프로그램 추천
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Auto Rename Tag
- Prettier

### 개발 시 Hot Reload
Vite는 파일을 저장하면 자동으로 브라우저를 새로고침합니다. 변경사항을 즉시 확인할 수 있습니다!

### TypeScript 타입 체크
```bash
# 빌드하지 않고 타입만 체크
npx tsc --noEmit
```

## 📞 도움이 필요하신가요?

문제가 해결되지 않으면:
1. `package.json`이 있는지 확인
2. `node_modules` 폴더가 생성되었는지 확인
3. Node.js 버전 확인: `node --version` (18.x 이상 필요)
4. 에러 메시지를 자세히 읽어보세요

그래도 안 되면 GitHub Issues에 에러 로그와 함께 등록해주세요!

---

**즐거운 개발 되세요! 🚀**
