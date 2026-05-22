# Instrucciones de prueba

Este archivo se actualiza con los cambios implementados para validar cada funcionalidad.

## 1) Recordar ultimo componente visto en documentacion

1. Ejecuta la app con `npm run dev`.
2. Abre `Docs` en el panel izquierdo.
3. Selecciona, por ejemplo, `Inductor`.
4. Cierra el modal.
5. Vuelve a abrir `Docs`.
6. Verifica que se abra nuevamente en `Inductor`.

Resultado esperado:

- El modal recuerda el ultimo componente seleccionado.

## 2) Selector global de vista de componente (estructura base)

1. En el panel izquierdo, ubica el selector `Vista de componente`.
2. Cambia entre `Simbolica IEC`, `Simbolica ANSI` y `Realista 2D`.
3. Agrega componentes y confirma que el circuito sigue renderizando correctamente.
4. Recarga la pagina del navegador.
5. Verifica que el selector conserva la ultima opcion elegida.

Resultado esperado:

- La seleccion de perfil de vista persiste tras recargar.
- El render del circuito sigue estable al cambiar perfiles.

Nota:

- En esta fase, los tres perfiles usan el mismo renderer por componente (fallback listo para variantes futuras).

## 3) Refactor inicial a esquema unificado de componente

1. Agrega cada tipo de componente y abre su modal de edicion (doble clic).
2. Revisa nombre y unidad mostrados en el modal.
3. Crea un componente nuevo desde toolbar y valida su valor inicial.

Resultado esperado:

- El modal muestra nombre/unidad coherentes por tipo.
- Los valores iniciales siguen funcionando como antes.

## 4) Verificacion tecnica recomendada

1. Ejecuta `npm run build`.
2. Confirma que finaliza sin errores.

## 5) Variantes visuales IEC vs ANSI

1. Ejecuta `npm run dev`.
2. En el selector `Vista de componente`, elige `Simbolica IEC`.
3. Agrega resistor, capacitor, inductor y bateria; observa su dibujo.
4. Cambia a `Simbolica ANSI`.
5. Verifica que cambian las formas visuales (ej. resistor en zig-zag, bateria en placas).

Resultado esperado:

- IEC y ANSI muestran simbolos diferentes.
- El circuito mantiene posicion/pines/rotacion al cambiar perfil.

## 6) Tipado consistente de cables

1. Crea un circuito sencillo con 2-3 componentes y varios cables.
2. Mueve componentes, elimina un cable y vuelve a simular.
3. Recarga la pagina.

Resultado esperado:

- Los cables siguen conectados correctamente.
- No hay errores de compilacion relacionados con `Wire`.

## 7) Editor integrado de documentacion (esqueleto)

1. Abre `Docs`.
2. Selecciona un componente.
3. Pulsa `Editar`.
4. Modifica el Markdown y pulsa `Guardar borrador`.
5. Vuelve a `Vista`.
6. Cierra y reabre `Docs`.

Resultado esperado:

- Se muestra el contenido editado en el visor.
- El borrador persiste tras cerrar y reabrir.

Prueba de reset:

1. En modo `Editar`, pulsa `Reset`.
2. Vuelve a `Vista`.

Resultado esperado:

- Se restaura el contenido base del archivo `.md` del componente.

## 8) Refactor a componente reutilizable de editor

1. Abre `Docs` y entra en modo `Editar`.
2. Verifica que el panel de edicion funciona igual que antes (editar, guardar, reset).

Resultado esperado:

- El comportamiento es igual, pero ahora el editor esta encapsulado en `DocEditorPanel`.

## 9) Render basico de formulas

1. Abre `Docs` y elige un componente.
2. En modo `Editar`, agrega una linea como: `Ley de Ohm: $V = I * R$`.
3. Agrega otra linea como: `$$P = V * I$$`.
4. Guarda borrador y vuelve a `Vista`.

Resultado esperado:

- La formula inline entre `$...$` se ve resaltada en linea.
- La formula en bloque entre `$$...$$` se muestra en un bloque destacado.

Nota:

- En esta fase es un render visual basico (no motor LaTeX completo).

## 10) Capa de servicios mock pre-backend

