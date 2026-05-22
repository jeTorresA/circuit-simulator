# Arquitectura actual y roadmap de evolucion

## 1) Como opera hoy el sistema (vision general)

El proyecto es una app React + TypeScript + Vite con render en canvas via `react-konva`.

Flujo principal:

1. El usuario agrega componentes desde `src/Components/Toolbar.tsx`.
2. El estado global del circuito vive en `src/hooks/useCircuitStore.ts` y se persiste en `localStorage` (`mi-simulador-circuitos-v1`).
3. El lienzo y la interaccion (drag, seleccion, cableado, enrutado ortogonal) se manejan en `src/Components/Circuit.tsx`.
4. La simulacion DC se ejecuta con `solveDC` en `src/core/Solver.ts`.
5. Los resultados se muestran en `src/Components/SimulationPanel.tsx`.
6. La documentacion de componentes se muestra en `src/Components/ComponentDocsModal.tsx` leyendo `.md` embebidos (`?raw`).

Arquitectura de datos actual del circuito:

- `components`: arreglo de componentes con `id`, `type`, `x`, `y`, `value`, `rotation`.
- `wires`: conexiones entre nodos (`from`, `to`) + `bendPoints`.
- `junctions`: nodos intermedios (`jct:*`) para bifurcaciones.

## 2) Componentes existentes: funcionamiento, configuracion y matematica

### Resistencia (`resistor`)

- Vista actual: bloque rectangular con pines `left` y `right`.
- Config actual: `src/config/components.ts`.
- Modelo DC en simulador: conductancia `g = 1/R` (si `R<=0`, fallback alto `1e6` para evitar singularidades).
- Ecuaciones:
  - `V = I * R`
  - `I = V / R`
  - `P = V * I = I^2 * R = V^2 / R`

### Capacitor (`capacitor`)

- Vista actual: simbolo de dos placas con pines `left` y `right`.
- Config actual: `src/config/components.ts`.
- Modelo DC en simulador: en regimen estacionario se aproxima a circuito abierto con `g = GMIN` (`1e-12`).
- Ecuaciones fisicas (no transitorio implementado aun):
  - `Q = C * V`
  - `i(t) = C * dv(t)/dt`
  - `E = 0.5 * C * V^2`

### Inductor (`inductor`)

- Vista actual: bloque con trazo de bobina y pines `left` y `right`.
- Config actual: `src/config/components.ts`.
- Modelo DC en simulador: aproximado a cortocircuito con `g = 1e6`.
- Ecuaciones fisicas (no transitorio implementado aun):
  - `v(t) = L * di(t)/dt`
  - `E = 0.5 * L * I^2`

### Bateria (`battery`)

- Vista actual: circulo con pines `pos` y `neg`.
- Config actual: `src/config/components.ts`.
- Modelo DC en simulador: fuente ideal de voltaje, estampada en MNA como ecuacion de fuente.
- Ecuaciones:
  - Ideal: `V = constante`
  - Simple no ideal sugerido: `Vterminal = E - I * Rint`

## 3) Estructura de configuracion actual (repositorio)

Hoy existe un objeto central `COMPONENTS_CONFIG` en `src/config/components.ts` con:

- `label`, `labelPos`, `labelSize`, `labelFill`
- Propiedades visuales (`fill`, `stroke`, `width`, `height`, `radius`)
- `pins` con offsets relativos

Adicionalmente:

- Valores por defecto: `DEFAULT_VALUES` en `src/core/Component.ts`
- Unidades: `UNIT_MAP`
- Registro de vistas: `ComponentMap` en `src/Components/ViewRegistry.ts`

## 4) Matematica de simulacion actual

Implementada en `src/core/Solver.ts`.

- Se construye un netlist conectando pines y uniones por grafo.
- Se identifican nodos electricos por componentes conexas del grafo.
- Se aplica MNA (Modified Nodal Analysis):
  - Pasivos por estampado de conductancias.
  - Baterias como fuentes de voltaje con variables de corriente adicionales.
