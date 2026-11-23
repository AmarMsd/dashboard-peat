FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
# Variabel VITE_* harus tersedia saat build:
#   docker build --build-arg VITE_N8N_CHAT_URL=https://... -t peatguard-dashboard .
ARG VITE_N8N_CHAT_URL
ARG VITE_API_BASE
ENV VITE_N8N_CHAT_URL=$VITE_N8N_CHAT_URL
ENV VITE_API_BASE=$VITE_API_BASE
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:24-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]
