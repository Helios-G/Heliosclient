# GitHub Actions에서 빌드 후 결과물만 올라옴
FROM nginx:stable-alpine

# Nginx 설정 파일 복사
COPY default.conf /etc/nginx/conf.d/default.conf

# Actions에서 빌드된 결과물 복사
COPY build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]