- Se resuelve sistema lineal por eliminacion gaussiana.
- Se reporta por componente: `voltage`, `current`, `power` y total.

Limitaciones actuales:

- Solo analisis DC estacionario.
- Capacitor/inductor modelados por aproximacion DC (sin dinamica temporal).
- Sin fuentes AC, dependientes o no lineales.

## 5) Propuesta: llevar TODO a estructura facilmente configurable

Objetivo: que un componente se defina por configuracion (no por codigo disperso).

### 5.1 Esquema unificado de componente (frontend + backend)

Proponer `ComponentDefinition` versionado:

```ts
type PinDef = {
  id: string;
  label: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  x: number;
  y: number;
  electricalRole?: 'anode' | 'cathode' | 'pos' | 'neg' | 'generic';
};

type ParameterDef = {
  key: string;           // R, C, L, V, ESR, etc.
  label: string;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
};

type ViewVariant = {
  id: string;            // symbolic_iec, symbolic_ansi, realistic_2d
  label: string;
  renderer: 'svgPath' | 'konvaPrimitives';
  payload: unknown;      // paths, primitives, style tokens
};

type SimulationModel = {
  modelType: 'resistor' | 'capacitor' | 'inductor' | 'vsource' | 'custom';
  regime: 'dc' | 'transient' | 'ac';
  equationsLatex: string[];
  stampStrategy: string; // nombre de estrategia en motor
};

type ComponentDefinition = {
  key: string;
  displayName: string;
  category: string;
  pins: PinDef[];
  parameters: ParameterDef[];
  views: ViewVariant[];
  docsRef?: string;
  simulation: SimulationModel[];
  version: number;
};
```

Con esto, agregar un componente nuevo seria registrar un JSON/DB + renderer generico.

### 5.2 Vistas intercambiables por componente

Implementar selector global de vista:

- `symbolic_iec` (diagramas IEC)
- `symbolic_ansi` (diagramas ANSI)
- `realistic_2d` (vista mas visual)

El `Circuit` debe pedir la variante por `component.type` y `activeViewProfile`.
Si una variante no existe, usar fallback a `symbolic_iec`.

### 5.3 Creador de componentes (modulo nuevo)

Pantalla "Component Builder" con pestañas:

1. Metadata: nombre, clave, categoria.
2. Pines: posicion, nombre, rol electrico.
3. Forma: editor visual (SVG/Konva) para variantes IEC/ANSI/realista.
4. Parametros: rangos, unidad, valor por defecto.
5. Simulacion: tipo de modelo y estrategia de stamping.
6. Preview + pruebas basicas.

Resultado: genera `ComponentDefinition` valido y publicable.

## 6) Medidores (multimetro y osciloscopio) con perillas

Propuesta funcional:

- **Multimetro virtual**:
  - Modos por perilla: `Vdc`, `Vac`, `Adc`, `Aac`, `Ohm`, `Continuidad`.
  - Escalas por perilla secundaria: auto/manual (200m, 2, 20, 200, etc.).
  - Entradas: puntas roja/negra conectables a nodos.
  - Integracion: en DC inicial habilitar `Vdc`, `Adc`, `Ohm`; luego ampliar.

- **Osciloscopio virtual**:
  - Canales CH1/CH2 y GND.
  - Perillas: `Volt/div`, `Time/div`, trigger level, acoplamiento AC/DC.
  - Para verlo bien se requiere motor transitorio (`solveTransient`) y buffer de muestras.

Modelo de configuracion de instrumento:

```ts
type KnobDef = {
  id: string;
  label: string;
  values: Array<string | number>;
  defaultValue: string | number;
};
```

## 7) Documentacion editable dentro de la app

Requerimientos solicitados: editor integrado, formulas bonitas, imagen/video embebido.

Propuesta:

