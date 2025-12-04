#!/bin/bash

echo "======================================"
echo "  HELIOS 프로젝트 설치 시작"
echo "======================================"
echo ""

# Node.js 버전 확인
if ! command -v node &> /dev/null
then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "https://nodejs.org/ 에서 Node.js를 다운로드하여 설치해주세요."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js 버전: $NODE_VERSION"

# npm 버전 확인
NPM_VERSION=$(npm -v)
echo "✅ npm 버전: $NPM_VERSION"
echo ""

# 의존성 설치
echo "📦 의존성 패키지 설치 중..."
echo ""
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "  ✅ 설치가 완료되었습니다!"
    echo "======================================"
    echo ""
    echo "다음 명령어로 개발 서버를 시작하세요:"
    echo ""
    echo "  npm run dev"
    echo ""
    echo "브라우저에서 http://localhost:5173 으로 접속하세요."
    echo ""
else
    echo ""
    echo "======================================"
    echo "  ❌ 설치 중 오류가 발생했습니다."
    echo "======================================"
    echo ""
    echo "다음을 시도해보세요:"
    echo "1. node_modules 폴더와 package-lock.json 파일 삭제"
    echo "2. npm install 명령어 재실행"
    echo ""
    exit 1
fi
