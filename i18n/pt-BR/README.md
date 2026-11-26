<div align="center">

<img src="../../assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**Um agente explora o seu app uma vez. O que ele fez vira um teste padrão que roda de novo no CI sem nenhum modelo.**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](../../LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[Início rápido](#quick-start)** · **[Documentação](docs/command.md)** · **[Artigo e especificação](#paper-and-specification)** · **[Contribuir](../../CONTRIBUTING.md)** · **[Mudanças](../../CHANGELOG.md)**

<sub>[English](../../README.md) · [简体中文](../zh-CN/README.md) · [日本語](../ja/README.md) · [Español](../es/README.md) · Português · [Tiếng Việt](../vi/README.md) · [Türkçe](../tr/README.md)</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/linkedin-follow-dark.svg"><img src="../../assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/discord-join-dark.svg"><img src="../../assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/paper-dark.svg"><img src="../../assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/how-it-works-dark.svg"><img src="../../assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

Agentes de IA são bons em encontrar o que ninguém pensou em testar. Eles também são lentos, custam dinheiro a cada execução e nunca seguem o mesmo caminho duas vezes, por isso não cabem no CI. O Explore-Compile-Replay (ECR) mantém a primeira parte e tira o resto: o agente roda uma vez, e o caminho dele é guardado como um arquivo de teste comum, que qualquer pessoa pode ler, revisar e executar.

