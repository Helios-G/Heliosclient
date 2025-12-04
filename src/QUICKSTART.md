# 🚀 HELIOS 빠른 시작 가이드

HELIOS를 5분 안에 실행하세요!

## ⚡ 빠른 시작 (3단계)

### 1️⃣ Node.js 설치 확인

터미널에서 다음 명령어로 Node.js가 설치되어 있는지 확인하세요:

```bash
node --version
```

버전이 `v18.0.0` 이상이면 OK! 설치되어 있지 않다면 [nodejs.org](https://nodejs.org/)에서 다운로드하세요.

### 2️⃣ 프로젝트 설치

**Windows 사용자:**
```cmd
setup.bat
```

**Mac/Linux 사용자:**
```bash
chmod +x setup.sh
./setup.sh
```

### 3️⃣ 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속! 🎉

---

## 🎯 기능 둘러보기

### 로그인하기
- **일반 계정**: test@hospital.com
- **관리자**: admin@helios.com
- 비밀번호: 아무거나 입력 (데모용)

### 주요 기능
1. **세션 생성** - CheXpert 버튼으로 14개 클래스 자동 설정!
2. **라벨링** - 폴더 업로드 후 버튼 클릭으로 빠른 라벨링
3. **학습 모니터링** - 실시간 정확도/손실 그래프
4. **모델 다운로드** - 학습된 모델 및 라벨링 결과 다운로드

---

## 💡 자주 묻는 질문

**Q: 포트 5173이 이미 사용 중이에요**
```bash
npm run dev -- --port 3000
```

**Q: 설치가 안 돼요**
```bash
# 캐시 삭제 후 재설치 (Windows)
rmdir /s /q node_modules
del package-lock.json
npm install

# 캐시 삭제 후 재설치 (Mac/Linux)
rm -rf node_modules package-lock.json
npm install
```

**Q: 데이터가 사라졌어요**
- 프론트엔드 데모이므로 새로고침하면 데이터가 초기화됩니다.

---

## 📖 더 자세한 정보

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - 상세 설치 가이드
- [README.md](./README.md) - 프로젝트 전체 설명

---

**HELIOS** - 병원 대상 연합학습 서비스 🏥✨
