# O que existe hoje

[English](../../../docs/status.md) · [简体中文](../../zh-CN/docs/status.md) · [日本語](../../ja/docs/status.md) · [Español](../../es/docs/status.md) · Português · [Tiếng Việt](../../vi/docs/status.md) · [Türkçe](../../tr/docs/status.md)

Parte por parte, com o que é rascunho e o que ainda não começou. Atualizado junto com o código.

| Parte | Situação |
|---|---|
| Esquema do trace, [`spec/schema.ts`](../../../spec/schema.ts) | Rascunho. Com checagem de tipos, um exemplo validado e um [JSON Schema](../../../spec/trace.schema.json) gerado. Um passo pode levar evidências (uma captura de tela, onde o dedo tocou) para as ferramentas que mostram um trace |
| Contrato do adaptador, [`spec/contract.ts`](../../../spec/contract.ts) | Rascunho. Com checagem de tipos |
| Sete leis, [`spec/laws.md`](../../../spec/laws.md) | Rascunho |
| Núcleo, [`packages/core`](../../../packages/core/src/index.ts) | Primeira parte: gravar um trace por meio de um driver, validá-lo, calcular seu hash, resolver parâmetros, conferir um mapa de fontes, separar um bug registrado de uma regressão |
| Comando `ecr`, [`packages/cli`](../../../packages/cli/src/run.ts) | Roda a partir deste repositório: `validate`, `compile`, `replay`, `repair`, `conformance`. Ainda não está no npm. Veja [o comando](command.md) |
| Servidor MCP, para um agente explorar | Não começou. Aberto a contribuições: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Adaptador de referência, [`packages/adapter-fixture`](../../../packages/adapter-fixture/src/adapter.ts) | Funciona. Uma lista de tarefas em memória, compilada para um arquivo `node:test` comum |
| Kit de conformidade, [`packages/conformance`](../../../packages/conformance/src/index.ts) | Verifica L1, L2, L3, L4 (com a rede fechada), L5 e L7, e parte da L6 |
| Reparo, [`packages/core`](../../../packages/core/src/repair.ts) | Primeira parte: `ecr repair` aceita ou recusa uma nova ação para o passo que divergiu. Não chama nenhum modelo e não propõe nada sozinho. No LocalSend, em emuladores Android, aceitou a proposta de um agente para 25 dos 26 traces quebrados por um texto reescrito, sem mudar nenhuma verificação, e recusou toda proposta sobre uma verificação que falhou. Uma mudança que precisa de dois passos é recusada |
| Adaptador móvel, [`packages/adapter-maestro`](../../../packages/adapter-maestro/README.md) | Rascunho. Um vocabulário móvel e um compilador para fluxos do [Maestro](https://maestro.dev). Em um emulador Android, contra o app de demonstração do mobile-agent-testers: dois fluxos escritos à mão são reexecutados em uma [execução iniciada à mão](../../../.github/workflows/device.yml), e de quatro caminhos explorados por um agente, dois pararam em um passo e dois, de 37 e 25 passos, foram reexecutados por inteiro sem modelo. Uma falha indica seu passo ou sua verificação. Sem driver. Não testado no iOS. No LocalSend, um app real: 7 traces mantidos de 20 explorações de um agente, e 137 de 140 reexecuções no app sem mudanças deram o que o trace registra, sem modelo ([resultados](../README.md#results-on-localsend)). 20 dos 24 caminhos de um robô sem modelo foram reexecutados por inteiro |
| Adaptador web, compilando para testes do Playwright | Não começou. Aberto a contribuições: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Benchmark de deriva: uma reexecução quebra, é reparada ou fica vermelha quando deve? | Executado no LocalSend: 25 mudanças em cinco classes, com os [mutantes](../../../drift-bench/mutants/localsend/README.md) escritos depois de congelar os traces, como pede o [protocolo](../../../paper/protocol.md). Nenhuma mudança de comportamento terminou verde. Resultados por classe: [README](../README.md#results-on-localsend), arquivos em [`paper/results/`](../../../paper/results/) |
| Artigo | Escrito: [o PDF](../../../paper/ecr-paper.pdf), 8 páginas, com a avaliação no LocalSend. Preprint no Zenodo: [10.5281/zenodo.24565285](https://doi.org/10.5281/zenodo.24565285) |
