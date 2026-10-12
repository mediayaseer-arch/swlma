FROM node:22-bookworm-slim AS build

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

COPY . .

# VITE_* values are public build-time configuration. Pass them with
# --build-arg when the production client needs them.
ARG VITE_APP_ID=""
ARG VITE_OAUTH_PORTAL_URL=""
ARG VITE_FRONTEND_FORGE_API_URL=""
ARG VITE_FRONTEND_FORGE_API_KEY=""
ENV VITE_APP_ID="${VITE_APP_ID}"
ENV VITE_OAUTH_PORTAL_URL="${VITE_OAUTH_PORTAL_URL}"
ENV VITE_FRONTEND_FORGE_API_URL="${VITE_FRONTEND_FORGE_API_URL}"
ENV VITE_FRONTEND_FORGE_API_KEY="${VITE_FRONTEND_FORGE_API_KEY}"

RUN pnpm build

FROM node:22-bookworm-slim AS runtime

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable \
    && groupadd --system app \
    && useradd --system --gid app --create-home app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches ./patches
RUN pnpm install --prod --frozen-lockfile

COPY --from=build --chown=app:app /app/dist ./dist

EXPOSE 3000
USER app
CMD ["pnpm", "start"]