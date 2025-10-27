# HELIOS - 병원 대상 연합학습 서비스

병원을 위한 연합학습(Federated Learning) 플랫폼입니다.

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 4. 빌드 미리보기

```bash
npm run preview
```

## 📦 주요 기능

### 사용자 기능
- ✅ 회원가입 / 로그인
- ✅ 모델 업로드 (연합학습용 로컬 모델)
- ✅ 모델 다운로드 (연합학습된 글로벌 모델)
- ✅ 회원 정보 관리
- ✅ 업로드 이력 확인

### 관리자 기능
- ✅ 회원가입 승인/거부
- ✅ 병원 이메일 도메인 화이트리스트 관리
- ✅ 병원 차단/해제
- ✅ 업로드된 모델 관리 (승인/거부)

## 🎨 브랜드 색상

- 주황색 (Primary): `#FF9500`
- 갈색 (Secondary): `#6B3131`
- 배경색: `#FFF5EB`

## 🔑 테스트 계정

### 일반 사용자
- 이메일: 아무거나 입력
- 비밀번호: 아무거나 입력

### 관리자
- 이메일: `admin@helios.com`
- 비밀번호: 아무거나 입력

## 📁 프로젝트 구조

```
src/
├── App.tsx                    # 메인 라우터
├── main.tsx                   # 엔트리 포인트
├── contexts/
│   └── AuthContext.tsx       # 인증 상태 관리
├── components/
│   ├── Layout.tsx            # 공통 레이아웃
│   ├── Header.tsx            # 헤더 (네비게이션)
│   ├── Footer.tsx            # 푸터
│   ├── HeroSection.tsx       # 메인 히어로 섹션
│   ├── FeaturesSection.tsx   # 기능 소개 섹션
│   ├── GuideSection.tsx      # 사용법 안내 섹션
│   └── ui/                   # shadcn/ui 컴포넌트들
├── pages/
│   ├── HomePage.tsx          # 메인 페이지
│   ├── SignUpPage.tsx        # 회원가입
│   ├── LoginPage.tsx         # 로그인
│   ├── MyPage.tsx            # 회원 정보
│   ├── ModelUploadPage.tsx   # 모델 업로드
│   ├── ModelDownloadPage.tsx # 모델 다운로드
│   ├── AdminPage.tsx         # 관리자 페이지
│   └── NotFoundPage.tsx      # 404 페이지
└── styles/
    └── globals.css           # 전역 스타일 (Tailwind v4)
```

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Build Tool**: Vite
- **Form Validation**: React Hook Form + Zod (예정)

## 📚 추가 문서

- [설정 가이드](./SETUP.md) - 프로젝트 설정 및 페이지 추가 방법
- [기여 가이드](./guidelines/Guidelines.md) - 개발 가이드라인

## 🔐 보안 고려사항

현재 프로젝트는 프로토타입이며, 다음 보안 기능들이 아직 구현되지 않았습니다:

- [ ] 실제 백엔드 API 연동
- [ ] JWT 기반 인증
- [ ] 비밀번호 암호화
- [ ] HTTPS 통신
- [ ] CORS 정책
- [ ] Rate Limiting
- [ ] Input Sanitization

**프로덕션 배포 전에 반드시 구현해야 합니다!**

## 📝 TODO

- [ ] Supabase 연동 (데이터베이스 + 인증)
- [ ] 실제 파일 업로드/다운로드 API
- [ ] 이메일 인증
- [ ] 비밀번호 재설정
- [ ] 대시보드 페이지
- [ ] 실시간 알림
- [ ] 차트 및 통계
- [ ] 반응형 모바일 최적화

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
