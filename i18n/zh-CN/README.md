<div align="center">

<img src="../../assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**智能体只探索你的应用一次。它做过的事会变成一份标准测试，在 CI 里重复运行，不需要任何模型。**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](../../LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[快速开始](#quick-start)** · **[文档](docs/command.md)** · **[论文与规范](#paper-and-specification)** · **[参与贡献](../../CONTRIBUTING.md)** · **[更新日志](../../CHANGELOG.md)**

<sub>[English](../../README.md) · 简体中文 · [日本語](../ja/README.md) · [Español](../es/README.md) · [Português](../pt-BR/README.md) · [Tiếng Việt](../vi/README.md) · [Türkçe](../tr/README.md)</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/linkedin-follow-dark.svg"><img src="../../assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/discord-join-dark.svg"><img src="../../assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/paper-dark.svg"><img src="../../assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/how-it-works-dark.svg"><img src="../../assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

AI 智能体擅长发现没人想到要测的地方。但它们很慢，每次运行都要花钱，而且从不会两次走同一条路径，所以放不进 CI。Explore-Compile-Replay（ECR）保留前一半，去掉后一半：智能体只运行一次，它走过的路径被保存成一份普通的测试文件，任何人都能阅读、评审和运行。

> **早期草案，2026 年 11 月 24 日公开，现已在真实应用上测量。** 在 LocalSend 上，7 份轨迹（其中一份不稳定）面对 25 处注入的改动：没有任何回归以通过告终；在 26 份因文案改写而中断的轨迹中，有 25 份接受了只改一步的修复，所有检查保持不变。需要改两步的改动会被拒绝，文案和结构类改动中完全修复的不到一半：[结果与局限](#results-on-localsend)。

<a name="quick-start"></a>

## 快速开始

需要 Node 22.18 或更高版本，以及 pnpm。npm 上还没有发布任何包：请从克隆的仓库运行。

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

这会针对一个内存中的待办清单（参考系统）重放一份已记录的轨迹。所有命令见 [docs/command.md](docs/command.md)。

## 工作原理

1. **Explore（探索）。** 智能体扮演一个用户角色，把系统使用一遍。每个操作和每个检查都记录在一份带类型的轨迹（trace）里。
2. **Compile（编译）。** 轨迹变成一份标准测试文件，目前对移动应用是一个 [Maestro](https://maestro.dev) flow。它不依赖 ECR 就能运行。
3. **Replay（重放）。** 这份文件在 CI 里运行。没有模型，不消耗 token，每次结论都相同。

当应用发生变化、某一步中断时，你的智能体为这一步提出一个新的操作，由一个有边界的**修复（repair）**决定接受还是拒绝。修复可以改变某一步如何找到它的目标，但永远不能改变测试检查的内容。智能体发现的 bug 也会被保留：它会编译成一个在 bug 修复之前一直失败的测试。

<details>
<summary>轨迹中的一步，以及它编译出的结果</summary>

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

点击是按按钮的名称保存的，而不是按它在屏幕上的位置。输入过的文本按它的名称保存，永远不保存它的值。完整示例：[轨迹](../../packages/adapter-maestro/examples/anna-first-item-mobile.trace.json)和 [flow](../../packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml)。

</details>

<details>
<summary>一次重放的四种结果</summary>

| 结果 | 含义 |
|---|---|
| `pass` | 所有检查都成立 |
| `bug` | 重放停在轨迹记录的那个 bug 上，并且只停在那里 |
| `fixed` | 曾被记录为 bug 的检查现在成立了。它变成一道防线 |
| `FAIL` | 其他任何情况：某一步再也找不到目标，或者一个原本成立的检查不再成立 |

</details>

<a name="paper-and-specification"></a>

## 论文与规范

ECR 想成为任何人都能实现的标准，而不只是一个工具。

- **规范。** [轨迹格式](../../spec/schema.ts)（也以 [JSON Schema](../../spec/trace.schema.json) 形式发布）、[适配器契约](../../spec/contract.ts)和[七条定律](../../spec/laws.md)：确定性、忠实性、可追溯性、无模型、状态、安全修复、无机密。它们都是草案，仍可能变化。
- **一致性套件。** 按定律逐条检查一个适配器。通过它的适配器就是符合规范的，无论作者是谁。如何编写适配器：[docs/adapter.md](docs/adapter.md)。
- **论文。** 描述这一模式、契约，以及在真实应用 [LocalSend](https://github.com/localsend/localsend) 上的评估：[PDF](../../paper/ecr-paper.pdf)，8 页。它的[评估协议](../../paper/protocol.md)在第一次正式测量之前就已公开，每个数字都来自一个[结果文件](../../paper/results/)。预印本将随第一个版本发布在 Zenodo 上。
- **引用。** [CITATION.cff](../../CITATION.cff)，或仓库页面上的 "Cite this repository"，以及供使用 ECR 的项目展示的徽章：[引用 ECR](#citing-ecr)。

<details>
<summary>七条定律简述</summary>

| | 定律 | 简述 |
|---|---|---|
| L1 | 确定性 | 同一份轨迹编译出相同的字节。同一份文件给出相同的结论 |
| L2 | 忠实性 | 文件按相同顺序执行轨迹中的操作和检查 |
| L3 | 可追溯性 | 轨迹的每一步对应文件中一个独立的区段 |
| L4 | 无模型 | 编译和重放都不调用任何模型 |
| L5 | 状态 | 如果适配器能保存状态，那么恢复后的状态与保存时观察到的完全一致 |
| L6 | 安全修复 | 补丁只停留在失败的那一步之内，不删除也不削弱任何检查 |
| L7 | 无机密 | 轨迹和文件中都不包含任何机密值 |

</details>

<a name="results-on-localsend"></a>

## LocalSend 上的结果

[论文](../../paper/ecr-paper.pdf)的评估在 [LocalSend](https://github.com/localsend/localsend) v1.19.0 上进行。这是一个开源的文件分享应用，从源码构建，运行在 Android 模拟器上。一个智能体（`claude-sonnet-5-5`）探索了它 20 次，一个 AI 助手按事先定好的规则写下检查：最终保留了 7 份轨迹，少于计划的 10 份，共 62 个检查。[评估协议](../../paper/protocol.md)在第一次正式测量之前就已公开，下面的每个数字都来自一个[结果文件](../../paper/results/)。

| | 结果 |
|---|---|
| 没有模型 | 每次重放都不调用模型。每份轨迹的最后一次重放在断网状态下运行，并且通过 |
| 结果相同 | 在未改动的应用上，140 次重放中有 137 次得到轨迹记录的结果：6 份轨迹 20 次中 20 次，1 份 17 次 |
| 再次运行智能体 | 再次运行时，智能体在 35 次中有 30 次到达轨迹的目标，它自己的路径在 20 次中有 12 次能完整重放 |
| 成本 | 重放不调用模型；一次智能体运行的成本中位数为 0.20 美元。算上所有修复，一份保留下来的轨迹从价格上看从第 8 次运行起比再次运行智能体便宜，但从时间上看要到第 76 次：一次重放需要 52 到 101 秒，一次智能体运行需要 121.5 秒 |
| 回归 | 5 处行为改动没有一处以通过告终。总共注入了 25 处改动，分为五类 |
| 修复 | 在 26 份因文案改写而中断的轨迹中，有 25 份接受了智能体提出的只改一步的修复，所有检查保持不变；这 25 个修复由一个 AI 助手而不是作者来判定，全部正确。失败的检查永远不会被修复 |

<details>
<summary>按改动类别的结果，以及不利于 ECR 的结果</summary>

每类五处改动，每处单独应用，然后把 7 份轨迹各重放 3 次。检测到：某份轨迹的 3 次重放都失败。

| 改动 | 检测到 | 修复 |
|---|---|---|
| D1，改写一段文案 | 5 处中 5 处 | 26 份轨迹中 25 份；5 处改动中有 4 处对所有轨迹都修复了 |
| D2，重命名一个标识符 | 不适用：7 份轨迹中的 54 次点击都以文本为目标 | |
| D3，目标移动位置 | 5 处中 2 处：按文本找到的目标在移动后依然能找到 | 8 份轨迹中 0 份：7 份需要改两步，1 份停在一个检查上 |
| D4，先出现一个对话框 | 5 处中 5 处，大多表现为检查失败，而失败的检查永远不会被修复 | 34 份轨迹中 0 份，符合预期：改一步无法增加一步。在 102 次尝试中，有 90 次是智能体自己回答只改一步不够 |
| D5，目标晚 1、5 或 15 秒出现 | 5 处中 0 处：105 次重放中有 102 次通过，但 5 秒的延迟让一份轨迹在 3 次重放中有 2 次在某个检查上失败 | 没有要求修复 |
| D6，没有到达被检查的状态 | 5 处中 5 处 | 102 次尝试中的所有提议都被拒绝：没有误判为通过 |

不利于 ECR 的结果：有一份轨迹不稳定，20 次重放中有 3 次在按下返回键后紧接着的那个检查上失败，原因尚未查明。修复只改一步，所以 10 处文案和结构类改动中，只有 4 处对所有轨迹都修复了。由一个 AI 助手自由编辑时，同样这 68 份中断的轨迹需要在编译出的 flow 中改 2 到 4 行，之后除了那份不稳定的轨迹，全部在 3 次重放中 3 次通过：自由编辑能做到边界所拒绝的修改，但改了什么没有任何把关。在 25 个被接受的修复中，有 5 个没有任何检查能发现漏掉的点击，所以每个被接受的修复事后都要再判定。这些改动是在项目内部由一个 AI 助手写的，而且一个应用、一个平台、一个模型很难说明其他情况。

</details>

<a name="where-it-stands"></a>

## 当前进展

- **现在可用：** `ecr` 命令（`validate`、`compile`、`replay`、`repair`、`conformance`）、一个参考适配器，以及一个编译为 Maestro flow 的移动适配器。已在 LocalSend 上、在 Android 模拟器中测量：不调用模型的重放，以及由 `ecr repair` 在设备上检查的修复。
- **进行中：** 第一个版本，附带预印本和 DOI。
- **尚未开始：** iOS、npm 包。

逐个部分的说明：[docs/status.md](docs/status.md)。

## 从哪里来

ECR 是 [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers) 的推广。后者在 GitHub 的 runner 上给每个 AI 测试员一部手机，也是第一个写出 ECR 轨迹的项目。这个想法的形状来自 [Remotion](https://www.remotion.dev)：在那里视频就是代码，AI 写一次，之后每次渲染都得到同样的视频，不需要模型。在 ECR 里，智能体探索一次，重放就是渲染。

<details>
<summary>ECR 不声称是第一个：在它之前的工具</summary>

已经有一些工具会保存或重放智能体做过的事，各自针对自己的系统：[Stagehand](https://github.com/browserbase/stagehand)、[Skyvern](https://github.com/Skyvern-AI/skyvern)、[workflow-use](https://github.com/browser-use/workflow-use)、[Midscene](https://github.com/web-infra-dev/midscene)、[Arbigent](https://github.com/takahirom/arbigent)、[muscle-mem](https://github.com/pig-dot-dev/muscle-mem) 和 [autocompile](https://github.com/mirkokiefer/autocompile)。本项目补充的是这一模式的名字和一份成文的契约：它跨系统适用，编译出不依赖该工具就能运行的文件，保护测试检查的内容，并且可以由一致性套件来验证。

</details>

<a name="build-with-ecr"></a>

## 用 ECR 构建

ECR 是一种模式，而不是一个移动端工具：任何智能体能够使用的系统，都可以先探索一次，再在没有模型的情况下重放。下面是一些可以基于它构建的项目创意。最先把其中一个创意认真实现的仓库会被列在这里，任何人都可以提出新的创意。每个被列出的项目都会在这里以及下一个版本的发布说明中署名致谢，并注明作者。

**用 ECR 构建的项目：** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers)，作者 [pierridotite](https://github.com/pierridotite)，面向移动应用，是第一个写出 ECR 轨迹的项目。论文中是它的智能体探索了 LocalSend，从中保留的 7 份轨迹在那里无需模型即可重放：[结果](#results-on-localsend)。

<details>
<summary>可以构建的创意</summary>

- **对你自己的应用做安全测试。** 智能体在你的应用的测试副本中寻找访问控制漏洞：一个账号能看到另一个账号的数据，一个付费页面不付钱也能打开。每个发现都会编译成一个测试，在漏洞修复之前一直失败，修复之后防止它再次出现。只能用于你自己拥有或已获准测试的系统。
- **Web 应用。** 一个浏览器适配器：智能体探索一个网站，轨迹编译成一个 Playwright 测试。
- **无障碍。** 智能体用屏幕阅读器，或者只用键盘来使用一个应用。每个它过不去的步骤，比如没有标签的按钮或焦点陷阱，都会变成一个测试。
- **命令行工具。** 智能体从帮助信息中学会一个工具，轨迹编译成一个检查退出码和输出的 shell 测试。
- **API。** 智能体根据 OpenAPI 文件探索一个 REST API，轨迹编译成契约测试。
- **游戏。** 智能体用固定的随机种子玩一个关卡，轨迹编译成一段输入重放，在每次改动之后检查这个关卡是否仍然可以通关。
- **入门指南。** 智能体在一台全新的机器上按照 README 操作，轨迹变成一个 CI 任务，当指南和代码不再一致时就会失败。
- **企业应用。** 智能体在沙盒中走完 CRM 或 ERP 的一个后台流程，例如创建一条记录并让它通过审批，轨迹编译成该平台自己的测试。

</details>

<details>
<summary>仓库如何被列入，以及如何提出创意</summary>

一个仓库满足以下条件时会被列入：

- 它是公开的，使用开源许可证；
- 它的轨迹通过 `ecr validate`，如果它自带适配器，适配器要通过 `ecr conformance`；
- 它编译出的测试在 CI 中无需模型即可运行，并有一次通过的运行可以证明；
- 它的 README 用[徽章或按钮](#citing-ecr)引用了 ECR；
- 如果它做安全测试，只测试其用户拥有或已获准测试的系统，并且不公布任何针对他人系统的攻击。

想被列入，请开一个 [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) issue，附上你的仓库链接、一份轨迹和那次通过的运行。仓库按提交的先后顺序列出。想提出列表中没有的创意，请开一个 [Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml) issue。

</details>

<a name="citing-ecr"></a>

## 引用 ECR

如果你的项目使用了 ECR，就把它展示出来：把这个徽章加到你的 README 中。徽章链接回本仓库，下一个团队就是这样找到这个模式的。

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

或者使用这个按钮，它会跟随页面的浅色或深色主题：

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/tested-with-ecr-dark.svg"><img src="../../assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

在论文、演讲或产品页面中，请引用本仓库：GitHub 上的 "Cite this repository" 按钮会根据 [CITATION.cff](../../CITATION.cff) 给出引用信息。DOI 将随第一个版本提供。

至于代码本身，以 Apache-2.0 许可证为准：ECR 代码的任何副本、fork 或软件包，无论是否修改，都必须保留 [LICENSE](../../LICENSE) 和 [NOTICE](../../NOTICE) 两个文件。NOTICE 写明了 ECR 的名称和本仓库的链接。

## Star 历史

<a href="https://star-history.com/#pierridotite/explore-compile-replay&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date&theme=dark"><img src="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date" alt="Star History Chart"></picture></a>

## 参与贡献

现在最值得挑战的是契约：[提一个 issue](https://github.com/pierridotite/explore-compile-replay/issues/new)，说说哪里不适合你的系统。如果想写代码，[CONTRIBUTING.md](../../CONTRIBUTING.md) 列出了两个开放的大块工作（一个 Web 适配器和一个 MCP 服务器），以及适合入门的小任务。

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

由 Pierre Raffalli 制作 · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Apache-2.0 许可证](../../LICENSE)