1. Usa `Docs` para guardar y resetear borradores de dos componentes distintos.
2. Cierra y reabre el modal.

Resultado esperado:

- Los borradores siguen persistiendo por componente.
- El flujo usa una capa de servicios (`src/services/componentDocs.ts`, `src/services/componentCatalog.ts`) que facilita migrar a API real.

## 11) Backend real fuera del frontend

Ubicacion del backend:

- `C:\Users\UsEr\Desktop\projects\electronic-simulator\circuit-simulator-backend`

Arranque:

1. Abre una terminal en esa carpeta.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.
4. Verifica `http://localhost:4000/health` devuelve `{ "ok": true }`.

## 12) Frontend conectado a backend real

1. En el frontend, crea `.env` basado en `.env.example`.
2. Asegura `VITE_API_BASE_URL=http://localhost:4000`.
3. Ejecuta `npm run dev` en el frontend.
4. Abre `Docs`, edita un componente y guarda borrador.
5. Cierra app, vuelve a abrir, y confirma persistencia.

Resultado esperado:

- El frontend usa fetch HTTP contra backend real.
- Si backend no esta disponible, el sistema mantiene fallback local.

## 13) Verificacion de persistencia real en backend

1. Con backend corriendo, guarda un borrador en `Docs`.
2. Revisa archivo `circuit-simulator-backend/data/db.json`.
3. Busca la entrada en `docs` para `public:<componentId>`.

Resultado esperado:

- El markdown queda guardado en `db.json` por componente.

## 14) Login / registro real contra backend

1. Con backend corriendo, abre el frontend.
2. En toolbar, pulsa `Login / Registro`.
3. Registra una cuenta nueva (nombre, email, password).
4. Cierra sesion con `Salir`.
5. Inicia sesion con ese usuario.

Resultado esperado:

- Se autentica correctamente.
- El nombre del usuario aparece en toolbar.

## 15) Preferencias de usuario en backend

1. Inicia sesion.
2. Cambia `Vista de componente` a `Simbolica ANSI`.
3. Abre `Docs` y selecciona un componente distinto (por ejemplo `Battery`).
4. Cierra y vuelve a abrir la app (backend activo).

Resultado esperado:

- Se recupera la vista activa guardada del usuario.
- Se recupera el ultimo componente visto en docs del usuario.

Verificacion tecnica opcional:

1. Revisa `circuit-simulator-backend/data/db.json`.
2. En `preferences`, busca la entrada del usuario.

Resultado esperado:

- Deben existir `activeViewProfile` y `lastViewedComponentDocId`.

## 16) Perfil de usuario (frontend)

1. Inicia sesion.
2. En toolbar, pulsa `Perfil`.
3. Verifica datos mostrados (id, nombre, email).

Resultado esperado:

- El modal muestra informacion del usuario autenticado.

## 17) Guardar/cargar circuito en nube

1. Inicia sesion.
2. Crea un circuito de prueba (componentes + cables).
3. Pulsa `Guardar nube`.
4. Limpia circuito o modifica fuerte el estado.
5. Pulsa `Cargar nube`.

Resultado esperado:

- Se restaura el circuito guardado en backend para ese usuario.

Verificacion tecnica opcional:

1. Revisa `circuit-simulator-backend/data/db.json`.
2. Busca en `circuits` la entrada con el `userId`.

Resultado esperado:

- Debe existir un objeto con `components`, `wires`, `junctions` y `updatedAt`.

## 18) Auto-sync con debounce

1. Inicia sesion.
2. Activa `Auto-sync: ON`.
3. Mueve/agrega componentes y espera ~2 segundos sin tocar nada.
4. Recarga app y usa `Cargar nube`.

Resultado esperado:

- Los cambios recientes se guardan automaticamente en backend.

## 19) Manejo de conflicto local vs nube/proyecto

1. Carga un circuito desde nube o proyecto.
2. Modificalo localmente.
3. Sin guardar, intenta `Cargar nube` o `Cargar` proyecto.

Resultado esperado:

- Aparece confirmacion antes de reemplazar cambios locales distintos.

## 20) CRUD de proyectos de circuito

