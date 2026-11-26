<div align="center">

<img src="../../assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**Un agente explora tu app una vez. Lo que hizo se convierte en un test estándar que se vuelve a ejecutar en CI sin ningún modelo.**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](../../LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[Inicio rápido](#quick-start)** · **[Documentación](docs/command.md)** · **[Artículo y especificación](#paper-and-specification)** · **[Contribuir](../../CONTRIBUTING.md)** · **[Cambios](../../CHANGELOG.md)**

<sub>[English](../../README.md) · [简体中文](../zh-CN/README.md) · [日本語](../ja/README.md) · Español · [Português](../pt-BR/README.md) · [Tiếng Việt](../vi/README.md) · [Türkçe](../tr/README.md)</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/linkedin-follow-dark.svg"><img src="../../assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/discord-join-dark.svg"><img src="../../assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/paper-dark.svg"><img src="../../assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/how-it-works-dark.svg"><img src="../../assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

Los agentes de IA encuentran bien lo que nadie pensó en probar. También son lentos, cuestan dinero en cada ejecución y nunca toman el mismo camino dos veces, así que no encajan en CI. Explore-Compile-Replay (ECR) conserva lo primero y quita lo demás: el agente se ejecuta una vez, y su camino se guarda como un archivo de test normal que cualquiera puede leer, revisar y ejecutar.

