# SGA · Sistema de Gestión Académica

Sistema de Gestión Académica para el **Instituto Tecnológico Boliviana de Tecnología**.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 15 (App Router) + React 19 · Puerto `3000` |
| Backend | NestJS + TypeORM + PostgreSQL · Puerto `3001` |
| Bases de datos | PostgreSQL `5432` · Redis `6379` |
| Object storage | MinIO API `9000` · Consola `9001` |
| Administración DB | pgAdmin `5050` |

## Inicio rápido

```bash
docker compose up -d db minio pgadmin redis
npm run seed --prefix backend          # crea admin + datos base
npm run start:dev --prefix backend     # backend en :3001
npm run dev --prefix frontend          # frontend en :3000
```

Para levantar todo el stack (incluye backend y frontend contenerizados):

```bash
docker compose up -d
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
├── backend/          # API NestJS (módulos, seed, configuración)
├── frontend/         # SPA Next.js (dashboard, módulos de gestión)
├── database/
│   └── init.sql      # Script de inicialización de la BD
├── docker-compose.yml
└── .env              # Credenciales y puertos
```

## Módulos

- **Institución**: datos de identidad y parámetros (sigla, logo, rango de notas).
- **Carreras**: plan de estudios por niveles.
- **Gestión Académica**: períodos (gestiones) abiertos/cerrados.
- **Estudiantes**: inscripción, códigos `EST-año-NNNN`, foto y documentos en MinIO.
- **Depósitos**: verificación de comprobantes (bitácora de estados).
- **Matrículas**: requiere depósito verificado/aprobado; números `MAT-año-NNNNN`.
- **Materias / Asignaciones**: semestres, paralelos, carga docente.
- **Asistencia**: registro por asignación y paralelo (P/R/F).
- **Calificaciones**: ponderación 25/25/20/30, nota mínima **51**; sincroniza el historial automáticamente.
- **Historial Académico**: trayectoria por estudiante; concluye estudios y marca egresados.
- **Usuarios y Credenciales**: roles Administrador, Secretaría, Docente y Estudiante.
- **Reportes, Centralizadores, Certificados, Conclusión de Estudios, Dashboard**.

API bajo `http://localhost:3001/api` (JWT Bearer, 24 h).