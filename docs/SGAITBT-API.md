# SGA ITBT - Referencia API y Modelos de Datos

**Versión:** 1.0.0
**Fecha:** Septiembre 2026
**Sistema de Gestión Académica - Instituto Tecnológico "Boliviana de Tecnología"**

---

## Tabla de Contenidos

1. [Entidades y Campos](#1-entidades-y-campos)
2. [Endpoints API](#2-endpoints-api)
3. [DTOs y Validaciones](#3-dtos-y-validaciones)
4. [Enums](#4-enums)
5. [Permisos](#5-permisos)
6. [Formatos de Respuesta](#6-formatos-de-respuesta)

---

## 1. Entidades y Campos

### 1.1 Student (Estudiante)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| firstName | varchar(150) | NO | Nombre(s) |
| paternalSurname | varchar(150) | SÍ | Apellido paterno |
| maternalSurname | varchar(150) | SÍ | Apellido materno |
| lastName | varchar(150) | NO | Apellido(s) completo(s) |
| diplomaNumber | varchar(30) | **NO** | Nro. Título de Bachiller |
| ci | varchar(30) | NO | Cédula de Identidad |
| ciExtension | varchar(20) | SÍ | Extensión de CI (LP, CB, etc.) |
| birthDate | date | NO | Fecha de nacimiento |
| sex | enum(Sex) | SÍ | Género |
| phone | varchar(30) | SÍ | Teléfono |
| address | text | SÍ | Dirección |
| email | varchar(150) | NO | Correo electrónico |
| photoUrl | text | SÍ | URL de foto |
| studentCode | varchar(50) | NO | Código de estudiante (único) |
| status | enum(AcademicStatus) | NO | Estado académico |
| currentLevel | integer | NO | Nivel/Semestre actual |
| careerId | uuid | SÍ | FK a Career |
| currentPeriodId | uuid | SÍ | FK a AcademicPeriod |
| personId | uuid | SÍ | FK a Person |
| createdAt | timestamptz | NO | Fecha de creación |
| updatedAt | timestamptz | NO | Fecha de actualización |

### 1.2 Person (Persona)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| ci | varchar(30) | NO | Cédula de Identidad |
| ciExtension | varchar(20) | SÍ | Extensión de CI |
| firstName | varchar(150) | NO | Nombre(s) |
| paternalSurname | varchar(150) | SÍ | Apellido paterno |
| maternalSurname | varchar(150) | SÍ | Apellido materno |
| lastName | varchar(150) | NO | Apellido(s) |
| birthDate | date | SÍ | Fecha de nacimiento |
| sex | enum(Sex) | SÍ | Género |
| phone | varchar(30) | SÍ | Teléfono |
| email | varchar(150) | NO | Correo electrónico |
| address | text | SÍ | Dirección |
| photoUrl | text | SÍ | URL de foto |
| status | enum(PersonStatus) | NO | Estado (default: ACTIVE) |

### 1.3 User (Usuario)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| username | varchar(150) | NO | Nombre de usuario (único) |
| passwordHash | varchar(300) | NO | Hash de contraseña |
| email | varchar(150) | NO | Correo electrónico |
| fullName | varchar(150) | NO | Nombre completo |
| status | enum(UserStatus) | NO | Estado (default: ACTIVE) |
| lastLogin | timestamptz | SÍ | Último login |
| failedAttempts | integer | NO | Intentos de login fallidos |
| mustChangePassword | boolean | NO | Debe cambiar contraseña |
| photoUrl | text | SÍ | URL de foto |
| studentId | uuid | SÍ | FK a Student |
| personId | uuid | SÍ | FK a Person |

### 1.4 Employee (Empleado)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| employeeCode | varchar(50) | NO | Código de empleado |
| hireDate | date | SÍ | Fecha de contratación |
| employeeType | enum(EmployeeType) | NO | Tipo de empleado |
| position | varchar(150) | SÍ | Cargo |
| personId | uuid | NO | FK a Person |

### 1.5 Career (Carrera)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| name | varchar(200) | NO | Nombre de la carrera |
| code | varchar(30) | NO | Código (ej: AUT, MEC) |
| description | text | SÍ | Descripción |
| durationYears | integer | NO | Duración en años (default: 3) |
| numberOfLevels | integer | NO | Número de niveles/semestres (default: 6) |
| state | enum(CareerState) | NO | Estado (default: ACTIVE) |
| studyPlan | jsonb | SÍ | Plan de estudios |
| institutionId | uuid | NO | FK a Institution |

### 1.6 Subject (Materia)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| code | varchar(30) | NO | Código (ej: ATM-500) |
| name | varchar(200) | NO | Nombre |
| semester | integer | NO | Semestre |
| weeklyHours | integer | NO | Horas semanales (default: 0) |
| totalHours | integer | NO | Horas totales (default: 0) |
| prerequisites | json | SÍ | Prerrequisitos |
| isElective | boolean | NO | Es electiva (default: false) |
| careerId | uuid | NO | FK a Career |

### 1.7 AcademicPeriod (Período Académico)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| year | varchar(4) | NO | Año (ej: 2026) |
| periodName | varchar(100) | NO | Nombre (ej: I/2026) |
| sequence | integer | NO | Secuencia (default: 1) |
| startDate | date | SÍ | Fecha de inicio |
| endDate | date | SÍ | Fecha de fin |
| status | enum(PeriodStatus) | NO | Estado (default: PLANNED) |

### 1.8 Enrollment (Inscripción)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| enrollmentNumber | varchar(50) | NO | Número de inscripción |
| enrollmentDate | date | NO | Fecha de inscripción |
| status | enum(EnrollmentStatus) | NO | Estado (default: ACTIVE) |
| semester | integer | NO | Semestre |
| totalAmount | numeric(12,2) | SÍ | Monto total |
| observations | text | SÍ | Observaciones |
| studentId | uuid | NO | FK a Student |
| careerId | uuid | NO | FK a Career |
| academicPeriodId | uuid | NO | FK a AcademicPeriod |

### 1.9 SubjectAssignment (Asignación de Materia)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| parallel | varchar(20) | NO | Paralelo (default: 'A') |
| classroom | varchar(50) | SÍ | Aula |
| schedule | jsonb | SÍ | Horario |
| subjectId | uuid | NO | FK a Subject |
| employeeId | uuid | SÍ | FK a Employee (docente) |
| academicPeriodId | uuid | NO | FK a AcademicPeriod |
| parallelId | uuid | SÍ | FK a Parallel |
| semester | integer | NO | Semestre |

### 1.10 Parallel (Paralelo)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| academicPeriodId | uuid | NO | FK a AcademicPeriod |
| code | varchar(10) | NO | Código (ej: A, B, C) |
| shift | enum(ShiftType) | NO | Turno (default: MANANA) |
| deletedAt | timestamp | SÍ | Soft delete |

### 1.11 Grade (Calificación)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| firstPartial | numeric(5,2) | SÍ | Primer parcial (0-100) |
| secondPartial | numeric(5,2) | SÍ | Segundo parcial (0-100) |
| practices | numeric(5,2) | SÍ | Prácticas (0-100) |
| finalExam | numeric(5,2) | SÍ | Examen final (0-100) |
| finalGrade | numeric(5,2) | SÍ | Nota final |
| status | enum(GradeStatus) | NO | Estado (default: PENDING) |
| studentId | uuid | NO | FK a Student |
| assignmentId | uuid | NO | FK a SubjectAssignment |

### 1.12 Attendance (Asistencia)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| attendanceDate | date | NO | Fecha de asistencia |
| status | enum(AttendanceStatus) | NO | Estado (default: PRESENT) |
| observations | text | SÍ | Observaciones |
| studentId | uuid | NO | FK a Student |
| assignmentId | uuid | NO | FK a SubjectAssignment |

### 1.13 Deposit (Depósito/Pago)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| depositNumber | varchar(100) | NO | Número de depósito |
| depositDate | date | NO | Fecha de depósito |
| amount | numeric(12,2) | NO | Monto |
| concept | enum(DepositConcept) | NO | Concepto (default: MATRICULA) |
| conceptDetail | varchar(255) | SÍ | Detalle del concepto |
| voucherUrl | text | SÍ | URL del comprobante |
| status | enum(DepositStatus) | NO | Estado (default: PENDING) |
| verificationComment | text | SÍ | Comentario de verificación |
| verificationDate | timestamptz | SÍ | Fecha de verificación |
| verifiedBy | varchar(200) | SÍ | Verificado por |
| studentId | uuid | SÍ | FK a Student |
| personId | uuid | SÍ | FK a Person |

### 1.14 AcademicHistory (Historial Académico)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| studentId | uuid | NO | FK a Student |
| careerId | uuid | NO | FK a Career |
| academicPeriodId | uuid | NO | FK a AcademicPeriod |
| subjectId | uuid | NO | FK a Subject |
| semester | integer | NO | Semestre |
| finalGrade | numeric(5,2) | SÍ | Nota final |
| status | enum(GradeStatus) | NO | Estado (default: PENDING) |
| isReevaluation | boolean | NO | Esreevaluación (default: false) |

### 1.15 Institution (Institución)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| name | varchar(200) | NO | Nombre |
| slug | varchar(300) | NO | Slug |
| code | varchar(50) | NO | Código |
| description | varchar(500) | SÍ | Descripción |
| address | text | SÍ | Dirección |
| phone | varchar(30) | SÍ | Teléfono principal |
| phoneSecondary | varchar(30) | SÍ | Teléfono secundario |
| email | varchar(150) | SÍ | Email |
| rectorName | varchar(200) | SÍ | Nombre del rector |
| rectorSignature | text | SÍ | Firma del rector |
| logoUrl | text | SÍ | URL del logo |
| academicRegulation | text | SÍ | Reglamento académico |
| documentConfig | jsonb | SÍ | Configuración de documentos |

### 1.16 CalendarEvent (Evento de Calendario)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| title | varchar(150) | NO | Título |
| category | enum(CalendarEventCategory) | NO | Categoría (default: OTHER) |
| startDate | date | NO | Fecha de inicio |
| endDate | date | SÍ | Fecha de fin |
| description | text | SÍ | Descripción |
| status | enum(CalendarEventStatus) | NO | Estado (default: ACTIVE) |
| academicPeriodId | uuid | NO | FK a AcademicPeriod |

### 1.17 AuditLog (Log de Auditoría)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| userId | uuid | SÍ | FK a User |
| username | varchar(100) | SÍ | Nombre de usuario |
| action | varchar(50) | NO | Acción |
| module | varchar(100) | NO | Módulo |
| entityType | varchar(100) | SÍ | Tipo de entidad |
| entityId | varchar(100) | SÍ | ID de entidad |
| previousValue | jsonb | SÍ | Valor anterior |
| newValue | jsonb | SÍ | Valor nuevo |
| ip | varchar(50) | SÍ | Dirección IP |
| description | text | SÍ | Descripción |
| createdAt | timestamptz | NO | Fecha de creación |

### 1.18 Role (Rol)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| name | varchar(100) | NO | Nombre |
| description | varchar(250) | SÍ | Descripción |
| parentId | uuid | SÍ | FK a Role padre |
| isSystem | boolean | NO | Es sistema (default: false) |

### 1.19 Permission (Permiso)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| id | uuid | NO | Identificador único |
| key | varchar(100) | NO | Clave única |
| module | varchar(100) | SÍ | Módulo |
| action | enum(PermissionAction) | NO | Acción (default: OTHER) |
| description | varchar(250) | SÍ | Descripción |

---

## 2. Endpoints API

### 2.1 Auth (Autenticación)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /auth/login | - | Login (throttled: 5/min) |

**Body Login:**
```json
{
  "username": "string",
  "password": "string (min 6)"
}
```

**Respuesta:**
```json
{
  "access_token": "string",
  "user": { "id": "uuid", "username": "string", "fullName": "string", "role": "string" }
}
```

---

### 2.2 Students (Estudiantes)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /students | students.create | Crear estudiante |
| GET | /students | various | Listar estudiantes |
| GET | /students/by-ci/:ci | various | Buscar por CI |
| GET | /students/by-code/:code | various | Buscar por código |
| GET | /students/by-status/counts | various | Conteo por estado |
| GET | /students/by-career/counts | various | Conteo por carrera |
| GET | /students/me | - | Obtener estudiante actual |
| GET | /students/:id/entry-year | various | Obtener año de ingreso |
| GET | /students/:id | various | Obtener por ID |
| PATCH | /students/:id | students.update | Actualizar estudiante |
| PATCH | /students/:id/status | students.update | Actualizar estado |
| PATCH | /students/:id/current-period/:periodId | students.update | Asignar período actual |

---

### 2.3 Persons (Personas)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /persons | persons.create | Crear persona |
| GET | /persons | persons.view | Listar personas |
| GET | /persons/:id | persons.view | Obtener por ID |
| PATCH | /persons/:id | persons.update | Actualizar persona |
| DELETE | /persons/:id | persons.delete | Desactivar persona |

---

### 2.4 Users (Usuarios)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /users | users.create | Crear usuario |
| POST | /users/student/:studentId | users.create | Crear usuario estudiante |
| POST | /users/student/:studentId/reset-password | users.update | Resetear contraseña |
| GET | /users/student/:studentId | users.view | Obtener credenciales |
| GET | /users | users.view | Listar usuarios |
| GET | /users/role/:role | various | Buscar por rol |
| GET | /users/counts/by-role | users.view | Conteo por rol |
| GET | /users/roles | roles.view, users.view | Listar roles con permisos |
| GET | /users/me | - | Obtener usuario actual |
| GET | /users/:id | users.view | Obtener por ID |
| PATCH | /users/:id | users.update | Actualizar usuario |
| PATCH | /users/:id/roles | users.update | Actualizar roles |
| PATCH | /users/:id/reset-password | users.update | Resetear contraseña |

---

### 2.5 Employees (Empleados)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | /employees/me | - | Obtener empleado actual |
| POST | /employees | employees.create | Crear empleado |
| GET | /employees | employees.view, assignments.view | Listar empleados |
| GET | /employees/:id | employees.view, assignments.view | Obtener por ID |
| PATCH | /employees/:id | employees.update | Actualizar empleado |
| DELETE | /employees/:id | employees.delete | Desactivar empleado |

---

### 2.6 Careers (Carreras)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /careers | careers.create | Crear carrera |
| GET | /careers | various | Listar carreras |
| GET | /careers/:id | various | Obtener por ID |
| PATCH | /careers/:id | careers.update | Actualizar carrera |
| PATCH | /careers/:id/toggle-state | careers.update | Cambiar estado |
| PATCH | /careers/:id/deactivate | careers.delete | Desactivar |

---

### 2.7 Subjects (Materias)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /subjects | subjects.create | Crear materia |
| GET | /subjects | subjects.view, assignments.view, reports.view | Listar materias |
| GET | /subjects/career/:careerId | subjects.view | Por carrera |
| GET | /subjects/career/:careerId/semester/:semester | subjects.view | Por carrera y semestre |
| GET | /subjects/:id | subjects.view | Obtener por ID |
| PATCH | /subjects/:id | subjects.update | Actualizar materia |
| PATCH | /subjects/:id/toggle-state | subjects.update | Cambiar estado |

---

### 2.8 Academic Periods (Períodos Académicos)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /academic-periods | periods.create | Crear período |
| GET | /academic-periods | periods.view, assignments.view, enrollments.view | Listar |
| GET | /academic-periods/:id | periods.view | Obtener por ID |
| PATCH | /academic-periods/:id | periods.update | Actualizar |
| PATCH | /academic-periods/:id/close | periods.update | Cerrar período |
| PATCH | /academic-periods/:id/open | periods.update | Abrir período |
| DELETE | /academic-periods/:id | periods.delete | Eliminar período |

---

### 2.9 Enrollments (Inscripciones)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /enrollments | enrollments.create | Crear inscripción |
| POST | /enrollments/enroll-student | enrollments.create | Inscribir estudiante |
| GET | /enrollments | enrollments.view, reports.view | Listar |
| GET | /enrollments/counts/by-period | enrollments.view, reports.view | Conteo por período |
| GET | /enrollments/counts/total | enrollments.view, reports.view | Conteo total |
| GET | /enrollments/by-number/:enrollmentNumber | enrollments.view | Por número |
| GET | /enrollments/:id | enrollments.view | Obtener por ID |
| PATCH | /enrollments/:id | enrollments.update | Actualizar |
| PATCH | /enrollments/:id/cancel | enrollments.update | Cancelar |

---

### 2.10 Subject Assignments (Asignaciones de Materia)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /subject-assignments | assignments.create | Crear asignación |
| POST | /subject-assignments/auto-assign | assignments.create | Auto-asignar estudiantes |
| POST | /subject-assignments/auto-enroll-student | assignments.update | Auto-inscribir estudiante |
| GET | /subject-assignments/teacher/:employeeId | various | Por docente |
| GET | /subject-assignments | various | Listar |
| GET | /subject-assignments/:id | various | Obtener por ID |
| GET | /subject-assignments/:id/students | various | Estudiantes inscritos |
| PATCH | /subject-assignments/:id | assignments.update | Actualizar |
| POST | /subject-assignments/:id/enroll-student | assignments.update | Inscribir estudiante |
| DELETE | /subject-assignments/:id/students/:studentId | assignments.update | Retirar estudiante |
| POST | /subject-assignments/:id/delete | assignments.delete | Eliminar asignación |

---

### 2.11 Parallels (Paralelos)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /parallels | parallels.create | Crear paralelo |
| GET | /parallels | parallels.view | Listar |
| GET | /parallels/:id | parallels.view | Obtener por ID |
| PATCH | /parallels/:id | parallels.update | Actualizar |
| DELETE | /parallels/:id | parallels.delete | Eliminar (soft delete) |

---

### 2.12 Grades (Calificaciones)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /grades | grades.create, grades.update, grades.verify | Crear calificación |
| POST | /grades/bulk | grades.create, grades.update, grades.verify | Crear en bulk |
| GET | /grades | grades.view, reports.view | Listar |
| GET | /grades/assignment/:assignmentId | grades.view, reports.view | Por asignación |
| GET | /grades/student/:studentId | grades.view, reports.view | Por estudiante |
| GET | /grades/:id | grades.view, reports.view | Obtener por ID |
| GET | /grades/centralized/assignment/:assignmentId | grades.view, reports.view | Reporte centralizado |
| PATCH | /grades/:id | grades.create, grades.update, grades.verify | Actualizar |
| DELETE | /grades/:id | grades.delete | Eliminar |

---

### 2.13 Attendance (Asistencia)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /attendance | attendance.create | Crear asistencia |
| GET | /attendance | attendance.view | Listar |
| GET | /attendance/assignment/:assignmentId | attendance.view | Por asignación |
| GET | /attendance/summary/assignment/:assignmentId | attendance.view | Resumen |
| PATCH | /attendance/:id | attendance.update | Actualizar |
| DELETE | /attendance/:id | attendance.delete | Eliminar |

---

### 2.14 Academic History (Historial Académico)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | /academic-history/student/:studentId | history.view, reports.view | Por estudiante |
| GET | /academic-history/student/:studentId/summary | history.view, reports.view | Resumen |
| GET | /academic-history/career/:careerId | history.view, reports.view | Por carrera |
| GET | /academic-history/period/:academicPeriodId | history.view, reports.view | Por período |
| GET | /academic-history/stats/overall | history.view, dashboard.view | Estadísticas generales |

---

### 2.15 Deposits (Depósitos/Pagos)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /deposits | deposits.create | Crear depósito |
| GET | /deposits | various | Listar |
| GET | /deposits/counts/by-status | various | Conteo por estado |
| GET | /deposits/total | various | Total depositado |
| GET | /deposits/:id | various | Obtener por ID |
| PATCH | /deposits/:id | deposits.update | Actualizar |
| PATCH | /deposits/:id/verify | deposits.update | Verificar |
| PATCH | /deposits/:id/convert-to-student | deposits.update | Convertir a estudiante |

---

### 2.16 Calendar Events (Eventos de Calendario)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /calendar-events | calendar.create | Crear evento |
| GET | /calendar-events | calendar.view, periods.view | Listar |
| GET | /calendar-events/:id | calendar.view, periods.view | Obtener por ID |
| PATCH | /calendar-events/:id | calendar.update | Actualizar |
| DELETE | /calendar-events/:id | calendar.delete | Eliminar |

---

### 2.17 Institution (Institución)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /institutions | institution.update | Crear institución |
| GET | /institutions | institution.view, enrollments.view, reports.view | Listar |
| GET | /institutions/:id | institution.view | Obtener por ID |
| PATCH | /institutions/:id | institution.update | Actualizar |
| PATCH | /institutions/:id/config | institution.update | Actualizar config |
| PATCH | /institutions/:id/logo | institution.update | Subir logo |
| PATCH | /institutions/:id/deactivate | institution.update | Desactivar |

---

### 2.18 Audit (Auditoría)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | /audit | audit.view | Listar logs |

**Query Params:** module, action, take, skip

---

### 2.19 Roles y Permissions (RBAC)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | /roles/permissions | roles.view | Listar permisos |
| GET | /roles | roles.view | Listar roles |
| GET | /roles/:id | roles.view | Obtener por ID |
| POST | /roles | roles.manage | Crear rol |
| PATCH | /roles/:id | roles.manage | Actualizar rol |
| PATCH | /roles/:id/permissions | roles.manage | Asignar permisos |
| DELETE | /roles/:id | roles.manage | Eliminar rol |

---

### 2.20 Dashboard

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | /dashboard/admin | dashboard.view | Dashboard admin |
| GET | /dashboard/teacher | dashboard.view | Dashboard docente |
| GET | /dashboard/student | dashboard.view, history.view | Dashboard estudiante |

---

### 2.21 File Uploads (Subida de Archivos)

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | /uploads/photo | files.upload | Subir foto (max 5MB, jpeg/png/webp/gif) |
| POST | /uploads/voucher | files.upload | Subir comprobante (max 10MB, pdf/image) |
| POST | /uploads/logo | files.upload, institution.update | Subir logo |
| POST | /uploads/document | files.upload | Subir documento |

---

## 3. DTOs y Validaciones

### 3.1 Student DTOs

#### CreateStudentDto
```typescript
{
  firstName: string           // required, max 150
  lastName: string            // required, max 150
  diplomaNumber: string       // **required**, max 30 (Nro Título Bachiller)
  ci: string                  // required, max 30
  birthDate: string           // required, date ISO
  email: string               // required, email format
  paternalSurname?: string    // optional, max 150
  maternalSurname?: string    // optional, max 150
  ciExtension?: string       // optional, max 20
  sex?: enum(Sex)             // optional: MALE | FEMALE
  phone?: string              // optional, max 30
  address?: string            // optional
  photoUrl?: string            // optional
  status?: enum(AcademicStatus) // optional, default: PRE_ENROLLED
  currentLevel?: number       // optional, default: 1
  careerId?: uuid             // optional
  personaId?: uuid            // optional
}
```

#### UpdateStudentDto
```typescript
// Todos los campos opcionales (partial)
{
  firstName?: string
  paternalSurname?: string
  maternalSurname?: string
  lastName?: string
  diplomaNumber?: string
  ci?: string
  ciExtension?: string
  birthDate?: string
  sex?: enum(Sex)
  phone?: string
  address?: string
  email?: string
  photoUrl?: string
  status?: enum(AcademicStatus)
  currentLevel?: number
  careerId?: uuid
  currentPeriodId?: uuid
  personaId?: uuid
}
```

#### StudentQueryDto
```typescript
{
  status?: enum(AcademicStatus)
  careerId?: uuid
  search?: string  // busca en nombre, CI, código
}
```

---

### 3.2 Person DTOs

#### CreatePersonDto
```typescript
{
  ci: string           // required, max 30
  firstName: string    // required, max 150
  lastName: string     // required, max 150
  email: string        // required, email format
  ciExtension?: string // optional, max 20
  paternalSurname?: string // optional, max 150
  maternalSurname?: string // optional, max 150
  birthDate?: string   // optional, date ISO
  sex?: enum(Sex)      // optional
  phone?: string       // optional, max 30
  address?: string     // optional
  status?: enum(PersonStatus) // optional, default: ACTIVE
}
```

#### UpdatePersonDto
```typescript
// Todos los campos opcionales
```

---

### 3.3 User DTOs

#### CreateUserDto
```typescript
{
  username: string           // required, max 150
  password: string           // required, min 6
  email: string              // required, email format
  fullName: string           // required, max 150
  roleKeys?: string[]        // optional, array de permisos
  studentId?: uuid           // optional
  phone?: string             // optional
}
```

#### ChangePasswordDto
```typescript
{
  currentPassword: string  // required
  newPassword: string      // required, min 6
}
```

#### ResetPasswordDto
```typescript
{
  newPassword: string  // required, min 6
}
```

---

### 3.4 Employee DTOs

#### CreateEmployeeDto
```typescript
{
  personId: uuid                    // required
  employeeType: enum(EmployeeType)  // required: DIRECTIVO | DOCENTE | ADMINISTRATIVO | APOYO
  position?: string                 // optional, max 150
  hireDate?: string                 // optional, date ISO
}
```

#### UpdateEmployeeDto
```typescript
{
  employeeType?: enum(EmployeeType)
  position?: string
  hireDate?: string
  isActive?: boolean
}
```

---

### 3.5 Career DTOs

#### CreateCareerDto
```typescript
{
  name: string           // required, max 200
  code: string           // required, max 30
  durationYears?: number // optional, default: 3
  numberOfLevels?: number // optional, default: 6
  description?: string   // optional
  state?: enum(CareerState) // optional, default: ACTIVE
  studyPlan?: object     // optional, JSON
}
```

---

### 3.6 Subject DTOs

#### CreateSubjectDto
```typescript
{
  code: string           // required, max 30
  name: string           // required, max 200
  semester: number       // required
  weeklyHours: number    // required
  totalHours: number     // required
  careerId: uuid        // required
  prerequisites?: string[] // optional
  isElective?: boolean  // optional, default: false
}
```

---

### 3.7 AcademicPeriod DTOs

#### CreateAcademicPeriodDto
```typescript
{
  year: string                    // required, max 4
  periodName: string              // required, max 100
  sequence?: number               // optional, default: 1
  startDate?: string              // optional, date ISO
  endDate?: string                // optional, date ISO
  status?: enum(PeriodStatus)     // optional, default: PLANNED
}
```

---

### 3.8 Enrollment DTOs

#### EnrollStudentDto
```typescript
{
  studentId: uuid        // required
  academicPeriodId: uuid // required
  semester?: number      // optional
}
```

#### CreateEnrollmentDto
```typescript
{
  studentId: uuid           // required
  careerId: uuid            // required
  academicPeriodId: uuid    // required
  enrollmentDate: string    // required, date ISO
  semester: number         // required
  totalAmount?: number     // optional
  observations?: string    // optional
}
```

---

### 3.9 SubjectAssignment DTOs

#### CreateSubjectAssignmentDto
```typescript
{
  subjectId: uuid           // required
  academicPeriodId: uuid   // required
  employeeId?: uuid        // optional
  parallel?: string        // optional, default: 'A'
  parallelId?: uuid        // optional
  classroom?: string       // optional, max 50
  schedule?: object        // optional, JSON
  semester?: number        // optional
}
```

#### AutoAssignStudentsDto
```typescript
{
  academicPeriodId: uuid  // required
  subjectId: uuid         // required
  studentIds?: uuid[]     // optional
  parallel?: string       // optional
}
```

#### EnrollStudentInAssignmentDto
```typescript
{
  studentId: uuid        // required
  assignmentId?: uuid    // optional
  semester?: number      // optional
}
```

---

### 3.10 Grade DTOs

#### GradeInputDto
```typescript
{
  studentId: uuid           // required
  firstPartial?: number      // optional, 0-100
  secondPartial?: number     // optional, 0-100
  practices?: number         // optional, 0-100
  finalExam?: number         // optional, 0-100
}
```

#### CreateBulkGradesDto
```typescript
{
  assignmentId: uuid  // required
  grades: GradeInputDto[] // required, array
}
```

---

### 3.11 Attendance DTOs

#### CreateAttendanceDto
```typescript
{
  assignmentId: uuid              // required
  attendanceDate: string          // required, date ISO
  records?: AttendanceRecordDto[] // optional, array
}
```

#### AttendanceRecordDto
```typescript
{
  studentId: uuid                    // required
  status: enum(AttendanceStatus)     // required: PRESENT | ABSENT | LATE | JUSTIFIED
  observations?: string               // optional
}
```

---

### 3.12 Deposit DTOs

#### CreateDepositDto
```typescript
{
  depositNumber: string                  // required, max 100
  depositDate: string                    // required, date ISO
  amount: number                         // required
  concept: enum(DepositConcept)          // required: MATRICULA | EXAMEN | CERTIFICADO | OTROS
  studentId?: uuid                       // optional
  personId?: uuid                        // optional
  conceptDetail?: string                 // optional, max 255
  voucherUrl?: string                    // optional
}
```

#### VerifyDepositDto
```typescript
{
  status: enum(DepositStatus)  // required: VERIFIED | APPROVED | REJECTED | OBSERVED
  verificationComment?: string  // optional
}
```

---

### 3.13 CalendarEvent DTOs

#### CreateCalendarEventDto
```typescript
{
  title: string                          // required, max 150
  startDate: string                      // required, date ISO
  academicPeriodId: uuid                 // required
  category?: enum(CalendarEventCategory) // optional, default: OTHER
  endDate?: string                       // optional, date ISO
  description?: string                   // optional
  status?: enum(CalendarEventStatus)     // optional, default: ACTIVE
}
```

---

### 3.14 Role DTOs

#### CreateRoleDto
```typescript
{
  name: string           // required, max 100
  description?: string   // optional, max 250
  parentKey?: string     // optional
}
```

#### UpdateRolePermissionsDto
```typescript
{
  permissionKeys: string[]  // required, array de claves de permisos
}
```

---

### 3.15 Institution DTOs

#### CreateInstitutionDto
```typescript
{
  name: string           // required, max 200
  slug: string           // required, max 300
  code: string           // required, max 50
  description?: string   // optional, max 500
  address?: string       // optional
  phone?: string         // optional, max 30
  phoneSecondary?: string // optional, max 30
  email?: string        // optional, email
  rectorName?: string    // optional, max 200
  logoUrl?: string       // optional
}
```

#### UpdateInstitutionConfigDto
```typescript
{
  academicRegulation?: string  // optional
  documentConfig?: object       // optional, JSON
}
```

---

## 4. Enums

### AcademicStatus (Estado Académico del Estudiante)
```typescript
PRE_ENROLLED  // Pre-inscrito
ACTIVE        // Activo
WITHDRAWN     // Retirado
GRADUATE      // Egresado
TITLED        // Titulado
INACTIVE      // Inactivo
```

### DepositStatus (Estado del Depósito)
```typescript
PENDING    // Pendiente
VERIFIED   // Verificado
APPROVED   // Aprobado
REJECTED   // Rechazado
OBSERVED   // Observado
```

### DepositConcept (Concepto del Depósito)
```typescript
MATRICULA    // Matrícula
EXAMEN       // Examen
CERTIFICADO  // Certificado
OTROS        // Otros
```

### EnrollmentStatus (Estado de Inscripción)
```typescript
ACTIVE     // Activa
INACTIVE   // Inactiva
CANCELLED  // Cancelada
```

### PeriodStatus (Estado del Período Académico)
```typescript
PLANNED  // Planificado
OPEN     // Abierto
CLOSED   // Cerrado
```

### CalendarEventCategory (Categoría de Evento)
```typescript
PERIODO      // Período
MATRICULA    // Matrícula
ACTIVIDAD    // Actividad
EVALUACION   // Evaluación
RECESO       // Receso
CIERRE       // Cierre
OTHER        // Otro
```

### CalendarEventStatus (Estado de Evento)
```typescript
ACTIVE     // Activo
CANCELLED  // Cancelado
```

### AttendanceStatus (Estado de Asistencia)
```typescript
PRESENT    // Presente
ABSENT     // Ausente
LATE       // Tarde
JUSTIFIED  // Justificado
```

### GradeStatus (Estado de Calificación)
```typescript
APPROVED  // Aprobado
FAILED    // Reprobado
PENDING   // Pendiente
```

### CareerState (Estado de Carrera)
```typescript
ACTIVE    // Activa
INACTIVE  // Inactiva
```

### Sex (Género)
```typescript
MALE    // Masculino
FEMALE  // Femenino
```

### UserStatus (Estado de Usuario)
```typescript
ACTIVE   // Activo
INACTIVE // Inactivo
BLOCKED  // Bloqueado
```

### EmployeeType (Tipo de Empleado)
```typescript
DIRECTIVO       // Directivo
DOCENTE         // Docente
ADMINISTRATIVO  // Administrativo
APOYO           // Apoyo
```

### PersonStatus (Estado de Persona)
```typescript
ACTIVE    // Activa
INACTIVE  // Inactiva
```

### PermissionAction (Acción de Permiso)
```typescript
ALL      // Todas
VIEW     // Ver
CREATE   // Crear
UPDATE   // Actualizar
DELETE   // Eliminar
OTHER    // Otro
```

### ShiftType (Tipo de Turno)
```typescript
MANANA   // Mañana
TARDE    // Tarde
NOCHE    // Noche
```

---

## 5. Permisos

### Permisos del Sistema

| Clave | Descripción |
|-------|-------------|
| dashboard.view | Ver dashboard |
| students.view | Ver estudiantes |
| students.create | Crear estudiantes |
| students.update | Actualizar estudiantes |
| students.delete | Eliminar estudiantes |
| careers.view | Ver carreras |
| careers.create | Crear carreras |
| careers.update | Actualizar carreras |
| careers.delete | Eliminar carreras |
| subjects.view | Ver materias |
| subjects.create | Crear materias |
| subjects.update | Actualizar materias |
| subjects.delete | Eliminar materias |
| periods.view | Ver períodos |
| periods.create | Crear períodos |
| periods.update | Actualizar períodos |
| periods.delete | Eliminar períodos |
| parallels.view | Ver paralelos |
| parallels.create | Crear paralelos |
| parallels.update | Actualizar paralelos |
| parallels.delete | Eliminar paralelos |
| calendar.view | Ver calendario |
| calendar.create | Crear eventos de calendario |
| calendar.update | Actualizar eventos de calendario |
| calendar.delete | Eliminar eventos de calendario |
| enrollments.view | Ver inscripciones |
| enrollments.create | Crear inscripciones |
| enrollments.update | Actualizar inscripciones |
| enrollments.delete | Eliminar inscripciones |
| deposits.view | Ver depósitos |
| deposits.create | Crear depósitos |
| deposits.update | Actualizar depósitos |
| deposits.delete | Eliminar depósitos |
| users.view | Ver usuarios |
| users.create | Crear usuarios |
| users.update | Actualizar usuarios |
| users.delete | Eliminar usuarios |
| assignments.view | Ver asignaciones |
| assignments.create | Crear asignaciones |
| assignments.update | Actualizar asignaciones |
| assignments.delete | Eliminar asignaciones |
| attendance.view | Ver asistencia |
| attendance.create | Crear asistencia |
| attendance.update | Actualizar asistencia |
| attendance.delete | Eliminar asistencia |
| grades.view | Ver calificaciones |
| grades.create | Crear calificaciones |
| grades.update | Actualizar calificaciones |
| grades.delete | Eliminar calificaciones |
| grades.verify | Verificar calificaciones |
| history.view | Ver historial |
| reports.view | Ver reportes |
| institution.view | Ver institución |
| institution.update | Actualizar institución |
| persons.view | Ver personas |
| persons.create | Crear personas |
| persons.update | Actualizar personas |
| persons.delete | Eliminar personas |
| employees.view | Ver empleados |
| employees.create | Crear empleados |
| employees.update | Actualizar empleados |
| employees.delete | Eliminar empleados |
| roles.view | Ver roles |
| roles.manage | Gestionar roles |
| audit.view | Ver logs de auditoría |
| files.upload | Subir archivos |
| files.delete | Eliminar archivos |

---

## 6. Formatos de Respuesta

### Respuesta Estándar (成功)

```json
{
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Respuesta con Paginación

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Respuesta de Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "diplomaNumber",
      "message": "diplomaNumber must be a string"
    }
  ]
}
```

### Respuesta de Login

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "fullName": "Administrador",
    "role": "ADMIN"
  }
}
```

---

## Notas

- Todos los endpoints requieren autenticación Bearer Token excepto `/auth/login`
- Los endpoints están protegidos por throttle (límite de requests)
- Las fechas deben seguir el formato ISO 8601 (YYYY-MM-DD)
- Los UUIDs deben ser válidos (formato v4)
- Los campos `createdAt` y `updatedAt` son automáticos

---

*Documento generado automáticamente del proyecto SGA ITBT*
