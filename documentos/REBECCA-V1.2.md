# Rebecca V1.2 - Artesania 3D real premium

## Resumen

V1.2 convierte el creador `/disena-tu-pieza` en una experiencia 3D real con Three.js. El chat interno sigue generando la ficha artesanal, pero ahora sus parametros alimentan una escena WebGL interactiva con rotacion, zoom, luces calidas, sombras, texturas procedurales y controles Liquid Glass.

## Implementado

- Dependencias frontend: `three` y `@types/three`.
- Nuevo `Craft3DViewerComponent` lazy dentro del diseñador publico.
- Escena 3D con `WebGLRenderer`, `PerspectiveCamera`, `OrbitControls`, luces, suelo y fallback si WebGL no esta disponible.
- Generadores procedurales iniciales para `lamp`, `vase`, `tray` y `planter`.
- Geometrias reales: `LatheGeometry`, `ExtrudeGeometry`, `TubeGeometry`, `TorusGeometry` e `InstancedMesh`.
- Materiales artesanales con `CanvasTexture` procedural para fibra, veta, barro, tejido y esmalte.
- Captura de miniatura 3D para adjuntar al encargo si no existe boceto OpenAI.
- Contrato `threeD` extendido con `engineVersion`, `materialPreset`, `detailLevel`, `cameraPreset`, `surfaceTexture`, `ornamentStyle` y `parts`.
- Prompt y fallback local del `ai-service` actualizados para generar specs 3D mas utiles y bonitas.

## Verificacion

- `mvn -q -pl ai-service test`: paso.
- `cd frontend && npm test -- --watch=false`: paso.
- `cd frontend && npm run build`: paso.
- Bundle inicial se mantiene en `802.14 kB`; Three.js queda en chunk lazy de `ai-designer`.
- Auditoria Playwright en `qa-screenshots/v12-3d/` para:
  - `360x780`
  - `390x844`
  - `430x932`
  - `768x1024`
  - `1366x768`
  - `1440x900`
- `v12-3d-audit.json` confirma canvas presente y pixeles renderizados en todos los tamaños.
- Prueba de interaccion guardada en `designer-3d-interaction-390x844.png`.

## Nota canonica

- V1.2 no usa text-to-3D externo.
- La belleza visual depende de geometria procedural controlada y materiales artesanales; la carga `GLTFLoader` queda preparada para una futura biblioteca de modulos hechos en Blender.
- Visitantes pueden idear y observar 3D sin login; confirmar al taller sigue exigiendo autenticacion.
- Antes de desplegar V1.2, repetir build Docker y smoke tests sobre `/disena-tu-pieza`.
