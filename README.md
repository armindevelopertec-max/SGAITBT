# SGA · Sistema de Gestión Académica

Sistema de Gestión Académica para el **Instituto Tecnológico "Boliviana de Tecnología"**.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 15 (App Router) + React 19 · Puerto `3000` |
| Backend | NestJS + TypeORM + PostgreSQL · Puerto `3001` |
| Bases de datos | PostgreSQL `5432` · Redis `6379` |
| Object storage | MinIO API `9000` · Consola `9001` |
| Administración DB | pgAdmin `5050` |

## Configuración

Copia las variables de entorno de ejemplo y ajusta los valores (especialmente las contraseñas):

```bash
cp .env.example .env
```

Las variables obligatorias (`DB_PASSWORD`, `JWT_SECRET`, `MINIO_ROOT_PASSWORD`, `PGADMIN_PASSWORD`, etc.) no tienen valores por defecto: si faltan, Docker Compose falla con un mensaje claro en lugar de usar secretos inseguros.

## Inicio rápido

```bash
docker compose up -d postgres minio pgadmin redis
npm run seed --prefix backend          # crea admin + datos base
npm run start:dev --prefix backend     # backend en :3001
npm run dev --prefix frontend          # frontend en :3000
```

Para levantar todo el stack (incluye backend, frontend contenerizados y ejecuta el **seed** automáticamente tras iniciar PostgreSQL):

```bash
docker compose up -d
```

El seed es un servicio one-shot (`seed`) que corre una sola vez y termina; es idempotente y no hace nada si los datos ya existen.

## Calidad: lint, typecheck y tests

```bash
npm run lint       --prefix backend     # ESLint (TypeScript)
npm run typecheck  --prefix backend     # tsc --noEmit
npm test           --prefix backend     # tests unitarios (Jest)
npm run test:e2e   --prefix backend    # smoke e2e (requiere PostgreSQL local)
cd frontend && npm run lint             # ESLint (Next.js)
npx tsc --noEmit                        # typecheck del frontend
```

## Credenciales

| Acceso | Valor |
| --- | --- |
| Usuario administrador | `admin` |
| Contraseña | `admin2026` |
| Base de datos | `sga_itbt` / usuario `sga_admin` / `sga_secret_2026` |
| MinIO | `minioadmin` / `minio_secret_2026` |
| pgAdmin | `admin@sga-itbt.com` / `pgadmin2026` |

## Estructura

```
SGAITBT/
├── backend/          # API NestJS (21 módulos)
├── frontend/         # SPA Next.js (24 páginas)
├── database/
│   └── init.sql      # Script de inicialización de la BD
├── docker-compose.yml
└── .env              # Credenciales y puertos
```

## Módulos Backend (21)

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Institution | Configuración institucional |
| 2 | Career | Carreras (AUT, MEC) |
| 3 | Academic Period | Gestiones académicas |
| 4 | Subject | Materias |
| 5 | Student | Estudiantes |
| 6 | Person | Personas |
| 7 | Employee | Empleados (docentes, administrativos) |
| 8 | User | Usuarios y cuentas |
| 9 | Auth | Autenticación JWT |
| 10 | Deposit | Depósitos/verificación |
| 11 | Enrollment | Matrículas |
| 12 | Subject Assignment | Asignación de materias |
| 13 | Parallel | Paralelos (A/B/C) |
| 14 | Attendance | Asistencia |
| 15 | Grade | Calificaciones |
| 16 | Academic History | Historial académico |
| 17 | Dashboard | Paneles de control |
| 18 | RBAC | Roles y permisos |
| 19 | Audit | Auditoría |
| 20 | MinIO | Archivos (fotos, vouchers) |
| 21 | Calendar Event | Eventos del calendario |

## Páginas Frontend (24)

- **Gestión**: students, enrollments, deposits, grades, attendance
- **Académico**: subjects, subject-assignments, student-subject-assignments, subject-designations, academic-management
- **Administración**: users, persons, employees, roles, careers, academic-periods
- **Reportes**: reports, centralizers, certificates
- **Sistema**: institution, graduation, audit, dashboard

API bajo `http://localhost:3001/api` (JWT Bearer, 24 h).