- Editor Markdown enriquecido (WYSIWYM) con:
  - Soporte LaTeX (`$...$`, `$$...$$`) para formulas bonitas.
  - Upload/insert de imagen, video y archivos adjuntos.
  - Vista previa en tiempo real.
- Renderizador en visor:
  - Markdown + KaTeX/MathJax + bloques multimedia responsivos.
- Estructura del documento:
  - `componentId`, `version`, `contentMd`, `attachments[]`, `updatedBy`, `updatedAt`.

## 8) Recordar ultimo componente visto en el visor

Implementacion minima local:

- Guardar `lastViewedComponentDocId` en `localStorage` al cambiar seleccion.
- Al abrir modal de docs, inicializar seleccion con ese valor si existe.

Implementacion SaaS recomendada:

- Guardar preferencia por usuario en backend (`user_preferences`).
- Fallback a `localStorage` cuando no hay sesion iniciada.

## 9) Que llevar al backend (SaaS)

### 9.1 Debe ir al backend

- Autenticacion/autorizacion: registro, login, refresh tokens, recuperacion de clave.
- Gestion multiusuario y multiworkspace (equipo/proyecto).
- Persistencia de:
  - Definiciones de componentes (`ComponentDefinition`).
  - Documentacion por componente y sus adjuntos.
  - Circuitos guardados/versionados.
  - Preferencias de usuario (vista activa, ultimo doc visto, tema de UI).
- Catalogo de instrumentos y presets.

### 9.2 Puede quedarse local inicialmente

- Estado efimero de interaccion de canvas (seleccion temporal, drag actual).
- Cache de rutas de cables calculadas.

### 9.3 API sugerida (resumen)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `GET/POST /components-definitions`
- `GET/PUT /components-definitions/:id/docs`
- `POST /media/upload`
- `GET/POST /circuits`, `GET /circuits/:id`
- `GET/PUT /users/me/preferences`

## 10) Base de datos sugerida

Tablas/colecciones:

- `users`
- `organizations` / `workspaces`
- `component_definitions`
- `component_doc_versions`
- `component_media_assets`
- `circuit_projects`
- `circuit_revisions`
- `user_preferences`

## 11) Plan de implementacion por fases

Fase 1 (corto plazo):

1. Unificar schema de componente en frontend.
2. Selector de vista (`IEC/ANSI/realista`) con fallback.
3. Recordar ultimo componente abierto en docs.
4. Limpiar estilos base manteniendo color sobrio actual (familia azul-gris).

Fase 2:

1. Integrar editor de documentacion con formulas y multimedia.
2. Persistir docs/componentes/circuitos en backend.
3. Login/registro SaaS base.

Fase 3:

1. Modulo creador de componentes visual.
2. Multimetro completo con perillas.
3. Motor transitorio + osciloscopio con perillas.

## 12) Lineamientos de diseno solicitados (sobrio/elegante/sencillo)

Mantener color base actual de fondos (`#1f2d3a`, `#263746`, `#2c3e50`) y evolucionar con:

- Paleta neutra azul-gris + acentos puntuales funcionales (verde simular, rojo error, cyan seleccion).
- Tipografia consistente y limpia (sin look generico por defecto).
- Jerarquia visual clara, densidad moderada, bordes suaves y contraste legible.
- Controles de perilla realistas pero minimalistas (sin sobrecarga visual).

---

## Referencias de codigo revisadas

- `src/App.tsx`
- `src/hooks/useCircuitStore.ts`
- `src/core/Solver.ts`
- `src/config/components.ts`
- `src/core/Component.ts`
- `src/Components/Circuit.tsx`
- `src/Components/ViewRegistry.ts`
- `src/Components/ComponentDocsModal.tsx`
- `src/Components/SimulationPanel.tsx`
- `src/docs/components/resistor.md`
- `src/docs/components/capacitor.md`
- `src/docs/components/inductor.md`
- `src/docs/components/battery.md`
