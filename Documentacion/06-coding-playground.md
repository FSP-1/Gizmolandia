# 06 - Coding Playground

## Objetivo

El componente `coding` funciona como un playground visual para editar y ejecutar ejemplos de HTML + CSS y TypeScript dentro de Gizmolandia.

## Qué se hizo

- Se añadió una barra lateral plegable para elegir el lenguaje y dejar más espacio al editor.
- Se cargan ejemplos desde `public/assets/html-css-cool` y `public/assets/typescript-cool`.
- Se usa un shell visual compartido desde `public/assets/codigo` para mantener el aspecto del preview.
- La ejecución de cada ejemplo es manual, mediante botón `Ejecutar`.
- El TypeScript se ejecuta dentro de un iframe aislado con sandbox.

## Internacionalización

Se añadieron cadenas en español e inglés para:

- Título y subtítulo del playground
- Botones de navegación
- Etiquetas del panel lateral
- Ayudas del editor
- Estados de carga y ejecución

## Resultado

El área de código quedó más ordenada, con mejor uso del ancho disponible y con previews separados por modo.

## Cómo se consiguió la seguridad

Se aplicó una estrategia de defensa en profundidad para minimizar riesgos al ejecutar código de ejemplo dentro del playground:

- **Ejecución aislada en iframe sandbox:** los snippets de TypeScript y el HTML generado se ejecutan dentro de iframes con atributo `sandbox` (solo `allow-scripts` cuando es necesario). Esto impide el acceso directo al `window`/DOM del padre y restringe capacidades del código ejecutado.
- **Ejecución manual:** la ejecución ocurre únicamente al pulsar el botón `Ejecutar`, evitando ejecución automática de código potencialmente malicioso al cargar la página.
- **Saneamiento de HTML y CSS:** antes de inyectar cualquier fragmento HTML/CSS en el preview se aplican filtros que eliminan etiquetas y atributos peligrosos (por ejemplo `<script>`, `on*` handlers, `javascript:` URLs, `@import` en CSS), reduciendo vectores de XSS.
- **Transformación y limpiezas de TypeScript:** los ejemplos TypeScript se transforman en JavaScript mediante una rutina local (se eliminan tipos, `export`/`import` y tokens no válidos para ejecución directa) para evitar incluir un compilador completo en el bundle y minimizar superficie de ataque.
- **Lista de bloqueo (denylist) en tiempo de ejecución:** antes de ejecutar código transformado, se comprueba contra una denylist de identificadores y APIs peligrosas (por ejemplo `window`, `document`, `top`, `location`, `fetch`, `WebSocket`, `eval`, `Function`, `require`, `process`), cancelando la ejecución si aparecen patrones no permitidos.
- **Separación de assets estáticos:** el shell visual del preview y los ejemplos están en `public/assets/...`, lo que evita mezclar lógica de la app con contenido ejecutable y facilita auditoría manual de los ejemplos incluidos.
- **Reducción de la superficie de bundling:** no se incluyen librerías de Node ni compiladores pesados en el bundle del navegador (evita `path`, `process`, etc.), reduciendo bibliotecas con permisos inesperados.


Estas protecciones se diseñaron como capas complementarias: si una defensa falla, las otras ayudan a mitigar el impacto.