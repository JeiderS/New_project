# AGENTS.md

Guia operativa para agentes que trabajen en este proyecto Angular.

## 1) Resumen del proyecto

- Stack principal: Angular 21 (standalone), TypeScript 5.9, RxJS 7, Tailwind CSS 4.
- Integraciones clave: Supabase (`@supabase/supabase-js`) para autenticacion, perfiles y storage.
- Estructura base:
  - `src/app/core/` para guards e interfaces compartidas.
  - `src/app/services/` para acceso a APIs externas (ejemplo: `supabase.service.ts`).
  - `src/app/public/` para pantallas publicas (login, not-found).
  - `src/app/pages/` para paginas autenticadas (dashboard).

## 2) Comandos de compilacion y prueba

Ejecutar desde la raiz del proyecto (`my-first-angular-app`):

- Instalar dependencias: `npm install`
- Desarrollo local: `npm run start` (equivalente a `ng serve`)
- Build de produccion: `npm run build`
- Build en modo watch/dev: `npm run watch`
- Tests unitarios: `npm run test` (Angular unit test runner)

Notas:
- No usar `npm` alternativo salvo necesidad explicita.
- Antes de cerrar una tarea de codigo, ejecutar al menos tests (`npm run test`).

## 3) Directrices de estilo de codigo

- Respetar `.editorconfig`: UTF-8, indentacion de 2 espacios, trim trailing whitespace, newline final.
- TypeScript con comillas simples (single quote), consistente con la configuracion existente.
- Mantener componentes y servicios chicos y con responsabilidad unica.
- Evitar logica de negocio pesada en componentes; moverla a servicios o capas core.
- Nombrado:
  - Componentes/servicios/clases en PascalCase.
  - Variables y funciones en camelCase.
  - Archivos con convenciones Angular existentes (`*.ts`, `*.html`, `*.css`).
- No introducir dependencias nuevas sin justificar impacto (tamano, mantenimiento, seguridad).

## 4) Instrucciones de testing

- Agregar/ajustar tests cuando cambie comportamiento observable.
- Cubrir al menos:
  - Caso feliz.
  - Caso de error esperado.
  - Estados de autenticacion para rutas protegidas (guards).
- Mantener tests deterministas: no depender de red real ni credenciales productivas.
- Si hace falta mockear Supabase, hacerlo en tests de unidad, no contra API real.

## 5) Consideraciones de seguridad

- Nunca commitear secretos reales.
- En `src/environments/environments.ts` solo deben existir valores publicos (URL y publishable key).
- Nunca almacenar `service_role` key en frontend.
- No loguear tokens, sesiones ni datos personales en consola.
- Validar y sanitizar datos de formularios antes de enviarlos al backend.

## 6) Workflow de PR y commits

- Commits chicos, atomicos y con Conventional Commits:
  - `feat: ...`
  - `fix: ...`
  - `refactor: ...`
  - `test: ...`
  - `docs: ...`
- En PR incluir:
  - Resumen corto del problema y solucion.
  - Capturas o video si hay cambio visual.
  - Evidencia de test (salida resumida o descripcion de lo ejecutado).
  - Riesgos conocidos y plan de rollback si aplica.

## 7) Pasos sugeridos para implementar cambios

1. Leer contexto funcional antes de tocar codigo (ruta, servicio, guard involucrado).
2. Hacer cambio minimo necesario para resolver el problema.
3. Ejecutar tests.
4. Revisar que no se filtren secretos ni datos sensibles.
5. Preparar PR con contexto suficiente para revision.

## 8) Monorepo o subproyectos (AGENTS.md anidados)

Si este repositorio crece a monorepo:

- Crear un `AGENTS.md` en la raiz (este archivo) con reglas globales.
- Crear `AGENTS.md` dentro de cada subproyecto o paquete para reglas locales.
- El agente debe priorizar el `AGENTS.md` mas cercano al archivo que esta modificando.
- Cuando haya conflicto entre reglas, gana la del directorio mas especifico.

## 9) Que debe hacer un agente al comenzar

- Revisar este `AGENTS.md` antes de editar.
- Detectar si existe un `AGENTS.md` mas especifico en subcarpetas.
- Confirmar comandos disponibles en `package.json` antes de ejecutar tareas.
- Mantener cambios enfocados y faciles de revisar.

## 10) Uso obligatorio de skills (auto-load por contexto)

Este proyecto tiene 2 skills clave que deben cargarse automaticamente cuando aplique:

- `angular-architect`
- `interface-design`

Regla general:

- Si una tarea coincide con un trigger de skill, el agente DEBE cargar ese skill ANTES de proponer cambios o escribir codigo.
- Si aplican ambos skills, cargar ambos y resolver primero arquitectura/flujo, luego interfaz.

### 10.1 Triggers de `angular-architect`

Cargar `angular-architect` cuando la tarea incluya alguno de estos puntos:

- Crear o refactorizar componentes standalone de Angular.
- Routing avanzado (lazy loading, guards, resolvers).
- Estado global/local con Signals, RxJS o NgRx.
- Performance de Angular (change detection, bundle, code splitting).
- Testing Angular (unit/integration) de componentes, servicios o guards.

### 10.2 Triggers de `interface-design`

Cargar `interface-design` cuando la tarea incluya:

- Diseño de dashboards, paneles admin, herramientas internas o flujos de app.
- Definicion de layout, jerarquia visual, UX de formularios o tablas.
- Mejoras de usabilidad, consistencia visual o accesibilidad UI.
- Sistemas de componentes, tokens visuales, estados de interfaz.

No usar `interface-design` para marketing pages (landing, campañas, sitios de marca).

### 10.3 Si hay duda, aplicar matriz rapida

- Cambio centrado en arquitectura Angular, estado, routing o performance -> `angular-architect`.
- Cambio centrado en experiencia de usuario, layout o sistema visual -> `interface-design`.
- Cambio mixto (arquitectura + UX) -> ambos skills.

### 10.4 Protocolo minimo antes de editar

1. Identificar tipo de tarea.
2. Cargar skill(s) correspondiente(s).
3. Explicar en 1-2 lineas por que esos skills aplican.
4. Recien despues proponer implementacion o editar archivos.

### 10.5 Ejemplos rapidos

- "Crear dashboard con cards, filtros y tabla" -> `interface-design` + `angular-architect`.
- "Arreglar guard de autenticacion y lazy routes" -> `angular-architect`.
- "Mejorar UX del formulario de login" -> `interface-design`.
