# ============================================================
# Pricify — Frontend React/Vite
# Multi-stage Dockerfile : Builder (Node) + Runner (Nginx Alpine)
# ============================================================

# ──────────────────────────────────────────
# STAGE 1 : builder
# Compile l'application Vite en fichiers statiques
# ──────────────────────────────────────────
FROM node:20-alpine AS builder

# Installer pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copier les manifestes en premier (optimisation du cache Docker)
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Copier les sources
COPY . .

# Argument de build pour passer l'URL de l'API au moment du build Vite
# Usage: docker build --build-arg VITE_API_URL=https://api.pricify.com/api .
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Lancer le build Vite → génère le dossier dist/
RUN pnpm run build

# ──────────────────────────────────────────
# STAGE 2 : runner
# Sert les fichiers statiques via Nginx Alpine
# Image finale ultra-légère (~25 Mo)
# ──────────────────────────────────────────
FROM nginx:alpine AS runner

# Supprimer la config Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier notre configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers compilés depuis le builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port HTTP
EXPOSE 80

# Nginx démarre en foreground (requis pour Docker)
CMD ["nginx", "-g", "daemon off;"]
