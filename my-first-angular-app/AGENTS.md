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

Este proyecto tiene skills obligatorias que deben cargarse automaticamente segun el tipo de tarea.

### 10.1 Regla general de carga

- Si una tarea coincide con un trigger de skill, el agente DEBE cargar ese skill ANTES de proponer cambios o escribir codigo.
- Si aplican multiples skills, cargar todas las relevantes y resolver en este orden:
  1. Estructura/arquitectura
  2. Tipado y estilo de codigo
  3. UI/UX

### 10.2 Catalogo de skills y cuando cargarlas

#### `angular-architect`

Cargar cuando la tarea incluya:
- Componentes standalone Angular.
- Routing (lazy loading, guards, resolvers).
- Estado con Signals, RxJS o NgRx.
- Performance Angular (change detection, code splitting, bundle).
- Testing Angular de componentes/servicios/guards.

#### `angular-architecture`

Cargar cuando la tarea incluya:
- Crear o reorganizar estructura de carpetas en `src/app`.
- Definir limites entre `core`, `features`, `shared`.
- Decidir si crear carpeta nueva o archivo nuevo.
- Diseñar estructura por dominio o por rutas de navegacion.

Reglas clave al usarla:
- Organizar por dominio de negocio (no por tipo tecnico) en `features`.
- No importar `features` -> `core`.
- No importar `core/features` -> `shared`.

#### `typescript-best-practice`

Cargar cuando la tarea incluya:
- Crear/refactorizar clases TypeScript de componentes Angular.
- Definir orden interno de miembros de clase.
- Migrar/usar `input()`, `output()`, `model()`.
- Revisar uso de lifecycle hooks y acceso al DOM.

Reglas clave al usarla:
- Miembros de clase ordenados (dependencias, constantes, inputs, outputs, estado, metodos).
- Priorizar señales y patrones reactivos sobre lifecycle hooks.
- Evitar acceso directo al DOM.

#### `best-practices-in-coding-style`

Cargar cuando la tarea incluya:
- Estandarizacion de naming.
- Mejoras de legibilidad y consistencia TypeScript.
- Refactors de estilo (funciones, variables, comentarios).

Reglas clave al usarla:
- PascalCase para tipos/clases/enums/interfaces; camelCase para variables/metodos.
- Evitar `var`, preferir `const` y `let` cuando haga falta.
- Usar `===` / `!==`, single quotes y template literals.
- TODO/FIXME con referencia de ticket (`#issue` o Jira).

#### `best-practices-for-typing`

Cargar cuando la tarea incluya:
- Definir modelos, DTOs o contratos TypeScript.
- Corregir o endurecer tipado estricto.
- Mejorar null safety.
- Ajustar `tsconfig` para reglas de typing.

Reglas clave al usarla:
- Evitar `any` (usar `unknown` cuando corresponda).
- Tipar explicitamente cuando la inferencia no sea segura.
- Usar unions/tuples para modelado preciso.
- Aplicar strict typing y aliases de imports cuando corresponda.

#### `interface-design`

Cargar cuando la tarea incluya:
- Diseño de dashboards, paneles admin, herramientas internas o flujos de app.
- Definicion de layout, jerarquia visual, UX de formularios o tablas.
- Mejoras de usabilidad, consistencia visual o accesibilidad UI.
- Sistemas de componentes, tokens visuales, estados de interfaz.

No usar para landing pages o marketing sites.

### 10.3 Matriz rapida de decision

- Estructura de carpetas / limites de arquitectura -> `angular-architecture` (+ `angular-architect` si tambien hay logica Angular).
- Clase de componente Angular (inputs/outputs/lifecycle) -> `typescript-best-practice` + `angular-architect`.
- Naming, consistencia y legibilidad TS -> `best-practices-in-coding-style`.
- Tipado estricto, modelos, null safety, tsconfig typing -> `best-practices-for-typing`.
- UX/UI de producto -> `interface-design` (+ `angular-architect` si hay impacto tecnico Angular).

### 10.4 Protocolo minimo antes de editar

1. Identificar tipo de tarea (estructura, logica Angular, tipado, estilo, UI).
2. Cargar skill(s) correspondientes.
3. Explicar en 1-2 lineas por que aplican.
4. Recien despues proponer implementacion o editar archivos.

### 10.5 Casos mixtos (obligatorio)

- Si la tarea combina **estructura + tipado + UI**, cargar todas las skills necesarias.
- No limitarse a una sola skill si el cambio cruza responsabilidades.
- En caso de duda, priorizar precision: mejor cargar una skill extra que omitir una critica.

### 10.6 Ejemplos rapidos

- "Crear dashboard con cards, filtros y tabla" -> `interface-design` + `angular-architect`.
- "Reordenar carpetas de blog por dominios y rutas" -> `angular-architecture`.
- "Arreglar guard de autenticacion y lazy routes" -> `angular-architect`.
- "Refactorizar inputs/outputs a signals" -> `typescript-best-practice` + `angular-architect`.
- "Eliminar any y reforzar null safety" -> `best-practices-for-typing`.
- "Normalizar naming y comentarios TODO" -> `best-practices-in-coding-style`.
