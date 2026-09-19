# SGA ITBT — Documentación por Módulos

**Sistema de Gestión Académica · Instituto Tecnológico "Boliviana de Tecnología"**
**Última actualización:** 2026-09-18
**Backend:** NestJS + TypeORM + PostgreSQL · **Frontend:** Next.js 15 + React 19

---

## Índice de Módulos

1. [Institution](#1-institution--configuración-institucional)
2. [Career](#2-career--carreras)
3. [Academic Period](#3-academic-period--gestiones-académicas)
4. [Subject](#4-subject--materias)
5. [Student](#5-student--estudiantes)
6. [Person](#6-person--personas)
7. [Employee](#7-employee--empleados)
8. [User](#8-user--usuarios)
9. [Auth](#9-auth--autenticación)
10. [Deposit](#10-deposit--depósitos)
11. [Enrollment](#11-enrollment--matrículas)
12. [Subject Assignment](#12-subject-assignment--asignación-de-materias)
13. [Parallel](#13-parallel--paralelos)
14. [Attendance](#14-attendance--asistencia)
15. [Grade](#15-grade--calificaciones)
16. [Academic History](#16-academic-history--historial-académico)
17. [Dashboard](#17-dashboard--paneles-de-control)
18. [RBAC (Roles y Permisos)](#18-rbac--roles-y-permisos)
19. [Audit](#19-audit--auditoría)
20. [MinIO (Uploads)](#20-minio--archivos)
21. [Calendar Event](#21-calendar-event--eventos-del-calendario)

---

## 1. Institution — Configuración Institucional

**Entidad:** `Institution`
**Prefijo API:** `/api/institutions`
**Tabla:** `institutions`

### Descripción
Gestiona la identidad y configuración general del instituto. Es un singleton (solo existe una institución).

### Permisos
- `INSTITUTION_VIEW` — Ver institución
- `INSTITUTION_UPDATE` — Crear/actualizar configuración

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/institutions` | `INSTITUTION_UPDATE` | Crear institución |
| `GET` | `/institutions` | `INSTITUTION_VIEW` | Obtener todas (devuelve array) |
| `GET` | `/institutions/:id` | `INSTITUTION_VIEW` | Obtener por ID |
| `PATCH` | `/institutions/:id` | `INSTITUTION_UPDATE` | Actualizar datos generales |
| `PATCH` | `/institutions/:id/config` | `INSTITUTION_UPDATE` | Actualizar `documentConfig` |
| `PATCH` | `/institutions/:id/logo` | `INSTITUTION_UPDATE` | Subir logo |
| `PATCH` | `/institutions/:id/deactivate` | `INSTITUTION_UPDATE` | Desactivar institución |

### Campos principales
```
name, slug, code, description, address, phone, phoneSecondary,
email, rectorName, logoUrl, academicRegulation, documentConfig (jsonb)
```

### Notas
- No existe DELETE; la desactivación marca `is_active = false`
- Logo se sube via `/uploads/logo` y se guarda la URL en `logoUrl`

---

## 2. Career — Carreras

**Entidad:** `Career`
**Prefijo API:** `/api/careers`
**Tabla:** `careers`

### Descripción
Gestiona las carreras técnicas del instituto (ej. Autotrónica, Mecánica Automotriz).

### Permisos
- `CAREERS_VIEW` — Ver carreras
- `CAREERS_CREATE` — Crear carrera
- `CAREERS_UPDATE` — Actualizar/toggle estado
- `CAREERS_DELETE` — Desactivar carrera

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/careers` | `CAREERS_CREATE` | Crear carrera |
| `GET` | `/careers` | `CAREERS_VIEW` | Listar todas |
| `GET` | `/careers/:id` | `CAREERS_VIEW` | Obtener por ID |
| `PATCH` | `/careers/:id` | `CAREERS_UPDATE` | Actualizar carrera |
| `PATCH` | `/careers/:id/toggle-state` | `CAREERS_UPDATE` | Alternar ACTIVE/INACTIVE |
| `PATCH` | `/careers/:id/deactivate` | `CAREERS_DELETE` | Desactivar carrera |

### Campos principales
```
name, code (único), area, description, title,
durationYears (3), numberOfLevels (6),
state, studyPlan (jsonb), institutionId
```

### Notas
- 2 carreras actuales: **Autotrónica (AUT)** y **Mecánica Automotriz (MEC)**
- `studyPlan` incluye: loadHours, weeklyHours, monthlyHours, semesterHours, area, title, regime

---

## 3. Academic Period — Gestiones Académicas

**Entidad:** `AcademicPeriod`
**Prefijo API:** `/api/academic-periods`
**Tabla:** `academic_periods`

### Descripción
Gestiona los períodos Académicos (I/2023, II/2023, ..., I/2026, II/2026).

### Permisos
- `PERIODS_VIEW` — Ver períodos
- `PERIODS_CREATE` — Crear período
- `PERIODS_UPDATE` — Actualizar/cerrar/abrir
- `PERIODS_DELETE` — Eliminar período

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/academic-periods` | `PERIODS_CREATE` | Crear período |
| `GET` | `/academic-periods` | `PERIODS_VIEW` | Listar todos |
| `GET` | `/academic-periods/:id` | `PERIODS_VIEW` | Obtener por ID |
| `PATCH` | `/academic-periods/:id` | `PERIODS_UPDATE` | Actualizar datos |
| `PATCH` | `/academic-periods/:id/close` | `PERIODS_UPDATE` | Cerrar período |
| `PATCH` | `/academic-periods/:id/open` | `PERIODS_UPDATE` | Abrir período |
| `DELETE` | `/academic-periods/:id` | `PERIODS_DELETE` | Eliminar período |

### Estados (PeriodStatus)
- `PLANNED` — Periodo creado pero no iniciado
- `OPEN` — Periodo activo (inscripciones, clases)
- `CLOSED` — Periodo finalizado

### Campos principales
```
year, periodName (ej. "I/2026"), sequence,
startDate, endDate, status, careerId
```

### Notas
- Único por `(careerId, year, periodName)`
- Períodos actuales: I/2023 a II/2026 (8 períodos)

---

## 4. Subject — Materias

**Entidad:** `Subject`
**Prefijo API:** `/api/subjects`
**Tabla:** `subjects`

### Descripción
Gestiona las materias/assignaturas de cada carrera, incluyendo prerrequisitos.

### Permisos
- `SUBJECTS_VIEW` — Ver materias
- `SUBJECTS_CREATE` — Crear materia
- `SUBJECTS_UPDATE` — Actualizar materia

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/subjects` | `SUBJECTS_CREATE` | Crear materia |
| `GET` | `/subjects` | `SUBJECTS_VIEW` | Listar todas |
| `GET` | `/subjects/career/:careerId` | `SUBJECTS_VIEW` | Filtrar por carrera |
| `GET` | `/subjects/career/:careerId/semester/:semester` | `SUBJECTS_VIEW` | Filtrar por carrera y semestre |
| `GET` | `/subjects/:id` | `SUBJECTS_VIEW` | Obtener por ID |
| `PATCH` | `/subjects/:id` | `SUBJECTS_UPDATE` | Actualizar materia |
| `PATCH` | `/subjects/:id/toggle-state` | `SUBJECTS_UPDATE` | Alternar estado |

### Campos principales
```
code (único por carrera, ej. "MAA-100"),
name, semester (1-6), weeklyHours, totalHours,
prerequisites (jsonb array de códigos, ej. ["MAA-100"]),
isElective, careerId
```

### Notas
- Prerrequisitos: array de códigos de materias que deben estar aprobadas antes de cursar
- Ejemplo: `FIS-200` tiene prerrequisito `["MAA-100"]`
- AUT tiene 37 materias; MEC tiene 39 materias

---

## 5. Student — Estudiantes

**Entidad:** `Student`
**Prefijo API:** `/api/students`
**Tabla:** `students`

### Descripción
Gestiona el registro de estudiantes con su código institucional, carrera y estado académico.

### Permisos
- `STUDENTS_VIEW` — Ver estudiantes
- `STUDENTS_CREATE` — Crear estudiante
- `STUDENTS_UPDATE` — Actualizar estudiante

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/students` | `STUDENTS_CREATE` | Crear estudiante |
| `GET` | `/students` | `STUDENTS_VIEW` | Listar todos |
| `GET` | `/students/by-ci/:ci` | `STUDENTS_VIEW` | Buscar por CI |
| `GET` | `/students/by-code/:code` | `STUDENTS_VIEW` | Buscar por código (EST-2026-XXXX) |
| `GET` | `/students/by-status/counts` | `STUDENTS_VIEW` | Contar por estado |
| `GET` | `/students/by-career/counts` | `STUDENTS_VIEW` | Contar por carrera |
| `GET` | `/students/me` | (usuario actual) | Perfil del estudiante logueado |
| `GET` | `/students/:id` | `STUDENTS_VIEW` | Obtener por ID |
| `PATCH` | `/students/:id` | `STUDENTS_UPDATE` | Actualizar datos |
| `PATCH` | `/students/:id/status` | `STUDENTS_UPDATE` | Cambiar estado académico |
| `PATCH` | `/students/:id/current-period/:periodId` | `STUDENTS_UPDATE` | Asignar período actual |

### Estados académicos (AcademicStatus)
```
PRE_ENROLLED → ACTIVE → WITHDRAWN
                          ↓
                      GRADUATE → TITLED
```

### Campos principales
```
studentCode (EST-año-NNNN), ci (único), email (único),
firstName, paternalSurname, maternalSurname, lastName,
birthDate, sex, phone, address,
status (PRE_ENROLLED/ACTIVE/WITHDRAWN/GRADUATE/TITLED/INACTIVE),
currentLevel (1-6), careerId, currentPeriodId, personId
```

### Notas
- 80 estudiantes actuales (40 AUT + 40 MEC)
- Estudiantes de I/2023-II/2024 están en semestres 4-6

---

## 6. Person — Personas

**Entidad:** `Person`
**Prefijo API:** `/api/persons`
**Tabla:** `persons`

### Descripción
Padrón único de personas. Base de estudiantes, empleados y usuarios. Cada persona tiene una relación 1:1 con Student y/o Employee.

### Permisos
- `PERSONS_VIEW` — Ver personas
- `PERSONS_CREATE` — Crear persona
- `PERSONS_UPDATE` — Actualizar persona
- `PERSONS_DELETE` — Desactivar persona

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/persons` | `PERSONS_CREATE` | Crear persona (auditado) |
| `GET` | `/persons` | `PERSONS_VIEW` | Listar todas |
| `GET` | `/persons/:id` | `PERSONS_VIEW` | Obtener por ID |
| `PATCH` | `/persons/:id` | `PERSONS_UPDATE` | Actualizar (auditado) |
| `DELETE` | `/persons/:id` | `PERSONS_DELETE` | Desactivar (auditado) |

### Campos principales
```
ci (único), ciExtension, firstName,
paternalSurname, maternalSurname, lastName,
birthDate, sex (MALE/FEMALE), phone, address,
email (único), photoUrl, status (ACTIVE/INACTIVE)
```

### Notas
- Todas las operaciones crean logs en `audit_logs`
- Persona existe independientemente de Student/Employee/User

---

## 7. Employee — Empleados

**Entidad:** `Employee`
**Prefijo API:** `/api/employees`
**Tabla:** `employees`

### Descripción
Gestiona el personal del instituto (docentes, directivos, administrativos, apoyo).

### Permisos
- `EMPLOYEES_VIEW` — Ver empleados
- `EMPLOYEES_CREATE` — Crear empleado
- `EMPLOYEES_UPDATE` — Actualizar empleado
- `EMPLOYEES_DELETE` — Desactivar empleado

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/employees/me` | (usuario actual) | Perfil del empleado logueado |
| `POST` | `/employees` | `EMPLOYEES_CREATE` | Crear empleado (auditado) |
| `GET` | `/employees` | `EMPLOYEES_VIEW` | Listar todos |
| `GET` | `/employees?employeeType=DOCENTE` | `EMPLOYEES_VIEW` | Filtrar docentes |
| `GET` | `/employees/:id` | `EMPLOYEES_VIEW` | Obtener por ID |
| `PATCH` | `/employees/:id` | `EMPLOYEES_UPDATE` | Actualizar (auditado) |
| `DELETE` | `/employees/:id` | `EMPLOYEES_DELETE` | Desactivar (auditado) |

### Tipos de empleado (EmployeeType)
```
DIRECTIVO — Rectores, directores
DOCENTE — Profesores
ADMINISTRATIVO — Personal administrativo
APOYO — Personal de apoyo
```

### Campos principales
```
employeeCode (EMP-NNNNN), hireDate,
employeeType (DIRECTIVO/DOCENTE/ADMINISTRATIVO/APOYO),
position, personId
```

### Notas
- Los DOCENTE se asignan a SubjectAssignment como `employeeId`
- 4 docentes actuales: jquispe, mchoque, carana, lflores

---

## 8. User — Usuarios

**Entidad:** `User`
**Prefijo API:** `/api/users`
**Tabla:** `users`

### Descripción
Cuentas de acceso al sistema. Vinculadas a Person (opcionalmente a Student o Employee).

### Permisos
- `USERS_VIEW` — Ver usuarios
- `USERS_CREATE` — Crear usuario
- `USERS_UPDATE` — Actualizar usuario

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/users` | `USERS_CREATE` | Crear usuario |
| `POST` | `/users/student/:studentId` | `USERS_CREATE` | Crear usuario para estudiante |
| `GET` | `/users` | `USERS_VIEW` | Listar todos |
| `GET` | `/users/role/:role` | `USERS_VIEW` | Listar por rol (ADMIN/SECRETARY/TEACHER/STUDENT) |
| `GET` | `/users/counts/by-role` | `USERS_VIEW` | Contar por rol |
| `GET` | `/users/roles` | `ROLES_VIEW` | Listar roles con permisos |
| `GET` | `/users/me` | (usuario actual) | Usuario actual con roles/permisos |
| `GET` | `/users/:id` | `USERS_VIEW` | Obtener por ID con roles |
| `PATCH` | `/users/:id` | `USERS_UPDATE` | Actualizar usuario |
| `PATCH` | `/users/:id/roles` | `USERS_UPDATE` | Asignar/remover roles |
| `PATCH` | `/users/:id/reset-password` | `USERS_UPDATE` | Resetear contraseña |

### Campos principales
```
username (único), email (único), fullName,
passwordHash, status (ACTIVE/INACTIVE/BLOCKED),
lastLogin, failedAttempts (bloqueo tras 5),
mustChangePassword, photoUrl,
studentId (1:1 opcional), personId (1:1)
```

### Notas
- Bloqueo: 5 intentos fallidos → `status = BLOCKED`
- Usuario estudiante: username = CI del estudiante

---

## 9. Auth — Autenticación

**Entidad:** N/A
**Prefijo API:** `/api/auth`
**Guard:** Sin auth (público)

### Descripción
Manejo de inicio de sesión con JWT. Genera token de acceso de 24 horas.

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/auth/login` | Ninguno | Iniciar sesión |

### Body
```json
{ "username": "admin", "password": "admin2026" }
```

### Response
```json
{
  "access_token": "<JWT>",
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@itbt.edu.bo",
    "fullName": "Administrador del Sistema",
    "roles": ["ADMIN"],
    "permissions": ["*"]
  }
}
```

### Notas
- Throttle: 5 requests por 60 segundos por IP
- JWT contiene: sub (userId), id, username, email, roles[], permissions[]
- Permisos se recargan desde BD en cada request (revocación inmediata)

---

## 10. Deposit — Depósitos

**Entidad:** `Deposit`
**Prefijo API:** `/api/deposits`
**Tabla:** `deposits`

### Descripción
Registro de comprobantes de pago de matrícula. Flujo de verificación: PENDING → VERIFIED → APPROVED.

### Permisos
- `DEPOSITS_VIEW` — Ver depósitos
- `DEPOSITS_CREATE` — Crear depósito
- `DEPOSITS_UPDATE` — Actualizar/verificar depósito

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/deposits` | `DEPOSITS_CREATE` | Crear depósito |
| `GET` | `/deposits` | `DEPOSITS_VIEW` | Listar todos |
| `GET` | `/deposits/counts/by-status` | `DEPOSITS_VIEW` | Contar por estado |
| `GET` | `/deposits/total` | `DEPOSITS_VIEW` | Total de montos |
| `GET` | `/deposits/:id` | `DEPOSITS_VIEW` | Obtener por ID |
| `PATCH` | `/deposits/:id` | `DEPOSITS_UPDATE` | Actualizar datos |
| `PATCH` | `/deposits/:id/verify` | `DEPOSITS_UPDATE` | Verificar depósito |
| `PATCH` | `/deposits/:id/convert-to-student` | `DEPOSITS_UPDATE` | Convertir a estudiante |

### Estados (DepositStatus)
```
PENDING → VERIFIED → APPROVED
              ↓
         OBSERVED / REJECTED
```

### Campos principales
```
depositNumber (DEP-año-NNNN), depositDate,
amount (numeric 12,2), concept,
voucherUrl (MinIO), status,
verificationComment, verificationDate, verifiedBy,
studentId
```

### Notas
- Deposit es prerequisito para Enrollment
- El voucher se sube via `/uploads/voucher`

---

## 11. Enrollment — Matrículas

**Entidad:** `Enrollment`
**Prefijo API:** `/api/enrollments`
**Tabla:** `enrollments`

### Descripción
Matrícula por gestión académica. Requiere depósito verificado/aprobado.

### Permisos
- `ENROLLMENTS_VIEW` — Ver matrículas
- `ENROLLMENTS_CREATE` — Crear matrícula
- `ENROLLMENTS_UPDATE` — Actualizar/cancelar matrícula

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/enrollments` | `ENROLLMENTS_CREATE` | Crear matrícula |
| `POST` | `/enrollments/enroll-student` | `ENROLLMENTS_CREATE` | Enrolar estudiante |
| `GET` | `/enrollments` | `ENROLLMENTS_VIEW` | Listar todas |
| `GET` | `/enrollments/counts/by-period` | `ENROLLMENTS_VIEW` | Contar por período |
| `GET` | `/enrollments/counts/total` | `ENROLLMENTS_VIEW` | Total matrículas |
| `GET` | `/enrollments/by-number/:enrollmentNumber` | `ENROLLMENTS_VIEW` | Buscar por número |
| `GET` | `/enrollments/:id` | `ENROLLMENTS_VIEW` | Obtener por ID |
| `PATCH` | `/enrollments/:id` | `ENROLLMENTS_UPDATE` | Actualizar |
| `PATCH` | `/enrollments/:id/cancel` | `ENROLLMENTS_UPDATE` | Cancelar matrícula |

### Estados (EnrollmentStatus)
```
ACTIVE → INACTIVE / CANCELLED
```

### Campos principales
```
enrollmentNumber (MAT-año-NNNNN), enrollmentDate,
status, semester (1-6), totalAmount,
observations, studentId, careerId, academicPeriodId
```

### Notas
- Genera credencial de matrícula (tarjeta 85×55 mm con QR)
- Verifica depósito APPROVED/VERIFIED antes de crear

---

## 12. Subject Assignment — Asignación de Materias

**Entidad:** `SubjectAssignment`
**Prefijo API:** `/api/subject-assignments`
**Tabla:** `subject_assignments`

### Descripción
Define qué materia se dicta en qué gestión, paralelo, aula, horario y con qué docente (Employee DOCENTE).

### Permisos
- `ASSIGNMENTS_VIEW` — Ver asignaciones
- `ASSIGNMENTS_CREATE` — Crear asignación / autoasignar
- `ASSIGNMENTS_UPDATE` — Actualizar / inscribir estudiante
- `ASSIGNMENTS_DELETE` — Eliminar asignación

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/subject-assignments` | `ASSIGNMENTS_CREATE` | Crear asignación |
| `POST` | `/subject-assignments/auto-assign` | `ASSIGNMENTS_CREATE` | Autoasignar estudiantes |
| `GET` | `/subject-assignments` | `ASSIGNMENTS_VIEW` | Listar todas |
| `GET` | `/subject-assignments/teacher/:employeeId` | `ASSIGNMENTS_VIEW` | Asignaciones por docente |
| `GET` | `/subject-assignments/:id` | `ASSIGNMENTS_VIEW` | Obtener por ID |
| `GET` | `/subject-assignments/:id/students` | `ASSIGNMENTS_VIEW` | Estudiantes en asignación |
| `PATCH` | `/subject-assignments/:id` | `ASSIGNMENTS_UPDATE` | Actualizar asignación |
| `POST` | `/subject-assignments/:id/enroll-student` | `ASSIGNMENTS_UPDATE` | Inscribir estudiante |
| `DELETE` | `/subject-assignments/:id/students/:studentId` | `ASSIGNMENTS_UPDATE` | Retirar estudiante |
| `POST` | `/subject-assignments/:id/delete` | `ASSIGNMENTS_DELETE` | Eliminar asignación |

### Campos principales
```
parallel ('A'/'B'/'C'), classroom, schedule (jsonb),
subjectId, employeeId (FK Employee DOCENTE), academicPeriodId,
semester
```

### Notas
- `employeeId` referencia a Employee con tipo DOCENTE (desde Fase 2b)
- Autoasignación: reparte estudiantes matriculados entre paralelos disponibles
- Respeta prerrequisitos: solo.inscribe si prerrequisitos están APPROVED

---

## 13. Parallel — Paralelos

**Entidad:** `Parallel`
**Prefijo API:** `/api/parallels`
**Tabla:** `parallels`

### Descripción
Gestión de paralelos (A, B, C) por turno (Mañana, Tarde, Noche).

### Permisos
- `PARALLELS_VIEW` — Ver paralelos
- `PARALLELS_CREATE` — Crear paralelo
- `PARALLELS_UPDATE` — Actualizar paralelo
- `PARALLELS_DELETE` — Eliminar paralelo

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/parallels` | `PARALLELS_CREATE` | Crear paralelo |
| `GET` | `/parallels` | `PARALLELS_VIEW` | Listar todos |
| `GET` | `/parallels/:id` | `PARALLELS_VIEW` | Obtener por ID |
| `PATCH` | `/parallels/:id` | `PARALLELS_UPDATE` | Actualizar |
| `DELETE` | `/parallels/:id` | `PARALLELS_DELETE` | Eliminar |

### Campos principales
```
name ('A'/'B'/'C'), shift (MANANA/TARDE/NOCHE),
careerId, academicPeriodId
```

---

## 14. Attendance — Asistencia

**Entidad:** `Attendance`
**Prefijo API:** `/api/attendance`
**Tabla:** `attendances`

### Descripción
Registro de asistencia por estudiante en cada asignación.

### Permisos
- `ATTENDANCE_VIEW` — Ver asistencia
- `ATTENDANCE_CREATE` — Registrar asistencia
- `ATTENDANCE_UPDATE` — Actualizar asistencia
- `ATTENDANCE_DELETE` — Eliminar registro

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/attendance` | `ATTENDANCE_CREATE` | Registrar asistencia |
| `GET` | `/attendance` | `ATTENDANCE_VIEW` | Listar todos |
| `GET` | `/attendance/assignment/:assignmentId` | `ATTENDANCE_VIEW` | Asistencia por asignación |
| `GET` | `/attendance/summary/assignment/:assignmentId` | `ATTENDANCE_VIEW` | Resumen % asistencia |
| `PATCH` | `/attendance/:id` | `ATTENDANCE_UPDATE` | Actualizar |
| `DELETE` | `/attendance/:id` | `ATTENDANCE_DELETE` | Eliminar |

### Estados (AttendanceStatus)
```
PRESENT — Presente
ABSENT — Ausente
LATE — Tarde
JUSTIFIED — Justificado
```

### Campos principales
```
attendanceDate, status, observations,
studentId, assignmentId
```

### Notas
- Resumen calcula porcentaje por estudiante
- Alerta si asistencia < 75%

---

## 15. Grade — Calificaciones

**Entidad:** `Grade`
**Prefijo API:** `/api/grades`
**Tabla:** `grades`

### Descripción
Carga de calificaciones por estudiante y asignación. Ponderación: 25% P1 + 25% P2 + 20% Prácticas + 30% Final. Nota mínima: 51.

### Permisos
- `GRADES_VIEW` — Ver calificaciones
- `GRADES_CREATE` — Crear/actualizar calificación
- `GRADES_UPDATE` — Actualizar calificación
- `GRADES_VERIFY` — Verificar (especial)
- `GRADES_DELETE` — Eliminar

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/grades` | `GRADES_CREATE` | Crear calificación |
| `POST` | `/grades/bulk` | `GRADES_CREATE` | Carga masiva |
| `GET` | `/grades` | `GRADES_VIEW` | Listar todos |
| `GET` | `/grades/assignment/:assignmentId` | `GRADES_VIEW` | Calificaciones por asignación |
| `GET` | `/grades/student/:studentId` | `GRADES_VIEW` | Calificaciones por estudiante |
| `GET` | `/grades/:id` | `GRADES_VIEW` | Obtener por ID |
| `GET` | `/grades/centralized/assignment/:assignmentId` | `GRADES_VIEW` | Acta centralizada |
| `PATCH` | `/grades/:id` | `GRADES_UPDATE` | Actualizar |
| `DELETE` | `/grades/:id` | `GRADES_DELETE` | Eliminar |

### Campos principales
```
firstPartial, secondPartial, practices, finalExam,
finalGrade (calculado), status (APPROVED/FAILED/PENDING),
studentId, assignmentId
```

### Cálculo de nota final
```
finalGrade = firstPartial × 0.25 + secondPartial × 0.25 + practices × 0.20 + finalExam × 0.30
```
- APPROVED: finalGrade ≥ 51
- FAILED: finalGrade < 51

### Notas
- Al guardar, sincroniza automáticamente con AcademicHistory
- Bulk permite cargar todas las notas de una asignación

---

## 16. Academic History — Historial Académico

**Entidad:** `AcademicHistory`
**Prefijo API:** `/api/academic-history`
**Tabla:** `academic_history`

### Descripción
Trayectoria académica por estudiante: materias cursadas, notas y estados.

### Permisos
- `HISTORY_VIEW` — Ver historial
- `DASHBOARD_VIEW` — Ver estadísticas

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/academic-history/student/:studentId` | `HISTORY_VIEW` | Historial completo del estudiante |
| `GET` | `/academic-history/student/:studentId/summary` | `HISTORY_VIEW` | Resumen (aprobadas/reprobadas/pendientes) |
| `GET` | `/academic-history/career/:careerId` | `HISTORY_VIEW` | Historial por carrera |
| `GET` | `/academic-history/period/:academicPeriodId` | `HISTORY_VIEW` | Historial por período |
| `GET` | `/academic-history/stats/overall` | `HISTORY_VIEW` | Estadísticas globales |

### Campos principales
```
finalGrade, status (APPROVED/FAILED/PENDING),
isReevaluation, studentId, careerId, academicPeriodId, subjectId, semester
```

### Notas
- Se actualiza automáticamente al guardar Grade
- Resumen incluye: total aprobadas, reprobadas, promedio, créditos

---

## 17. Dashboard — Paneles de Control

**Entidad:** N/A
**Prefijo API:** `/api/dashboard`
**Tabla:** N/A

### Descripción
Dashboards diferenciados según el rol del usuario.

### Permisos
- `DASHBOARD_VIEW` — Ver dashboard
- `HISTORY_VIEW` — Dashboard de estudiante

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/dashboard/admin` | `DASHBOARD_VIEW` | Dashboard administrativo |
| `GET` | `/dashboard/teacher` | `DASHBOARD_VIEW` | Dashboard de docente |
| `GET` | `/dashboard/student` | `DASHBOARD_VIEW`, `HISTORY_VIEW` | Dashboard de estudiante |

### Dashboard Admin incluye
- Total estudiantes, activos, nuevos
- Docentes, materias activas, carreras
- Matrículas del año, depósitos pendientes
- Aprobados, reprobados, egresados

### Dashboard Teacher incluye
- Asignaciones del docente
- Estudiantes por asignación
- Calificaciones ingresadas
- Próximas clases

### Dashboard Student incluye
- Datos del estudiante
- Período actual
- Materias inscritas
- Resumen de calificaciones

---

## 18. RBAC — Roles y Permisos

**Entidad:** `Role`, `Permission`
**Prefijo API:** `/api/roles`
**Tablas:** `roles`, `permissions`, `role_permissions`, `user_roles`

### Descripción
Sistema de control de acceso basado en roles. 59 permisos organizados por módulo.

### Permisos
- `ROLES_VIEW` — Ver roles/permisos
- `ROLES_MANAGE` — Crear/actualizar/eliminar roles

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/roles/permissions` | `ROLES_VIEW` | Listar todos los permisos |
| `GET` | `/roles` | `ROLES_VIEW` | Listar roles con permisos |
| `GET` | `/roles/:id` | `ROLES_VIEW` | Obtener rol por ID |
| `POST` | `/roles` | `ROLES_MANAGE` | Crear rol (auditado) |
| `PATCH` | `/roles/:id` | `ROLES_MANAGE` | Actualizar rol (auditado) |
| `PATCH` | `/roles/:id/permissions` | `ROLES_MANAGE` | Asignar permisos (auditado) |
| `DELETE` | `/roles/:id` | `ROLES_MANAGE` | Eliminar rol (auditado) |

### Roles del sistema

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Administrador del sistema |
| `SECRETARY` | Secretaría académica |
| `TEACHER` | Docente |
| `STUDENT` | Estudiante |
| `SUPPORT` | Personal de apoyo (solo dashboard) |

### Formato de permisos
```
<MODULO>_<ACCION>
Ejemplos: STUDENTS_VIEW, GRADES_CREATE, ATTENDANCE_UPDATE
```

### Notas
- Permisos se recargan desde BD en cada request JWT
- Crear/editar/eliminar roles genera logs de auditoría

---

## 19. Audit — Auditoría

**Entidad:** `AuditLog`
**Prefijo API:** `/api/audit`
**Tabla:** `audit_logs`

### Descripción
Bitácora de todas las operaciones de escritura (CREATE, UPDATE, DELETE) sobre entidades auditadas.

### Permisos
- `AUDIT_VIEW` — Ver logs de auditoría

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `GET` | `/audit` | `AUDIT_VIEW` | Listar logs (paginados) |

### Query params
```
?page=1&limit=20&module=&action=&userId=
```

### Campos del log
```
userId, username, action (CREATE/UPDATE/DELETE),
module (ej. 'Person'), entityType, entityId,
previousValue (jsonb), newValue (jsonb),
ip, description, createdAt
```

### Módulos auditados actualmente
- `Person` — CRUD de personas
- `Role` — CRUD de roles y permisos

### Notas
- No stores FK formales (tabla independiente)
- `previousValue`/`newValue` almacenan el diff del cambio

---

## 20. MinIO — Archivos

**Entidad:** N/A
**Prefijo API:** `/api/uploads`
**Servicio:** MinIO (S3-compatible)

### Descripción
Manejo de uploads de archivos a MinIO (fotos, vouchers, logos, documentos).

### Permisos
- `FILES_UPLOAD` — Subir archivos
- `INSTITUTION_UPDATE` — Subir logo institucional

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/uploads/photo` | `FILES_UPLOAD` | Subir foto de persona/estudiante |
| `POST` | `/uploads/voucher` | `FILES_UPLOAD` | Subir comprobante de pago |
| `POST` | `/uploads/logo` | `FILES_UPLOAD`, `INSTITUTION_UPDATE` | Subir logo institucional |
| `POST` | `/uploads/document` | `FILES_UPLOAD` | Subir documento |

### Buckets

| Bucket | Contenido | Tamaño máx |
|--------|-----------|------------|
| `photos` | Fotos de personas/estudiantes | 5 MB |
| `vouchers` | Comprobantes de depósito | 10 MB |
| `logos` | Logos institucionales | 5 MB |
| `documents` | Documentos varios | 10 MB |

### Validaciones
- Fotos: JPEG, PNG, WEBP, GIF
- Vouchers/Docs: imágenes, PDF
- Logos: imágenes

### Notas
- URLs generadas para acceso público
- Los archivos se referencian por `objectName` en la BD

---

## 21. Calendar Event — Eventos del Calendario

**Entidad:** `CalendarEvent`
**Prefijo API:** `/api/calendar-events`
**Tabla:** `calendar_events`

### Descripción
Eventos del calendario académico (inicio de clases, exámenes, cierre, etc.) por período.

### Permisos
- `CALENDAR_VIEW` — Ver eventos
- `CALENDAR_CREATE` — Crear evento
- `CALENDAR_UPDATE` — Actualizar evento
- `CALENDAR_DELETE` — Eliminar evento

### Endpoints

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| `POST` | `/calendar-events` | `CALENDAR_CREATE` | Crear evento |
| `GET` | `/calendar-events` | `CALENDAR_VIEW` | Listar todos |
| `GET` | `/calendar-events/:id` | `CALENDAR_VIEW` | Obtener por ID |
| `PATCH` | `/calendar-events/:id` | `CALENDAR_UPDATE` | Actualizar |
| `DELETE` | `/calendar-events/:id` | `CALENDAR_DELETE` | Eliminar |

### Campos principales
```
title, description, category (PERIODO/MATRICULA/ACTIVIDAD/EVALUACION/CIERRE),
startDate, endDate (opcional), status,
academicPeriodId
```

### Categorías típicas
- `PERIODO` — Inicio/fin de período
- `MATRICULA` — Inscripciones
- `ACTIVIDAD` — Clases, actividades
- `EVALUACION` — Parciales, finales
- `CIERRE` — Cierre de calificaciones, actas

### Notas
- Seed genera eventos automáticos para cada período

---

## Resumen de Módulos

| # | Módulo | Entidad | Endpoints | Operaciones |
|---|--------|---------|-----------|-------------|
| 1 | Institution | Institution | 7 | C, R, U |
| 2 | Career | Career | 6 | C, R, U, D |
| 3 | Academic Period | AcademicPeriod | 7 | C, R, U, D |
| 4 | Subject | Subject | 7 | C, R, U |
| 5 | Student | Student | 12 | C, R, U |
| 6 | Person | Person | 5 | C, R, U, D |
| 7 | Employee | Employee | 6 | C, R, U, D |
| 8 | User | User | 12 | C, R, U |
| 9 | Auth | — | 1 | Login |
| 10 | Deposit | Deposit | 8 | C, R, U |
| 11 | Enrollment | Enrollment | 8 | C, R, U |
| 12 | Subject Assignment | SubjectAssignment | 10 | C, R, U, D |
| 13 | Parallel | Parallel | 5 | C, R, U, D |
| 14 | Attendance | Attendance | 6 | C, R, U, D |
| 15 | Grade | Grade | 9 | C, R, U, D |
| 16 | Academic History | AcademicHistory | 5 | R |
| 17 | Dashboard | — | 3 | R |
| 18 | RBAC | Role, Permission | 7 | C, R, U, D |
| 19 | Audit | AuditLog | 1 | R |
| 20 | MinIO | — | 4 | C |
| 21 | Calendar Event | CalendarEvent | 5 | C, R, U, D |

**Total: 21 módulos · 140 endpoints**
