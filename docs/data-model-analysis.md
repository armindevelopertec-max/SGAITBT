# Análisis de Redundancias - Modelo de Datos SGAITBT

## Fecha: 2026-09-20

---

## 1. Datos Fundamentales - Jerarquía de Creación

```
1. INSTITUCIÓN          (raíz - sin dependencias)
       ↓
2. CARRERAS             (pertenecen a Institución)
       ↓
3. MATERIAS             (pertenecen a Carrera)
       ↓
4. PERSONAS             (raíz independiente)
       ↓
   ┌──────┴──────┐
5. ESTUDIANTE      5. EMPLEADO
   └──────┬──────┘
         ↓
6.     USUARIOS          (estudiantes y empleados acceden al sistema)
```

### Reglas de creación:
- **Institución** → solo una, al inicio
- **Carrera** → pertenece a institución
- **Materia** → pertenece a carrera
- **Persona** → entidad central de identidad; estudiantes y empleados se crean a partir de aquí
- **Usuario** → requiere persona (estudiante o empleado tienen su propio usuario)

---

## 2. Redundancias Detectadas

### 2.1 Persona.lastName vs paternalSurname + maternalSurname

**Detectado:** ✅ **CORREGIDO**

```
Person tenía:
  paternalSurname (línea 21)     ← "Pérez"
  maternalSurname (línea 24)      ← "García"
  lastName        (línea 26)      ← "Pérez García"  ← redundante

Person ahora:
  paternalSurname (línea 21)     ← "Pérez"
  maternalSurname (línea 24)      ← "García"
  lastName        (línea 26)      ← nullable (legacy)
```

**Acción tomada (2026-09-20):**
- `lastName` ahora es nullable
- Agregado getter `Person.fullName` que calcula: `[firstName, paternalSurname, maternalSurname].join(' ')`
- Agregado getter `User.fullName` que usa el nuevo `Person.fullName`

**Recomendación futura:** Eliminar `lastName` completamente cuando todas las referencias legacy estén actualizadas.

---

### 2.2 User con 3 posibles links de identidad

**Detectado:** ⚠️ Pendiente de validación

```
User tiene simultáneamente:
  personId    → Person
  studentId   → Student → Person
  employeeId  → Employee → Person
```

**Problema:** Un User podría técnicamente vincularse a 3 personas diferentes si los IDs no se coordinan. Los índices únicos evitan esto a nivel de DB, pero no hay validación a nivel de aplicación.

**Recomendación:**
- `personId` es el link primario de identidad
- `studentId` y `employeeId` son solo para conveniencia (para lookup rápido)
- No deberían ser NULL simultáneamente (un usuario debe tener al menos personId)

**Acción sugerida:** Agregar validación en UserService al crear/actualizar.

---

## 3. Entidades y sus Dependencias

| Entidad | Dependencias (FK) | Referenciado por |
|---------|-------------------|------------------|
| Institution | Ninguna | Career |
| Career | institutionId | Subject, Student |
| Subject | careerId | SubjectAssignment |
| Person | Ninguna | User, Student, Employee |
| Student | personId, careerId (nullable), userId (nullable) | User, Enrollment, Deposit |
| Employee | personId | User |
| User | personId (nullable), studentId (nullable), employeeId (nullable) | UserRole |

---

## 4. Notas de Implementación

### 4.1 Nombres de persona
Usar `paternalSurname` + `maternalSurname` como campos canonicales. `lastName` es un campo legacy.

### 4.2 Tipos de usuario
- **Estudiante**: User → studentId → Student → personId → Person
- **Empleado**: User → employeeId → Employee → personId → Person
- **Genérico**: User → personId → Person (sin estudiante ni empleado)

### 4.3 Permisos de acceso docente
Los docentes acceden vía User → employeeId → Employee → personId → person.user.fullName.
