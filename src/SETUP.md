# HELIOS 프로젝트 설정 가이드

## 📦 필수 패키지 설치

```bash
# React Router 설치
npm install react-router-dom

# TypeScript 타입 (필요시)
npm install -D @types/react-router-dom

# Tailwind CSS (아직 없다면)
npm install -D tailwindcss@4 postcss autoprefixer

# shadcn/ui 의존성
npm install class-variance-authority clsx tailwind-merge

# UI 라이브러리들
npm install lucide-react
npm install @radix-ui/react-slot
npm install @radix-ui/react-label
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
```

## 📁 프로젝트 구조

```
src/
├── App.tsx                    # 메인 라우터 설정
├── styles/
│   └── globals.css           # 전역 스타일
├── components/               # 재사용 가능한 컴포넌트
│   ├── Layout.tsx           # 공통 레이아웃 (Header + Footer)
│   ├── Header.tsx           # 헤더
│   ├── Footer.tsx           # 푸터
│   ├── HeroSection.tsx      # 히어로 섹션
│   ├── FeaturesSection.tsx  # 기능 섹션
│   ├── GuideSection.tsx     # 가이드 섹션
│   ├── SignUpPage.tsx       # 회원가입 폼
│   ├── figma/
│   │   └── ImageWithFallback.tsx
│   └── ui/                  # shadcn/ui 컴포넌트들
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── card.tsx
│       └── ...
└── pages/                   # 페이지 컴포넌트들
    ├── HomePage.tsx         # 메인 페이지
    └── SignUpPage.tsx       # 회원가입 페이지
```

## 🚀 새 페이지 추가하는 방법

### 1. 페이지 컴포넌트 생성
`src/pages/LoginPage.tsx` 파일을 만듭니다:

```tsx
export function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h2>로그인 페이지</h2>
      {/* 로그인 폼 내용 */}
    </div>
  );
}
```

### 2. App.tsx에 라우트 추가

```tsx
import { LoginPage } from "./pages/LoginPage";

// Routes 안에 추가:
<Route path="/login" element={<LoginPage />} />
```

### 3. 완료! ✅

이제 `/login` URL로 접속하면 로그인 페이지가 표시됩니다.

## 🎨 브랜드 색상

- 주황색: `#FF9500`
- 갈색: `#6B3131`

스타일 적용 예시:
```tsx
<h1 style={{ color: '#FF9500' }}>HELIOS</h1>
<Button style={{ backgroundColor: '#FF9500' }}>버튼</Button>
```

## 🔗 네비게이션 사용법

### Link 컴포넌트 사용
```tsx
import { Link } from "react-router-dom";

<Link to="/signup">회원가입</Link>
```

### useNavigate 훅 사용
```tsx
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('/signup')}>
      회원가입
    </button>
  );
}
```

## 📝 앞으로 추가할 페이지 아이디어

- `/login` - 로그인 페이지
- `/dashboard` - 병원 대시보드
- `/services` - 서비스 소개 페이지
- `/guide` - 상세 사용법 페이지
- `/contact` - 문의하기 페이지
- `/mypage` - 마이페이지
- `/admin` - 관리자 페이지

## 💡 팁

1. **공통 레이아웃이 필요 없는 페이지**는 Layout 밖에 배치:
```tsx
<BrowserRouter>
  <Routes>
    {/* Layout 없는 페이지 */}
    <Route path="/fullscreen" element={<FullscreenPage />} />
    
    {/* Layout 있는 페이지들 */}
    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
    </Route>
  </Routes>
</BrowserRouter>
```

2. **중첩 라우팅**도 가능합니다:
```tsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />
  <Route path="settings" element={<Settings />} />
  <Route path="profile" element={<Profile />} />
</Route>
```

3. **404 페이지** 추가:
```tsx
<Route path="*" element={<NotFoundPage />} />
```
