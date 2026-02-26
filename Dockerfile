# 1단계: 빌드
FROM node:18-alpine AS build
WORKDIR /app

# 1. 설정 파일들 복사 (이제 바로 현재 위치에 있음)
COPY package*.json ./

# 2. 의존성 설치
RUN npm install

# 3. 모든 소스 복사
COPY . .

# 4. 빌드 실행 (경로가 단순해짐)
RUN npx vite build --outDir dist

# 2단계: 실행 (Nginx)
FROM nginx:stable-alpine
# 빌드 결과물(/app/dist)을 Nginx 경로로 복사
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]