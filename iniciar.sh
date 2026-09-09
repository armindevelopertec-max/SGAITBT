#!/usr/bin/env bash
#
# iniciar.sh — Levanta todo el Sistema de Gestión Académica (SGA)
#
# 1. Verifica prerequisitos (node, npm, docker)
# 2. Levanta infraestructura: PostgreSQL, MinIO, pgAdmin, Redis
# 3. Espera a que los servicios estén listos
# 4. Instala dependencias si falta node_modules
# 5. Compila el backend y ejecuta el seed (admin / admin2026)
# 6. Arranca backend (NestJS) y frontend (Next.js) en modo desarrollo
#
# Uso:   ./iniciar.sh          (todo en primer plano, Ctrl+C detiene)
#        ./iniciar.sh --background  (servidores en segundo plano)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKGROUND="${1:-}"

# ---------- Colores ----------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[SGA]${NC} $*"; }
ok()    { echo -e "${GREEN}[SGA] ✔ $*${NC}"; }
warn()  { echo -e "${YELLOW}[SGA] ⚠ $*${NC}"; }
err()   { echo -e "${RED}[SGA] ✖ $*${NC}" >&2; }
fail()  { err "$*"; exit 1; }

# ---------- Idiomas: helpers ----------
command_exists() { command -v "$1" >/dev/null 2>&1; }

# ---------- Cargar variables de entorno ----------
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
  ok "Variables de entorno cargadas desde $ROOT_DIR/.env"
else
  warn "No se encontró $ROOT_DIR/.env, usando valores por defecto"
fi

DB_USER="${DB_USER:-sga_admin}"
DB_PASSWORD="${DB_PASSWORD:-sga_secret_2026}"
DB_NAME="${DB_NAME:-sga_itbt}"
DB_PORT="${DB_PORT:-5432}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
JWT_SECRET="${JWT_SECRET:-sga_itbt_jwt_secret_key_2026}"

# ---------- 1. Prerequisitos ----------
info "Verificando prerequisitos..."
command_exists docker  || fail "Docker no está instalado."
command_exists docker compose || command_exists docker-compose || fail "Docker Compose no está disponible."
command_exists node    || fail "Node.js no está instalado."
command_exists npm     || fail "npm no está instalado."

COMPOSE_CMD="docker compose"
docker compose version >/dev/null 2>&1 || COMPOSE_CMD="docker-compose"
ok "Prerequisitos OK"

cd "$ROOT_DIR"

# ---------- 2. Infraestructura ----------
info "Levantando infraestructura (PostgreSQL, MinIO, pgAdmin, Redis)..."
$COMPOSE_CMD up -d postgres minio pgadmin redis

# ---------- 3. Esperar servicios ----------
info "Esperando servicios..."
timeout_docker_health() {
  local name="$1"
  for i in $(seq 1 60); do
    local state
    state="$(docker inspect --format '{{.State.Health.Status}}' "$name" 2>/dev/null || echo notfound)"
    [[ "$state" == "healthy" ]] && { ok "$name listo"; return 0; }
    sleep 2
  done
  warn "Tiempo de espera agotado para $name. Continuando..."
  return 0
}
timeout_docker_health sga_postgres
timeout_docker_health sga_minio
timeout_docker_health sga_redis

# ---------- 4. Dependencias ----------
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  info "Instalando dependencias del backend..."
  cd "$BACKEND_DIR" && npm install
fi
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  info "Instalando dependencias del frontend..."
  cd "$FRONTEND_DIR" && npm install
fi
ok "Dependencias listas"

# ---------- 5. Compilar y sembrar ----------
info "Compilando backend..."
cd "$BACKEND_DIR"
npm run build

info "Ejecutando seed de datos iniciales..."
export NODE_ENV=development
export DB_HOST=localhost DB_PORT="$DB_PORT" DB_USER="$DB_USER" DB_PASSWORD="$DB_PASSWORD" DB_NAME="$DB_NAME"
export PORT="$BACKEND_PORT" JWT_SECRET="$JWT_SECRET"
npm run seed || warn "El seed falló (¿la BD ya estaba inicializada?). Se continúa."
printf '\n'

# ---------- 6. Servidores ----------
# Liberar puertos de servidores previos que quedaron en ejecución
if command_exists fuser; then
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    if fuser "$port"/tcp >/dev/null 2>&1; then
      warn "Puerto $port ocupado, liberándolo..."
      fuser -k "$port"/tcp >/dev/null 2>&1 || true
      sleep 2
    fi
  done
else
  warn "fuser no disponible; no se pudo liberar puertos ocupados"
fi

PIDS=()
cleanup() {
  info "Deteniendo servidores..."
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  exit 0
}
trap cleanup INT TERM

start_server() {
  local name="$1" dir="$2" cmd="$3" tmp="$ROOT_DIR/.logs"
  mkdir -p "$tmp"
  info "Arrancando $name (log: $tmp/$name.log)..."
  (cd "$dir" && eval "$cmd" >"$tmp/$name.log" 2>&1) &
  PIDS+=("$!")
}

START_BACKEND="${START_BACKEND:-PORT=$BACKEND_PORT npm run start:dev}"
start_server backend "$BACKEND_DIR" "$START_BACKEND"
START_FRONTEND="${START_FRONTEND:-npm run dev -- -p $FRONTEND_PORT}"
start_server frontend "$FRONTEND_DIR" "$START_FRONTEND"

sleep 6

warn ""
warn "Instituto Tecnológico \"Boliviana de Tecnología\""
info  "  Frontend:        http://localhost:$FRONTEND_PORT"
info  "  API backend:     http://localhost:$BACKEND_PORT/api"
info  "  Consola MinIO:   http://localhost:${MINIO_CONSOLE_PORT:-9001}"
info  "  pgAdmin:         http://localhost:${PGADMIN_PORT:-5050}"
info  "  Usuario:         admin   |   Contraseña: admin2026"
info  "  Logs:            $ROOT_DIR/.logs/"
info  "  Detener:         Ctrl+C (u omitir con --background para que sigan corriendo)"
warn ""

if [[ "$BACKGROUND" == "--background" ]]; then
  info "Servidores en segundo plano. Logs en $ROOT_DIR/.logs/"
  exit 0
fi

wait