# SGA ITBT — Documento completo del sistema

**Sistema de Gestión Académica · Instituto Tecnológico "Boliviana de Tecnología"**
Fecha del documento: 2026-09-18 · Rama `main` · Estado: Fase 2b completa (ver `ESTADO_2b.txt`)

> Este documento describe QUÉ ES el sistema, QUÉ HACE, su MODELO DE DATOS, su API,
> sus reglas de negocio, seguridad, frontend, infraestructura y estado actual.
> Reemplaza en vigencia a `INFORME_SISTEMA.txt` (desactualizado: aún mencionaba
> `teacher_id`, columna `users.role` y GETs sin permiso).

---

## 1. Ficha del sistema

| Ítem | Detalle |
|---|---|
| Nombre | SGA · Sistema de Gestión Académica (monorepo `SGAITBT/`) |
| Organización | Instituto Tecnológico "Boliviana de Tecnología" (El Alto, Av. de los Héroes, Z. Ferropetrol N.º 11) |
| Qué es | Plataforma web para gestionar todo el ciclo académico: personas, estudiantes, depósitos, matrículas, materias, docentes, asistencia, calificaciones, historial, egreso, reportes y documentos oficiales |
| Frontend | Next.js 15.1.6 (App Router) + React 19 + TypeScript 5.7 · puerto `3000` |
| Backend | NestJS 10 + TypeORM 0.3 + PostgreSQL 16 · puerto `3001`, API bajo `/api`, docs Swagger en `/api/docs` |
| BD | PostgreSQL 16 (`sga_itbt`) · puerto `5432` · 20 tablas |
| Storage | MinIO (API `9000`, consola `9001`): fotos, vouchers, logos, documentos |
| Otros | Redis 7 (`6379`), pgAdmin (`5050`) |
| Auth | JWT Bearer 24 h (payload con roles[] + permissions[] recargados por request) |
| Seed | Idempotente (`npm run seed` o servicio `seed` one-shot en compose) |

### Credenciales demo (seed)

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | `admin` | `admin2026` |
| Secretaría | `secretaria` | `demo2026` |
| Docentes | `jquispe`, `mchoque`, `carana`, `lflores` | `demo2026` |
| Estudiantes | `<CI del estudiante>` (ej. `15938731`) | `demo2026` |

### Datos reales en BD dev (2026-09-18)

| Tabla | Filas | Tabla | Filas |
|---|---|---|---|
| users | 17 | students | 12 |
| persons | 18 | employees | 6 |
| roles / permissions | 9 / 59 | careers / subjects / academic_periods | 2 / 79 / 8 |
| enrollments / deposits | 23 / 22 | subject_assignments | 77 |
| subject_enrollments | (por materia) | grades / academic_history | 141 / 141 |
| attendances | 333 | audit_logs | 0 |
| institutions | 1 | | |

---

## 2. Arquitectura

```
┌─────────────┐   HTTPS/JWT    ┌──────────────┐   SQL    ┌────────────┐
│  Frontend   │ ─────────────► │   Backend    │ ───────► │ PostgreSQL │
│ Next.js :3000│ ◄──────────── │ NestJS :3001 │          │   :5432    │
└─────────────┘   REST /api    └──────┬───────┘          └────────────┘
                                      │ S3 API
                                      ▼
                               ┌──────────────┐
                               │ MinIO :9000  │  fotos, vouchers, logos, docs
                               └──────────────┘
```

- **Backend modular** (`backend/src/modules/`): 19 módulos — `institution, career,
  academic-period, subject, student, deposit, enrollment, user, auth,
  subject-assignment, attendance, grade, academic-history, dashboard, minio,
  person, employee, rbac, audit` — más `common/` (guards, decorators,
  interceptors, enums, permissions, DTOs, entidades base) y `config/`.
- **Seguridad en capas**: `JwtAuthGuard` (firma + usuario ACTIVE) →
  `PermissionsGuard` (semántica **OR** sobre `@RequirePermission`, `'*'` = todo) →
  `ValidationPipe` global estricta (`whitelist, forbidNonWhitelisted, transform`).
  `JwtStrategy.validate` **recarga roles y permisos desde BD en cada request**
  → la revocación de permisos es inmediata.
