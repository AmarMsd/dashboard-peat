FROM node:24-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
# Variabel VITE_* dibaca saat build (opsional):
#   docker build --build-arg VITE_API_BASE=https://... -t peatguard-dashboard .
# URL chat n8n TIDAK perlu di sini; isi saat menjalankan container:
#   docker run -e N8N_CHAT_URL=https://.../webhook/<id>/chat -p 3000:3000 peatguard-dashboard
ARG VITE_API_BASE
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
