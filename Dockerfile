# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Deploy Convex functions and build the Vite frontend in one step.
# CONVEX_DEPLOY_KEY must be passed as a build argument (see .env.example).
ARG CONVEX_DEPLOY_KEY
ENV CONVEX_DEPLOY_KEY=$CONVEX_DEPLOY_KEY

RUN npx convex deploy \
  --cmd 'npm run build' \
  --cmd-url-env-var-name VITE_CONVEX_URL \
  -y

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