- **Frontend 100% client-side** (`'use client'`): SPA con shell (sidebar + topbar),
  guard de rutas por permiso derivado del menú, token en `localStorage`, y
  generación local de PDFs (jsPDF + qrcode + html-to-image).
- **Infra**: `docker-compose.yml` con 7 servicios (postgres, minio, pgadmin, redis,
  backend, seed one-shot, frontend), 4 volúmenes y red `sga_network`. Variables
  obligatorias en `.env` (`DB_USER, DB_PASSWORD, DB_NAME, MINIO_ROOT_USER,
  MINIO_ROOT_PASSWORD, PGADMIN_PASSWORD, JWT_SECRET`); si faltan, compose falla
  con mensaje claro. `iniciar.sh` levanta el stack en local para desarrollo.

---

## 3. Qué hace el sistema (por dominio)

### 3.1 Ciclo académico del estudiante (flujo principal)

```
Persona → Estudiante (EST-año-NNNN) → Depósito/Verificación (DEP-…)
  → Matrícula por gestión (MAT-…) → Asignación a materias/paralelos
  → Asistencia + Calificaciones → Historial académico → Egreso/Titulación
```

1. **Personas** (`/persons`): padrón único de personas (CI, nombres, contacto, foto).
   Base de la que cuelgan estudiantes, empleados y usuarios.
2. **Estudiantes** (`/students`): ficha académica (código `EST-año-NNNN`, carrera,
   nivel actual, gestión actual, estado). Alta manual o por seed; creación de
   cuenta de usuario vinculada (`POST /users/student/:id`, usuario = CI).
3. **Depósitos** (`/deposits`): registro de comprobantes de pago con voucher en
   MinIO; flujo de verificación `PENDING → VERIFIED/APPROVED/OBSERVED/REJECTED`
   con comentario, fecha y responsable.
4. **Matrículas** (`/enrollments`): inscripción por gestión (`MAT-año-NNNNN`).
   **Exige depósito VERIFIED o APPROVED**. Emite **credencial de matrícula**
   (tarjeta 85×55 mm con QR) lista para imprimir/PDF.
5. **Asignaciones** (`/assignments`): qué materia se dicta en qué gestión, paralelo
   (A/B/…), aula, horario y **docente (Employee DOCENTE)**. Inscripción de
   estudiantes por materia + **autoasignación masiva** (matriculados ACTIVE).
6. **Asistencia** (`/attendance`): registro masivo por asignación+fecha (P/R/A/J:
   presente, falta, atraso, justificado) con resumen porcentual y alerta < 75%.
7. **Calificaciones** (`/grades`): carga masiva por asignación con ponderación
   **25/25/20/30** (parcial 1, parcial 2, prácticas, examen final), nota mínima
   **51**; cada nota **sincroniza el historial** automáticamente.
8. **Historial académico** (`/academic-history`): trayectoria por estudiante
   (materias, notas, estados) + resumen (aprobadas/reprobadas/pendientes,
   semestres completados, conclusión). Al completar el último nivel sin
   reprobadas/pendientes → marca **GRADUATE** automáticamente.
9. **Conclusión de estudios** (`/graduation`): vista por estudiante
   (COMPLETED / IN_PROGRESS / GRADUATE) con contadores globales.

### 3.2 Estructura académica (catálogos)

- **Institución** (`/institution`): identidad (nombre, sigla, logo, rector,
  reglamento R.M. 1049/2023, config de documentos). Sin borrado.
- **Carreras** (`/careers`): 2 carreras (Autotrónica `AUT`, Mecánica Automotriz
  `MEC`), 3 años / 6 niveles, plan de estudios jsonb (3600 h), activar/desactivar.
- **Gestiones/Períodos** (`/academic-periods`): por carrera (I/2025, II/2025,
  I/2026, II/2026…), estados OPEN/CLOSED, abrir/cerrar.
