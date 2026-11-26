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

> **早期草案，2026 年 11 月 24 日公开。** 它已经能在一个玩具系统和一个演示用移动应用上完整跑通，但还不能用于真实应用：[当前进展](#where-it-stands)。

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
- **论文。** 描述这一模式、契约，以及在真实应用 [LocalSend](https://github.com/localsend/localsend) 上的评估。它的[评估协议](../../paper/protocol.md)在第一次正式测量之前就已公开。论文正在撰写，预印本将随第一个版本发布在 Zenodo 上。
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

<a name="where-it-stands"></a>

## 当前进展

- **现在可用：** `ecr` 命令（`validate`、`compile`、`replay`、`repair`、`conformance`）、一个参考适配器，以及一个编译为 Maestro flow 的移动适配器，已在 Android 模拟器上重放。
- **进行中：** 一个真实应用 LocalSend，以及第一个版本，附带预印本和 DOI。
- **尚未开始：** iOS、在设备上修复、npm 包。

逐个部分的说明：[docs/status.md](docs/status.md)。

## 从哪里来

ECR 是 [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers) 的推广。后者在 GitHub 的 runner 上给每个 AI 测试员一部手机，也是第一个写出 ECR 轨迹的项目。这个想法的形状来自 [Remotion](https://www.remotion.dev)：在那里视频就是代码，AI 写一次，之后每次渲染都得到同样的视频，不需要模型。在 ECR 里，智能体探索一次，重放就是渲染。

<details>
<summary>ECR 不声称是第一个：在它之前的工具</summary>

已经有一些工具会保存或重放智能体做过的事，各自针对自己的系统：[Stagehand](https://github.com/browserbase/stagehand)、[Skyvern](https://github.com/Skyvern-AI/skyvern)、[workflow-use](https://github.com/browser-use/workflow-use)、[Midscene](https://github.com/web-infra-dev/midscene)、[Arbigent](https://github.com/takahirom/arbigent)、[muscle-mem](https://github.com/pig-dot-dev/muscle-mem) 和 [autocompile](https://github.com/mirkokiefer/autocompile)。本项目补充的是这一模式的名字和一份成文的契约：它跨系统适用，编译出不依赖该工具就能运行的文件，保护测试检查的内容，并且可以由一致性套件来验证。

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

## 参与贡献

现在最值得挑战的是契约：[提一个 issue](https://github.com/pierridotite/explore-compile-replay/issues/new)，说说哪里不适合你的系统。如果想写代码，[CONTRIBUTING.md](../../CONTRIBUTING.md) 列出了两个开放的大块工作（一个 Web 适配器和一个 MCP 服务器），以及适合入门的小任务。

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

由 Pierre Raffalli 制作 · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Apache-2.0 许可证](../../LICENSE)
