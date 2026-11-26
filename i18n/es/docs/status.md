# Lo que existe hoy

[English](../../../docs/status.md) · [简体中文](../../zh-CN/docs/status.md) · [日本語](../../ja/docs/status.md) · Español · [Português](../../pt-BR/docs/status.md) · [Tiếng Việt](../../vi/docs/status.md) · [Türkçe](../../tr/docs/status.md)

Parte por parte, con lo que es un borrador y lo que no ha empezado. Se actualiza con el código.

| Parte | Estado |
|---|---|
| Esquema de la traza, [`spec/schema.ts`](../../../spec/schema.ts) | Borrador. Con comprobación de tipos, un ejemplo validado y un [JSON Schema](../../../spec/trace.schema.json) generado. Un paso puede llevar evidencias (una captura, dónde cayó el dedo) para las herramientas que muestran una traza |
| Contrato del adaptador, [`spec/contract.ts`](../../../spec/contract.ts) | Borrador. Con comprobación de tipos |
| Siete leyes, [`spec/laws.md`](../../../spec/laws.md) | Borrador |
| Núcleo, [`packages/core`](../../../packages/core/src/index.ts) | Primera parte: grabar una traza a través de un driver, validarla, calcular su hash, resolver parámetros, comprobar un mapa de fuentes, distinguir un bug registrado de una regresión |
| Comando `ecr`, [`packages/cli`](../../../packages/cli/src/run.ts) | Se ejecuta desde este repositorio: `validate`, `compile`, `replay`, `repair`, `conformance`. Aún no está en npm. Ver [el comando](command.md) |
| Servidor MCP, para que un agente explore | Sin empezar. Abierto a contribuciones: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Adaptador de referencia, [`packages/adapter-fixture`](../../../packages/adapter-fixture/src/adapter.ts) | Funciona. Una lista de tareas en memoria, compilada a un archivo `node:test` normal |
| Kit de conformidad, [`packages/conformance`](../../../packages/conformance/src/index.ts) | Comprueba L1, L2, L3, L4 (con la red cerrada), L5 y L7, y parte de L6 |
| Reparación, [`packages/core`](../../../packages/core/src/repair.ts) | Primera parte: `ecr repair` acepta o rechaza una nueva acción para el paso que se desvió. No llama a ningún modelo y no propone nada por sí mismo. En LocalSend, en emuladores Android, aceptó la propuesta de un agente para 25 de las 26 trazas rotas por un texto reformulado, sin cambiar ninguna comprobación, y rechazó toda propuesta sobre una comprobación fallida. Un cambio que necesita dos pasos se rechaza |
| Adaptador móvil, [`packages/adapter-maestro`](../../../packages/adapter-maestro/README.md) | Borrador. Un vocabulario móvil y un compilador a flujos de [Maestro](https://maestro.dev). En un emulador Android, contra la app de demostración de mobile-agent-testers: dos flujos escritos a mano se reproducen en una [ejecución lanzada a mano](../../../.github/workflows/device.yml), y de cuatro caminos explorados por un agente, dos se detuvieron en un paso y dos, de 37 y 25 pasos, se reprodujeron enteros sin modelo. Un fallo nombra su paso o su comprobación. Sin driver. No probado en iOS. En LocalSend, una app real: 7 trazas conservadas de 20 exploraciones de un agente, y 137 de 140 reproducciones en la app sin cambios dieron lo que registra la traza, sin modelo ([resultados](../README.md#results-on-localsend)). 20 de los 24 caminos de un robot sin modelo se reprodujeron enteros |
| Adaptador web, que compile a tests de Playwright | Sin empezar. Abierto a contribuciones: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Benchmark de deriva: ¿una reproducción se rompe, se repara o se queda en rojo cuando debe? | Ejecutado en LocalSend: 25 cambios en cinco clases, con los [mutantes](../../../drift-bench/mutants/localsend/README.md) escritos después de congelar las trazas, como pide el [protocolo](../../../paper/protocol.md). Ningún cambio de comportamiento terminó en verde. Resultados por clase: [README](../README.md#results-on-localsend), archivos en [`paper/results/`](../../../paper/results/) |
| Artículo | Escrito: [el PDF](../../../paper/ecr-paper.pdf), 8 páginas, con la evaluación en LocalSend. El preprint se publicará en Zenodo con la primera versión |
