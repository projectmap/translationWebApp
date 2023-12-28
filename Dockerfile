FROM node:18-alpine as base

# FROM --platform=linux/amd64 $NODE_IMAGE AS dev

FROM base AS builder

ARG COMMIT_SHA
ENV NUXT_PUBLIC_BUILD_VERSION=$COMMIT_SHA

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copy in the rest of our application code
COPY . .

RUN npm run build

FROM base as prod

WORKDIR /app

ARG COMMIT_SHA
ENV NUXT_PUBLIC_BUILD_VERSION=$COMMIT_SHA

COPY --from=builder /app/.nuxt/ .nuxt/
COPY --from=builder /app/.output/ .output/
COPY static/ static/

EXPOSE 3000

# ENTRYPOINT ["npm","run"]
# CMD ["start", "--", "-p", "3000", "-H", "0.0.0.0"]
ENTRYPOINT ["node"]
CMD ["./.output/server/index.mjs"]