- **Materias** (`/subjects`): por carrera y semestre (código único por carrera,
  horas semanales/totales, prerrequisitos, electivas), filtros por carrera/semestre.

### 3.3 Administración y control

- **Usuarios** (`/users`): CRUD, asignación multi-rol (`PATCH /users/:id/roles`),
  reset de contraseña, bloqueo tras 5 intentos fallidos.
- **Empleados** (`/employees`): personal vinculado a Persona
  (`EMP-NNNNN`, tipo DIRECTIVO/DOCENTE/ADMINISTRATIVO/APOYO, cargo); los docentes
  se asignan a las materias.
- **Roles y permisos** (`/roles`): matriz de 59 permisos × 9 roles con herencia;
  crear roles personalizados, editar permisos, eliminar (no sistema, no asignados).
- **Auditoría** (`/audit`): bitácora paginada con filtros (módulo, acción) y
  detalle JSON antes/después (módulos auditados: roles, persons, employees).
- **Archivos/MinIO**: fotos de estudiante, vouchers de depósito, logo
  institucional y documentos (validación de MIME y tamaño por bucket).

### 3.4 Reportes y documentos oficiales

- **Reportes** (`/reports`): 9 reportes tabulares (estudiantes, matrículas,
  depósitos, materias, asignaciones, calificaciones, por carrera, retirados,
  egresados) con impresión.
- **Centralizadores** (`/centralizers`): acta de notas por asignación con cabecera
  institucional y firmas (docente, secretaría, dirección), salida a impresión.
- **Certificados** (`/certificates`): 6 documentos PDF generados en el navegador:
  certificado de notas, de estudios, de estudiante regular, constancia de
  matrícula, historial académico (horizontal) y **boleta de asignación con QR**.
- **Dashboards** (`/`): vista admin (11 tarjetas + operador), docente y estudiante.

---

## 4. Modelo de datos

### 4.1 Diagrama entidad-relación (resumen)

```
institutions (1)──< careers (N) ──┬──< academic_periods (N)   [gestiones por carrera]
                                  ├──< subjects (N)
                                  │     └──< subject_assignments (N)  [materia+gestión+paralelo+docente]
                                  │           ├──< subject_enrollments (N) >── students
                                  │           ├──< grades (N) >────────────── students
                                  │           └──< attendances (N) >───────── students
                                  └──< students (N) ──┬──< enrollments (N) >── academic_periods
                                                      └──< deposits (N)

persons (1)──┬──< employees (N) ──< subject_assignments  [docente dicta]
             ├──1:1 users ──< user_roles (N) >── roles (self-FK parent_id)
             │                                  └──< role_permissions (N) >── permissions
             └──1:1 students

academic_history (N) ──► students, careers, academic_periods, subjects
audit_logs (sin FK formal): quién, qué, cuándo, antes/después (jsonb)
```

Todas las tablas (salvo los puentes `role_permissions` y `user_roles`) heredan de
`BaseEntity`: `id uuid PK`, `created_at/updated_at timestamptz`, `is_active bool
default true`, `created_by/updated_by varchar`.

### 4.2 Tablas (20)

