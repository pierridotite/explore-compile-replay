# 目前已有的部分

[English](../../../docs/status.md) · 简体中文 · [日本語](../../ja/docs/status.md) · [Español](../../es/docs/status.md) · [Português](../../pt-BR/docs/status.md) · [Tiếng Việt](../../vi/docs/status.md) · [Türkçe](../../tr/docs/status.md)

逐个部分列出：哪些是草案，哪些还没开始。随代码一起更新。

| 部分 | 状态 |
|---|---|
| 轨迹模式，[`spec/schema.ts`](../../../spec/schema.ts) | 草案。通过类型检查，附有一个经过校验的示例和一份生成的 [JSON Schema](../../../spec/trace.schema.json)。一步可以带有证据（截图、手指落下的位置），供展示轨迹的工具使用 |
| 适配器契约，[`spec/contract.ts`](../../../spec/contract.ts) | 草案。通过类型检查 |
| 七条定律，[`spec/laws.md`](../../../spec/laws.md) | 草案 |
| 核心，[`packages/core`](../../../packages/core/src/index.ts) | 第一部分：通过驱动记录轨迹、校验、计算哈希、解析参数、检查源码映射、区分已记录的 bug 和回归 |
| `ecr` 命令，[`packages/cli`](../../../packages/cli/src/run.ts) | 从本仓库运行：`validate`、`compile`、`replay`、`repair`、`conformance`。还没有发布到 npm。见[命令说明](command.md) |
| MCP 服务器，供智能体探索 | 尚未开始。欢迎贡献：[CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| 参考适配器，[`packages/adapter-fixture`](../../../packages/adapter-fixture/src/adapter.ts) | 可以运行。一个内存中的待办清单，编译为普通的 `node:test` 文件 |
| 一致性套件，[`packages/conformance`](../../../packages/conformance/src/index.ts) | 检查 L1、L2、L3、L4（断网时）、L5 和 L7，以及 L6 的一部分 |
| 修复，[`packages/core`](../../../packages/core/src/repair.ts) | 第一部分：`ecr repair` 对出现偏差的那一步接受或拒绝一个新操作。它不调用模型，自己也不提出任何方案。在 LocalSend 上、在 Android 模拟器中，它为 26 份因文案改写而中断的轨迹中的 25 份接受了智能体的提议，所有检查保持不变，并拒绝了所有针对失败检查的提议。需要改两步的改动会被拒绝 |
| 移动适配器，[`packages/adapter-maestro`](../../../packages/adapter-maestro/README.md) | 草案。一套移动端词汇和一个编译为 [Maestro](https://maestro.dev) flow 的编译器。在 Android 模拟器上针对 mobile-agent-testers 的演示应用：两个手写的 flow 在一个[手动启动的运行](../../../.github/workflows/device.yml)中重放；智能体探索的四条路径中，两条停在某一步，另外两条（37 步和 25 步）在没有模型的情况下完整重放。失败时会指出它的步骤或检查。没有驱动。没在 iOS 上试过。在真实应用 LocalSend 上：从智能体的 20 次探索中保留了 7 份轨迹，在未改动的应用上 140 次重放中有 137 次得到轨迹记录的结果，不调用模型（[结果](../README.md#results-on-localsend)）。一个无模型机器人的 24 条路径中有 20 条完整重放 |
| Web 适配器，编译为 Playwright 测试 | 尚未开始。欢迎贡献：[CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| 漂移基准：重放在应该中断、修复或保持失败时，是否真的如此？ | 已在 LocalSend 上运行：五类共 25 处改动，[变异体](../../../drift-bench/mutants/localsend/README.md)按[协议](../../../paper/protocol.md)的要求在轨迹冻结后编写。没有任何行为改动以通过告终。按类别的结果：[README](../README.md#results-on-localsend)，文件在 [`paper/results/`](../../../paper/results/) |
| 论文 | 已完成：[PDF](../../../paper/ecr-paper.pdf)，8 页，包含在 LocalSend 上的评估。预印本将随第一个版本发布在 Zenodo 上 |
