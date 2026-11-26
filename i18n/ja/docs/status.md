# 今あるもの

[English](../../../docs/status.md) · [简体中文](../../zh-CN/docs/status.md) · 日本語 · [Español](../../es/docs/status.md) · [Português](../../pt-BR/docs/status.md) · [Tiếng Việt](../../vi/docs/status.md) · [Türkçe](../../tr/docs/status.md)

部分ごとに、何がドラフトで何が未着手かを示します。コードとともに更新します。

| 部分 | 状況 |
|---|---|
| トレースのスキーマ、[`spec/schema.ts`](../../../spec/schema.ts) | ドラフト。型チェック済みで、検証済みの例と生成された [JSON Schema](../../../spec/trace.schema.json) があります。トレースを表示するツールのために、ステップは証拠（スクリーンショット、指が触れた位置）を持てます |
| アダプター契約、[`spec/contract.ts`](../../../spec/contract.ts) | ドラフト。型チェック済み |
| 7 つの法則、[`spec/laws.md`](../../../spec/laws.md) | ドラフト |
| コア、[`packages/core`](../../../packages/core/src/index.ts) | 最初の部分：ドライバーを通じたトレースの記録、検証、ハッシュ、パラメーターの解決、ソースマップの確認、記録済みのバグとリグレッションの区別 |
| `ecr` コマンド、[`packages/cli`](../../../packages/cli/src/run.ts) | このリポジトリから実行：`validate`、`compile`、`replay`、`repair`、`conformance`。npm にはまだありません。[コマンド](command.md)を参照 |
| エージェントが探索するための MCP サーバー | 未着手。コントリビュート歓迎：[CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| リファレンスアダプター、[`packages/adapter-fixture`](../../../packages/adapter-fixture/src/adapter.ts) | 動作します。メモリ上の ToDo リストで、普通の `node:test` ファイルにコンパイルされます |
| 適合性キット、[`packages/conformance`](../../../packages/conformance/src/index.ts) | L1、L2、L3、L4（ネットワーク遮断時）、L5、L7、そして L6 の一部を検証 |
| 修復、[`packages/core`](../../../packages/core/src/repair.ts) | 最初の部分：`ecr repair` は、ずれたステップの新しい操作を受け入れるか拒否します。モデルを呼ばず、自分では何も提案しません。LocalSend で Android エミュレーター上では、文言の変更で壊れた 26 本のトレースのうち 25 本でエージェントの提案を受け入れ、チェックはすべてそのままでした。失敗したチェックへの提案はすべて拒否しました。2 ステップの変更が必要な場合は拒否します |
| モバイルアダプター、[`packages/adapter-maestro`](../../../packages/adapter-maestro/README.md) | ドラフト。モバイルの語彙と、[Maestro](https://maestro.dev) フローへのコンパイラー。Android エミュレーター上で mobile-agent-testers のデモアプリに対して：手書きの 2 つのフローが[手動で起動する実行](../../../.github/workflows/device.yml)で再生され、エージェントが探索した 4 つの経路のうち 2 つはあるステップで止まり、37 ステップと 25 ステップの 2 つはモデルなしで最後まで再生されました。失敗はそのステップまたはチェックを示します。ドライバーなし。iOS では未検証。実際のアプリ LocalSend では、エージェントの 20 回の探索から 7 本のトレースを残し、変更していないアプリでの 140 回の再生のうち 137 回がモデルなしでトレースの記録どおりの結果になりました（[結果](../README.md#results-on-localsend)）。モデルを使わないロボットの経路 24 本のうち 20 本が最後まで再生されました |
| Playwright テストにコンパイルする Web アダプター | 未着手。コントリビュート歓迎：[CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| ドリフトのベンチマーク：再生は壊れるべきときに壊れ、修復され、赤のままでいるか？ | LocalSend で実施：5 種類 25 個の変更。[ミュータント](../../../drift-bench/mutants/localsend/README.md)は[プロトコル](../../../paper/protocol.md)のとおり、トレースを凍結した後に書きました。振る舞いの変更がグリーンで終わったものはありません。種類ごとの結果：[README](../README.md#results-on-localsend)、ファイルは [`paper/results/`](../../../paper/results/) |
| 論文 | 完成：[PDF](../../../paper/ecr-paper.pdf)、8 ページ、LocalSend での評価を含みます。プレプリントは Zenodo で公開します |