> **Rascunho inicial, aberto em 24 de novembro de 2026, agora medido em um app real.** No LocalSend, 7 traces, um deles instável, enfrentaram 25 mudanças injetadas: nenhuma regressão terminou verde, e um reparo de um só passo foi aceito para 25 dos 26 traces quebrados por um texto reescrito, sem mudar nenhuma verificação. As mudanças que precisam de dois passos são recusadas, e menos da metade das mudanças de texto e de estrutura foi reparada por completo: [resultados e limites](#results-on-localsend).

<a name="quick-start"></a>

## Início rápido

Você precisa do Node 22.18 ou mais recente e do pnpm. Ainda não há nada no npm: ele roda a partir de um clone.

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

Isso reexecuta um trace gravado contra uma lista de tarefas em memória, o sistema de referência. Todos os comandos: [docs/command.md](docs/command.md).

## Como funciona

1. **Explore (explorar).** Um agente faz o papel de uma persona e usa o sistema uma vez. Cada ação e cada verificação são registradas em um trace tipado.
2. **Compile (compilar).** O trace vira um arquivo de teste padrão, hoje um fluxo do [Maestro](https://maestro.dev) para um app móvel. Ele roda sem o ECR.
3. **Replay (reexecutar).** O arquivo roda no CI. Sem modelo, sem tokens, o mesmo veredito toda vez.

Quando o app muda e um passo quebra, o seu agente propõe uma nova ação para esse passo, e um **reparo** limitado aceita ou recusa. Um reparo pode mudar como um passo encontra o seu alvo, nunca o que o teste verifica. Um bug que o agente encontrou também é guardado: ele vira um teste que fica vermelho até o bug ser corrigido.

<details>
<summary>Um passo de um trace, e o que ele vira ao ser compilado</summary>

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

O toque é guardado pelo nome do botão, não pela posição dele na tela. O texto digitado é guardado pelo nome, nunca pelo valor. O exemplo completo: [o trace](../../packages/adapter-maestro/examples/anna-first-item-mobile.trace.json) e [o fluxo](../../packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml).

</details>

<details>
<summary>Os quatro resultados de uma reexecução</summary>

| Resultado | Significado |
|---|---|
| `pass` | Todas as verificações valem |
| `bug` | A reexecução para no bug que o trace registra, e em nada mais |
| `fixed` | A verificação registrada como bug agora vale. Ela vira uma proteção |
| `FAIL` | Qualquer outra coisa: um passo não encontra mais o seu alvo, ou uma verificação que valia não vale mais |

</details>

<a name="paper-and-specification"></a>

## Artigo e especificação

O ECR quer ser um padrão que qualquer pessoa possa implementar, não uma ferramenta.

- **Especificação.** O [formato do trace](../../spec/schema.ts), publicado também como [JSON Schema](../../spec/trace.schema.json), o [contrato do adaptador](../../spec/contract.ts) e [sete leis](../../spec/laws.md): determinismo, fidelidade, rastreabilidade, sem modelo, estado, reparo seguro, sem segredo. São rascunhos que ainda podem mudar.
- **Kit de conformidade.** Verifica um adaptador lei por lei. Um adaptador que passa nele está conforme, não importa quem o escreveu. Como escrever um: [docs/adapter.md](docs/adapter.md).
- **Artigo.** O padrão, o contrato e uma avaliação em um app real, o [LocalSend](https://github.com/localsend/localsend): [o PDF](../../paper/ecr-paper.pdf), 8 páginas. O [protocolo](../../paper/protocol.md) foi publicado antes da primeira medição, e cada número vem de um [arquivo de resultados](../../paper/results/). O preprint sai no Zenodo com a primeira versão.
- **Citação.** [CITATION.cff](../../CITATION.cff), ou "Cite this repository" na página do repositório, e um selo para os projetos que usam o ECR: [citar o ECR](#citing-ecr).

<details>
<summary>As sete leis em resumo</summary>

| | Lei | Em resumo |
|---|---|---|
| L1 | Determinismo | O mesmo trace compila para os mesmos bytes. O mesmo arquivo dá o mesmo veredito |
| L2 | Fidelidade | O arquivo executa as ações e as verificações do trace, na mesma ordem |
| L3 | Rastreabilidade | Cada passo do trace corresponde a um trecho distinto do arquivo |
| L4 | Sem modelo | Compilar e reexecutar não chamam nenhum modelo |
| L5 | Estado | Um estado salvo, depois de restaurado, é observado como idêntico, quando o adaptador consegue salvá-lo |
| L6 | Reparo seguro | Um patch fica dentro do passo que falhou, e não remove nem enfraquece nenhuma verificação |
| L7 | Sem segredo | Nem o trace nem o arquivo contêm um valor secreto |

</details>

<a name="results-on-localsend"></a>

## Resultados no LocalSend

A avaliação do [artigo](../../paper/ecr-paper.pdf) rodou no [LocalSend](https://github.com/localsend/localsend) v1.19.0, um app de código aberto para compartilhar arquivos, compilado a partir do código-fonte e executado em emuladores Android. Um agente, `claude-sonnet-5-5`, explorou o app 20 vezes, e um assistente de IA escreveu as verificações com uma regra fixada de antemão: 7 traces foram mantidos, menos que os 10 previstos, com 62 verificações. O [protocolo](../../paper/protocol.md) foi publicado antes da primeira medição, e cada número abaixo vem de um [arquivo de resultados](../../paper/results/).

| | Resultado |
|---|---|
| Sem modelo | Nenhuma reexecução chamou um modelo. A última reexecução de cada trace rodou com a rede cortada, e passou |
| Mesmo resultado | No app sem mudanças, 137 de 140 reexecuções deram o que o trace registra: 6 traces 20 vezes em 20, um 17 vezes |
| O agente de novo | Executado de novo, o agente chegou ao objetivo de um trace em 30 de 35 execuções, e o seu próprio caminho foi reexecutado por inteiro em 12 de 20 |
| Custo | Uma reexecução não chama nenhum modelo; uma execução do agente custa uma mediana de US$ 0,20. Contando todos os reparos, um trace mantido custa menos do que executar o agente de novo a partir da 8ª execução em preço, mas só a partir da 76ª em tempo: uma reexecução leva de 52 a 101 s, uma execução do agente 121,5 s |
| Regressões | Nenhuma das 5 mudanças de comportamento terminou verde. No total, 25 mudanças foram injetadas, em cinco classes |
| Reparo | O reparo de um só passo proposto por um agente foi aceito para 25 dos 26 traces quebrados por um texto reescrito, sem mudar nenhuma verificação, e um assistente de IA, não o autor, julgou os 25 corretos. Uma verificação que falhou nunca é reparada |

<details>
<summary>Por classe de mudança, e o que conta contra o ECR</summary>

Cinco mudanças por classe, cada uma aplicada sozinha, e depois 3 reexecuções dos 7 traces. Detectada: um trace falha as suas 3 reexecuções.

| Mudança | Detectada | Reparada |
|---|---|---|
| D1, um texto é reescrito | 5 de 5 | 25 de 26 traces; 4 das 5 mudanças para todos os traces |
| D2, um identificador é renomeado | Não se aplica: os 54 toques dos 7 traces miram todos um texto | |
| D3, o alvo muda de lugar | 2 de 5: um alvo encontrado pelo texto sobrevive à mudança de lugar | 0 de 8 traces: 7 precisavam de dois passos alterados, 1 parou em uma verificação |
| D4, um diálogo aparece antes | 5 de 5, quase sempre como verificação que falhou, que nunca é reparada | 0 de 34 traces, como esperado: um passo não consegue acrescentar um passo. Em 90 de 102 tentativas, o próprio agente respondeu que um passo não bastava |
| D5, o alvo aparece 1, 5 ou 15 s depois | 0 de 5: 102 de 105 reexecuções passaram, mas um atraso de 5 s fez um trace falhar em uma verificação em 2 reexecuções de 3 | Nenhum reparo pedido |
| D6, um estado verificado não é alcançado | 5 de 5 | Todas as propostas recusadas, em 102 tentativas: nenhum falso verde |

O que conta contra o ECR: um trace não é estável e falha 3 reexecuções de 20 na verificação logo depois de um Voltar, por uma causa não estabelecida. Um reparo muda um só passo, então só 4 das 10 mudanças de texto e de estrutura foram reparadas para todos os traces. Editados livremente por um assistente de IA, os mesmos 68 traces quebrados precisaram de 2 a 4 linhas alteradas no fluxo compilado, e então todos passaram 3 reexecuções de 3, exceto o trace instável: a edição livre alcança o que o limite recusa, sem nenhuma proteção sobre o que ela muda. Em 5 dos 25 reparos aceitos, nenhuma verificação conseguia ver um toque perdido, e por isso cada reparo aceito é julgado depois. As mudanças foram escritas dentro do projeto, por um assistente de IA, e um app, uma plataforma e um modelo dizem pouco sobre os outros.

</details>

<a name="where-it-stands"></a>

## Onde está

- **Funciona hoje:** o comando `ecr` (`validate`, `compile`, `replay`, `repair`, `conformance`), um adaptador de referência e um adaptador móvel que compila para fluxos do Maestro. Medido no LocalSend, em emuladores Android: reexecuções sem modelo e reparos que o `ecr repair` verificou no dispositivo.
- **Em andamento:** a primeira versão, com o preprint e um DOI.
- **Ainda não:** iOS, um pacote no npm.

Parte por parte: [docs/status.md](docs/status.md).

## De onde vem

O ECR generaliza o [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), que dá um celular a cada testador de IA nos runners do GitHub e é o primeiro projeto que escreve traces do ECR. A forma da ideia vem do [Remotion](https://www.remotion.dev), onde um vídeo é código: uma IA o escreve uma vez, e cada render dá o mesmo vídeo sem modelo. Aqui o agente explora uma vez, e a reexecução é o render.

<details>
<summary>O ECR não diz ser o primeiro: as ferramentas que vieram antes</summary>

Várias ferramentas já guardam ou reexecutam o que um agente fez, cada uma para o seu próprio sistema: [Stagehand](https://github.com/browserbase/stagehand), [Skyvern](https://github.com/Skyvern-AI/skyvern), [workflow-use](https://github.com/browser-use/workflow-use), [Midscene](https://github.com/web-infra-dev/midscene), [Arbigent](https://github.com/takahirom/arbigent), [muscle-mem](https://github.com/pig-dot-dev/muscle-mem) e [autocompile](https://github.com/mirkokiefer/autocompile). O que este projeto acrescenta é um nome para o padrão e um contrato escrito: um que serve para sistemas diferentes, compila para arquivos que rodam sem a ferramenta, protege o que os testes verificam e pode ser verificado por um kit de conformidade.

</details>

<a name="build-with-ecr"></a>

## Construir com o ECR

O ECR é um padrão, não uma ferramenta móvel: qualquer sistema que um agente consiga usar pode ser explorado uma vez e depois reexecutado sem modelo. Abaixo estão ideias de projetos para construir sobre ele. Os primeiros repositórios que construírem uma delas direito serão listados aqui, e qualquer pessoa pode propor uma ideia nova. Cada projeto listado recebe crédito pelo nome, com o seu autor, aqui e nas notas da próxima versão.

**Construído com o ECR:** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), de [pierridotite](https://github.com/pierridotite), para apps móveis, o primeiro projeto que escreve traces do ECR. Os agentes dele exploraram o LocalSend para o artigo, e os 7 traces mantidos dessas explorações são reexecutados lá sem modelo: [resultados](#results-on-localsend).

<details>
<summary>Ideias para construir</summary>

- **Testes de segurança do seu próprio app.** Um agente procura falhas de acesso em uma cópia de teste do seu app: uma conta que consegue ver os dados de outra, uma tela paga que abre sem pagamento. Cada achado vira um teste que fica vermelho até a falha ser corrigida e que depois impede que ela volte. Só em sistemas que são seus ou que você tem permissão para testar.
- **Apps web.** Um adaptador de navegador: o agente explora um site, e o trace é compilado em um teste do Playwright.
- **Acessibilidade.** O agente usa um app com um leitor de tela, ou só com o teclado. Cada passo em que ele não consegue avançar, como um botão sem rótulo ou uma armadilha de foco, vira um teste.
- **Ferramentas de linha de comando.** O agente aprende uma ferramenta pela ajuda dela, e o trace é compilado em um teste de shell que verifica os códigos de saída e as saídas.
- **APIs.** O agente explora uma API REST a partir do arquivo OpenAPI dela, e o trace é compilado em testes de contrato.
- **Jogos.** O agente joga uma fase com uma semente fixa, e o trace é compilado em uma reexecução das entradas que verifica, a cada mudança, se a fase ainda pode ser concluída.
- **Guias de primeiros passos.** O agente segue um README em uma máquina nova, e o trace vira um job de CI que falha quando o guia não bate mais com o código.
- **Apps corporativos.** O agente percorre um fluxo de back-office de um CRM ou de um ERP em um sandbox, como criar um registro e conseguir a aprovação dele, e o trace é compilado nos testes da própria plataforma.

</details>

<details>
<summary>Como um repositório entra na lista, e como propor uma ideia</summary>

Um repositório entra na lista quando:

- é público, com uma licença de código aberto;
- os traces dele passam no `ecr validate`, e o adaptador, se ele trouxer um, passa no `ecr conformance`;
- os testes compilados rodam no CI sem modelo, e uma execução verde mostra isso;
- o README dele cita o ECR, com o [selo ou o botão](#citing-ecr);
- se ele testa segurança, só testa sistemas que pertencem aos seus usuários ou que eles têm permissão para testar, e não publica nenhum ataque a sistemas de outras pessoas.

Para entrar, abra uma issue [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) com o link do seu repositório, um trace e a execução verde. Os repositórios entram na ordem em que chegam. Para propor uma ideia que não está na lista, abra uma issue [Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml).

</details>

<a name="citing-ecr"></a>

## Citar o ECR

Se o seu projeto usa o ECR, mostre isso: adicione este selo ao seu README. Ele leva a este repositório, e é assim que a próxima equipe encontra o padrão.

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

Ou este botão, que segue o tema claro ou escuro da página:

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/tested-with-ecr-dark.svg"><img src="../../assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

Em um artigo, uma palestra ou a página de um produto, cite o repositório: o botão "Cite this repository" do GitHub dá a referência, a partir do [CITATION.cff](../../CITATION.cff). Um DOI vem com a primeira versão.

Para o código em si, vale a licença Apache-2.0: toda cópia, fork ou pacote do código do ECR, com ou sem mudanças, deve manter os arquivos [LICENSE](../../LICENSE) e [NOTICE](../../NOTICE). O NOTICE nomeia o ECR e leva a este repositório.

## Histórico de estrelas

<a href="https://star-history.com/#pierridotite/explore-compile-replay&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date&theme=dark"><img src="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date" alt="Star History Chart"></picture></a>

## Contribuir

O que mais vale questionar agora é o contrato: [abra uma issue](https://github.com/pierridotite/explore-compile-replay/issues/new) e diga o que não caberia no seu sistema. Para escrever código, o [CONTRIBUTING.md](../../CONTRIBUTING.md) lista duas peças grandes em aberto, um adaptador web e um servidor MCP, e tarefas menores para começar.

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

Feito por Pierre Raffalli · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Licença Apache-2.0](../../LICENSE)