> **Borrador inicial, abierto el 24 de noviembre de 2026.** Funciona de principio a fin en un sistema de juguete y en una app móvil de demostración, todavía no en una app real: [en qué punto está](#where-it-stands).

<a name="quick-start"></a>

## Inicio rápido

Necesitas Node 22.18 o posterior y pnpm. Aún no hay nada en npm: se ejecuta desde un clon.

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

Esto reproduce una traza grabada contra una lista de tareas en memoria, el sistema de referencia. Todos los comandos: [docs/command.md](docs/command.md).

## Cómo funciona

1. **Explore (explorar).** Un agente interpreta a una persona y usa el sistema una vez. Cada acción y cada comprobación se registran en una traza tipada.
2. **Compile (compilar).** La traza se convierte en un archivo de test estándar, hoy un flujo de [Maestro](https://maestro.dev) para una app móvil. Se ejecuta sin ECR.
3. **Replay (reproducir).** El archivo se ejecuta en CI. Sin modelo, sin tokens, el mismo veredicto cada vez.

Cuando la app cambia y un paso se rompe, tu agente propone una nueva acción para ese paso, y una **reparación** acotada la acepta o la rechaza. Una reparación puede cambiar cómo un paso encuentra su objetivo, nunca lo que el test comprueba. Un bug que encontró el agente también se conserva: se compila en un test que queda en rojo hasta que el bug se corrige.

<details>
<summary>Un paso de una traza, y lo que produce al compilarse</summary>

```json
{
  "id": "s8",
  "action": { "kind": "tapOn", "target": { "text": "Save" } },
  "checkpoints": [
    { "id": "item-listed", "check": { "kind": "visible", "target": { "text": { "param": "ITEM_TITLE" } } } }
  ]
}
```

```yaml
# Step s8
- tapOn:
    text: "Save"
# Oracle item-listed
- assertVisible:
    text: "${ITEM_TITLE}"
```

El toque se guarda por el nombre del botón, no por su posición en la pantalla. El texto escrito se guarda por su nombre, nunca por su valor. El ejemplo completo: [la traza](../../packages/adapter-maestro/examples/anna-first-item-mobile.trace.json) y [el flujo](../../packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml).

</details>

<details>
<summary>Los cuatro resultados de una reproducción</summary>

| Resultado | Significado |
|---|---|
| `pass` | Todas las comprobaciones se cumplen |
| `bug` | La reproducción se detiene en el bug que registra la traza, y en nada más |
| `fixed` | La comprobación registrada como bug ahora se cumple. Pasa a ser una protección |
| `FAIL` | Cualquier otra cosa: un paso ya no encuentra su objetivo, o una comprobación que se cumplía ya no se cumple |

</details>

<a name="paper-and-specification"></a>

## Artículo y especificación

ECR quiere ser un estándar que cualquiera pueda implementar, no una herramienta.

- **Especificación.** El [formato de traza](../../spec/schema.ts), publicado también como [JSON Schema](../../spec/trace.schema.json), el [contrato del adaptador](../../spec/contract.ts) y [siete leyes](../../spec/laws.md): determinismo, fidelidad, trazabilidad, sin modelo, estado, reparación segura, sin secretos. Son borradores que aún pueden cambiar.
- **Kit de conformidad.** Comprueba un adaptador ley por ley. Un adaptador que lo pasa es conforme, lo haya escrito quien lo haya escrito. Cómo escribir uno: [docs/adapter.md](docs/adapter.md).
- **Artículo.** El patrón, el contrato y una evaluación en una app real, [LocalSend](https://github.com/localsend/localsend). Su [protocolo](../../paper/protocol.md) se publicó antes de la primera medición. En redacción: el preprint llegará a Zenodo con la primera versión.
- **Cita.** [CITATION.cff](../../CITATION.cff), o "Cite this repository" en la página del repositorio, y una insignia para los proyectos que usan ECR: [citar ECR](#citing-ecr).

<details>
<summary>Las siete leyes en resumen</summary>

| | Ley | En resumen |
|---|---|---|
| L1 | Determinismo | La misma traza compila a los mismos bytes. El mismo archivo da el mismo veredicto |
| L2 | Fidelidad | El archivo ejecuta las acciones y comprobaciones de la traza, en el mismo orden |
| L3 | Trazabilidad | Cada paso de la traza corresponde a un rango distinto del archivo |
| L4 | Sin modelo | Compilar y reproducir no llaman a ningún modelo |
| L5 | Estado | Un estado guardado, una vez restaurado, se observa idéntico, cuando el adaptador puede guardarlo |
| L6 | Reparación segura | Un parche se queda dentro del paso que falla, y no elimina ni debilita ninguna comprobación |
| L7 | Sin secretos | Ni la traza ni el archivo contienen un valor secreto |

</details>

<a name="where-it-stands"></a>

## En qué punto está

- **Funciona hoy:** el comando `ecr` (`validate`, `compile`, `replay`, `repair`, `conformance`), un adaptador de referencia y un adaptador móvil que compila a flujos de Maestro, reproducido en un emulador Android.
- **En curso:** una app real, LocalSend, y la primera versión, con el preprint y un DOI.
- **Todavía no:** iOS, una reparación en un dispositivo, un paquete en npm.

Parte por parte: [docs/status.md](docs/status.md).

## De dónde viene

ECR generaliza [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), que da un teléfono a cada tester de IA en los runners de GitHub y es el primer proyecto que escribe trazas de ECR. La forma de la idea viene de [Remotion](https://www.remotion.dev), donde un vídeo es código: una IA lo escribe una vez, y cada render da el mismo vídeo sin modelo. Aquí el agente explora una vez, y la reproducción es el render.

<details>
<summary>ECR no pretende ser el primero: las herramientas anteriores</summary>

Varias herramientas ya guardan o reproducen lo que hizo un agente, cada una para su propio sistema: [Stagehand](https://github.com/browserbase/stagehand), [Skyvern](https://github.com/Skyvern-AI/skyvern), [workflow-use](https://github.com/browser-use/workflow-use), [Midscene](https://github.com/web-infra-dev/midscene), [Arbigent](https://github.com/takahirom/arbigent), [muscle-mem](https://github.com/pig-dot-dev/muscle-mem) y [autocompile](https://github.com/mirkokiefer/autocompile). Lo que aporta este proyecto es un nombre para el patrón y un contrato escrito: uno que sirve para distintos sistemas, compila a archivos que se ejecutan sin la herramienta, protege lo que comprueban los tests y puede verificarse con un kit de conformidad.

</details>

<a name="build-with-ecr"></a>

## Construir con ECR

ECR es un patrón, no una herramienta móvil: cualquier sistema que un agente pueda usar se puede explorar una vez y reproducir después sin modelo. Abajo hay ideas de proyectos para construir sobre él. Los primeros repositorios que construyan una de ellas como es debido aparecerán aquí, y cualquiera puede proponer una idea nueva.

**Construido con ECR:** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), para apps móviles, el primer proyecto que escribe trazas ECR.

<details>
<summary>Ideas para construir</summary>

- **Tests de seguridad de tu propia app.** Un agente busca fallos de acceso en una copia de prueba de tu app: una cuenta que puede ver los datos de otra, una pantalla de pago que se abre sin pagar. Cada hallazgo se compila en un test que queda en rojo hasta que el fallo se corrige, y que luego impide que vuelva. Solo en sistemas que te pertenecen o que tienes permiso para probar.
- **Apps web.** Un adaptador de navegador: el agente explora un sitio y la traza se compila en un test de Playwright.
- **Accesibilidad.** El agente usa una app con un lector de pantalla, o solo con el teclado. Cada paso que no logra superar, como un botón sin etiqueta o una trampa de foco, se convierte en un test.
- **Herramientas de línea de comandos.** El agente aprende una herramienta a partir de su ayuda, y la traza se compila en un test de shell que comprueba los códigos de salida y las salidas.
- **APIs.** El agente explora una API REST a partir de su archivo OpenAPI, y la traza se compila en tests de contrato.
- **Juegos.** El agente juega un nivel con una semilla fija, y la traza se compila en una reproducción de las entradas que comprueba, después de cada cambio, que el nivel todavía se puede terminar.
- **Guías de inicio.** El agente sigue un README en una máquina nueva, y la traza se convierte en un job de CI que falla cuando la guía ya no coincide con el código.
- **Apps de empresa.** El agente recorre un flujo de back-office de un CRM o un ERP en un sandbox, como crear un registro y conseguir su aprobación, y la traza se compila en los tests propios de la plataforma.

</details>

<details>
<summary>Cómo entra un repositorio en la lista, y cómo proponer una idea</summary>

Un repositorio entra en la lista cuando:

- es público, con una licencia de código abierto;
- sus trazas pasan `ecr validate`, y su adaptador, si trae uno, pasa `ecr conformance`;
- sus tests compilados se ejecutan en CI sin modelo, y una ejecución en verde lo demuestra;
- su README cita ECR, con la [insignia o el botón](#citing-ecr);
- si prueba la seguridad, solo prueba sistemas que pertenecen a sus usuarios o que estos tienen permiso para probar, y no publica ningún ataque contra sistemas de otros.

Para entrar, abre un issue [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) con el enlace a tu repositorio, una traza y la ejecución en verde. Los repositorios aparecen en el orden en que llegan. Para proponer una idea que no está en la lista, abre un issue [Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml).

</details>

<a name="citing-ecr"></a>

## Citar ECR

Si tu proyecto usa ECR, muéstralo: añade esta insignia a tu README. Enlaza con este repositorio, y así es como el siguiente equipo encuentra el patrón.

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

O este botón, que sigue el tema claro u oscuro de la página:

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/tested-with-ecr-dark.svg"><img src="../../assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

En un artículo, una charla o la página de un producto, cita el repositorio: el botón "Cite this repository" de GitHub da la referencia, a partir de [CITATION.cff](../../CITATION.cff). Habrá un DOI con la primera versión.

Para el código en sí, manda la licencia Apache-2.0: toda copia, fork o paquete del código de ECR, con cambios o sin ellos, debe conservar los archivos [LICENSE](../../LICENSE) y [NOTICE](../../NOTICE). NOTICE nombra ECR y enlaza con este repositorio.

## Historial de estrellas

<a href="https://star-history.com/#pierridotite/explore-compile-replay&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date&theme=dark"><img src="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date" alt="Star History Chart"></picture></a>

## Contribuir

Lo que más conviene cuestionar ahora es el contrato: [abre un issue](https://github.com/pierridotite/explore-compile-replay/issues/new) y di qué no encajaría en tu sistema. Para escribir código, [CONTRIBUTING.md](../../CONTRIBUTING.md) enumera dos piezas grandes abiertas, un adaptador web y un servidor MCP, y tareas más pequeñas para empezar.

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

Hecho por Pierre Raffalli · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Licencia Apache-2.0](../../LICENSE)