1. Inicia sesion.
2. Pulsa `Nuevo` y crea un proyecto.
3. Construye circuito y pulsa `Guardar`.
4. Crea otro circuito, luego pulsa `Cargar` en el proyecto guardado.
5. Pulsa `Borrar` para eliminar proyecto.

Resultado esperado:

- Se puede crear, listar, guardar, cargar y borrar proyectos por usuario.

Verificacion tecnica opcional:

1. Revisa `circuit-simulator-backend/data/db.json`.
2. Busca `circuitProjects` en la clave del usuario.

Resultado esperado:

- Debe existir la lista de proyectos con `id`, `name`, `circuit`, `updatedAt`.

## 21) UI consistente sin prompt/confirm nativo

1. Ejecuta acciones que antes abrían `prompt/confirm`:
   - `Nuevo`
   - `Renombrar`
   - `Borrar`
   - `Cargar nube` o `Cargar` con cambios locales distintos.

Resultado esperado:

- Se usan modales visuales de la app (no dialogos nativos del navegador).

## 22) Renombrar proyecto

1. Selecciona un proyecto existente.
2. Pulsa `Renombrar`.
3. Escribe nuevo nombre y guarda.

Resultado esperado:

- El nombre se actualiza en el selector de proyectos.

## 23) Recordar ultimo proyecto activo

1. Inicia sesion y selecciona un proyecto en el selector.
2. Recarga la app con backend activo.

Resultado esperado:

- La preferencia `lastProjectId` se recupera y el selector vuelve al ultimo proyecto activo.

## 24) Documentation Studio completo (KaTeX + media + historial)

1. Abre `Docs`.
2. Cambia a modo `Split`.
3. Escribe una formula como `$$E = mc^2$$` y verifica render matematico real.
4. Pulsa `Subir imagen` y selecciona un archivo local.
5. Pulsa `Subir video` y selecciona un archivo local.
6. Guarda con boton `Guardar` o `Ctrl+S`.
7. En el editor, inserta una tabla Markdown (con `+ Tabla` o manualmente) y valida preview.

Resultado esperado:

- La formula se renderiza con KaTeX.
- Imagen y video se insertan y renderizan en preview.
- El documento queda persistido.
- Las tablas Markdown se renderizan correctamente con bordes y encabezado.

## 25) Historial y restore de versiones

1. Edita un componente y guarda varias veces con cambios distintos.
2. En panel `Historial` (derecha), selecciona una version previa.
3. Verifica que el contenido de esa version se carga en el editor.
4. Guarda nuevamente para restaurar esa version como actual.

Resultado esperado:

- El historial muestra timestamps y usuario.
- Se puede restaurar una version previa de forma manual.

## 26) Docs custom con relacion opcional + eliminar + etiquetas

1. Abre `Docs`.
2. En `Nueva doc (titulo)`, escribe por ejemplo `Notas de montaje`.
3. En el selector `Relacion opcional`, elige `Resistencia` y pulsa `Crear`.
4. Verifica en la lista izquierda que la nueva entrada aparece con badge `General`.
5. Selecciona esa doc y valida en la franja de metadata que muestra `Relacionado: Resistencia`.
6. Crea otra doc dejando `Relacion opcional: General`.
7. Verifica que en la lista se distinguen por badge:
   - `Componente` para docs base de componentes.
   - `General` para docs custom.
8. Selecciona una doc custom y pulsa `Eliminar doc`.
9. Verifica que aparece modal in-app de confirmacion antes de eliminar.
10. Pulsa `Cancelar` y confirma que la doc sigue en la lista.
11. Repite `Eliminar doc`, confirma y valida que ahora si se elimina.
12. Haz cambios en un documento y pulsa `Reset`.
13. Verifica que tambien aparece modal in-app de confirmacion para evitar perdida accidental.

Resultado esperado:

- Se puede crear doc custom con o sin componente relacionado.
- La relacion opcional se refleja en metadata del documento.
- El listado muestra etiqueta visual `Componente` vs `General` para escaneo rapido.
- Al eliminar una doc custom, desaparece de la lista y no se vuelve a cargar.
- Las acciones destructivas del modal (`Eliminar doc`, `Reset`) piden confirmacion visual in-app.