| # | Tabla | Propósito | Columnas clave |
|---|---|---|---|
| 1 | `institutions` | Identidad institucional | name→`institution_name`, slug único, code, rector_name, logo_url, academic_regulation, document_config jsonb |
| 2 | `careers` | Carreras | name, code único, duration_years=3, number_of_levels=6, state, study_plan jsonb, institution_id FK |
| 3 | `academic_periods` | Gestiones por carrera | year, period_name (I/2026), sequence, start/end_date, status **PLANNED/OPEN/CLOSED** (nuevo nace PLANNED), career_id FK · **único (career_id, year, period_name)** |
| 4 | `subjects` | Materias | code (único **por carrera**), name, semester, weekly/total_hours, prerequisites json, is_elective, career_id FK |
| 5 | `students` | Estudiantes | student_code único (`EST-año-NNNN`), ci único, datos personales + email único, academic_status (default PRE_ENROLLED), current_level, career_id FK, current_period_id FK, person_id 1:1 |
| 6 | `deposits` | Depósitos/verificación | deposit_number único (`DEP-año-NNNN`), deposit_date, amount numeric(12,2), concept, voucher_url, verification_status (default PENDING), verification_comment/date/by, student_id FK |
| 7 | `enrollments` | Matrículas por gestión | enrollment_number único (`MAT-año-NNNNN`), enrollment_date, status (default ACTIVE), semester, total_amount, observations, student_id/career_id/academic_period_id FK |
| 8 | `subject_assignments` | Materia+gestión+paralelo+docente | parallel (default 'A'), classroom, schedule jsonb, subject_id FK, **employee_id FK nullable (docente)**, academic_period_id FK, semester |
| 9 | `subject_enrollments` | Inscripción por materia | student_id FK, assignment_id FK |
| 10 | `grades` | Notas | first/second_partial, practices, final_exam, final_grade numeric(5,2), status (default PENDING), student_id/assignment_id FK · **único (student, assignment)** |
| 11 | `attendances` | Asistencia | attendance_date, status (default PRESENT), observations, student_id/assignment_id FK |
| 12 | `academic_history` | Historial | student_id/career_id/academic_period_id/subject_id FK, semester, final_grade, status, is_reevaluation |
| 13 | `persons` | Padrón de personas | ci único, ci_extension, first/maternal/paternal/last name, birth_date, sex, phone, email único, address, photo_url, status |
| 14 | `employees` | Personal | employee_code único (`EMP-NNNNN`), hire_date, employee_type (sin default), position, person_id FK |
| 15 | `users` | Cuentas | username único, passwordHash, email único, fullName, status (default ACTIVE), last_login, failed_attempts, must_change_password (default true), photo_url, student_id 1:1, person_id 1:1 |
| 16 | `roles` | Roles (árbol) | name único, description, parent_id self-FK, is_system |
| 17 | `permissions` | Permisos | key único (`modulo.accion`), module, action, description |
| 18 | `role_permissions` | Puente rol↔permiso | PK compuesta (role_id, permission_id), sin BaseEntity |
| 19 | `user_roles` | Puente usuario↔rol | PK compuesta (user_id, role_id), sin BaseEntity |
| 20 | `audit_logs` | Bitácora | user_id, username, action, module, entity_type, entity_id, previous_value/new_value jsonb, ip, description |

### 4.3 Enums (`backend/src/common/enums`)

- `AcademicStatus`: PRE_ENROLLED, ACTIVE, WITHDRAWN, GRADUATE, TITLED, INACTIVE
- `DepositStatus`: PENDING, VERIFIED, APPROVED, REJECTED, OBSERVED
- `EnrollmentStatus`: ACTIVE, INACTIVE, CANCELLED
- `PeriodStatus`: **PLANNED**, OPEN, CLOSED (ciclo PLANIFICADO → ABIERTO → CERRADO)
- `AttendanceStatus`: PRESENT, ABSENT, LATE, JUSTIFIED
- `GradeStatus`: APPROVED, FAILED, PENDING
- `StudyConclusionStatus`: COMPLETED, IN_PROGRESS, GRADUATE
- `CareerState`: ACTIVE, INACTIVE · `Sex`: MALE, FEMALE
- `UserStatus`: ACTIVE, INACTIVE, BLOCKED
- `EmployeeType`: DIRECTIVO, DOCENTE, ADMINISTRATIVO, APOYO
- `PersonStatus`: ACTIVE, INACTIVE
- `PermissionAction`: ALL, VIEW, CREATE, UPDATE, DELETE, OTHER

### 4.4 Códigos correlativos (generados en servicios/seed)

Estudiante `EST-{año}-{NNNN}` · Matrícula `MAT-{año}-{NNNNN}` · Depósito
`DEP-{año}-{NNNN}` · Empleado `EMP-{NNNNN}` · Periodo `{romano}/{año}` (I/2026).
...[truncated 21192 chars]