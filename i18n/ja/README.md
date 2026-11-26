<div align="center">

<img src="../../assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**エージェントがアプリを一度だけ探索します。その操作は標準的なテストになり、CI でモデルなしで繰り返し実行されます。**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](../../LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[クイックスタート](#quick-start)** · **[ドキュメント](docs/command.md)** · **[論文と仕様](#paper-and-specification)** · **[コントリビュート](../../CONTRIBUTING.md)** · **[変更履歴](../../CHANGELOG.md)**

<sub>[English](../../README.md) · [简体中文](../zh-CN/README.md) · 日本語 · [Español](../es/README.md) · [Português](../pt-BR/README.md) · [Tiếng Việt](../vi/README.md) · [Türkçe](../tr/README.md)</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/linkedin-follow-dark.svg"><img src="../../assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/discord-join-dark.svg"><img src="../../assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/paper-dark.svg"><img src="../../assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/how-it-works-dark.svg"><img src="../../assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

AI エージェントは、誰もテストしようと思わなかった箇所を見つけるのが得意です。一方で遅く、実行のたびにお金がかかり、同じ経路を二度たどることがないため、CI には向きません。Explore-Compile-Replay（ECR）は前者を残し、後者を取り除きます。エージェントは一度だけ動き、その経路は誰でも読めて、レビューでき、実行できる普通のテストファイルとして残ります。

> **初期ドラフト、2026 年 11 月 24 日に公開。** トイシステムとデモ用モバイルアプリでは最初から最後まで動きますが、実際のアプリではまだ動きません：[現状](#where-it-stands)。

<a name="quick-start"></a>

## クイックスタート

Node 22.18 以降と pnpm が必要です。npm にはまだ何も公開していないので、クローンから実行します。

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

これはメモリ上の ToDo リスト（リファレンスシステム）に対して、記録済みのトレースを再生します。すべてのコマンド：[docs/command.md](docs/command.md)。

## 仕組み

1. **Explore（探索）。** エージェントがペルソナを演じ、システムを一度使います。各操作と各チェックは型付きのトレースに記録されます。
2. **Compile（コンパイル）。** トレースは標準的なテストファイルになります。モバイルアプリの場合、現在は [Maestro](https://maestro.dev) のフローです。ECR なしで実行できます。
3. **Replay（再生）。** ファイルは CI で実行されます。モデルもトークンも使わず、毎回同じ判定になります。

アプリが変わってあるステップが壊れると、あなたのエージェントがそのステップの新しい操作を提案し、範囲の決まった**修復（repair）**がそれを受け入れるか拒否します。修復はステップが対象を見つける方法を変えられますが、テストが検証する内容は決して変えられません。エージェントが見つけたバグも残ります。バグが直るまで失敗し続けるテストにコンパイルされます。

<details>
<summary>トレースの 1 ステップと、そのコンパイル結果</summary>

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

タップは画面上の位置ではなく、ボタンの名前で保存されます。入力したテキストは名前で保存され、値は決して保存されません。例の全体：[トレース](../../packages/adapter-maestro/examples/anna-first-item-mobile.trace.json)と[フロー](../../packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml)。

</details>

<details>
<summary>再生の 4 つの結果</summary>

| 結果 | 意味 |
|---|---|
| `pass` | すべてのチェックが成り立つ |
| `bug` | 再生がトレースに記録されたバグで止まり、それ以外では止まらない |
| `fixed` | バグとして記録されたチェックが今は成り立つ。それはガードになる |
| `FAIL` | それ以外すべて：あるステップが対象を見つけられなくなった、または成り立っていたチェックが成り立たなくなった |

</details>

<a name="paper-and-specification"></a>

## 論文と仕様

ECR は一つのツールではなく、誰でも実装できる標準を目指しています。

- **仕様。** [トレース形式](../../spec/schema.ts)（[JSON Schema](../../spec/trace.schema.json) としても公開）、[アダプター契約](../../spec/contract.ts)、そして [7 つの法則](../../spec/laws.md)：決定性、忠実性、追跡可能性、モデルなし、状態、安全な修復、秘密なし。いずれもドラフトで、まだ変わる可能性があります。
- **適合性キット。** アダプターを法則ごとに検証します。これに通るアダプターは、誰が書いたものでも適合しています。書き方：[docs/adapter.md](docs/adapter.md)。
- **論文。** このパターン、契約、そして実際のアプリ [LocalSend](https://github.com/localsend/localsend) での評価を記述します。[評価プロトコル](../../paper/protocol.md)は最初の本計測より前に公開されました。執筆中で、プレプリントは最初のリリースとともに Zenodo で公開します。
- **引用。** [CITATION.cff](../../CITATION.cff)、またはリポジトリページの "Cite this repository"。ECR を使うプロジェクト向けのバッジもあります: [ECR の引用](#citing-ecr)。

<details>
<summary>7 つの法則の要約</summary>

| | 法則 | 要約 |
|---|---|---|
| L1 | 決定性 | 同じトレースは同じバイト列にコンパイルされる。同じファイルは同じ判定を返す |
| L2 | 忠実性 | ファイルはトレースの操作とチェックを同じ順序で実行する |
| L3 | 追跡可能性 | トレースの各ステップはファイル内の別々の範囲に対応する |
| L4 | モデルなし | コンパイルと再生はモデルを呼び出さない |
| L5 | 状態 | アダプターが状態を保存できる場合、復元した状態は同一として観測される |
| L6 | 安全な修復 | パッチは失敗したステップの中にとどまり、チェックを削除も弱めもしない |
| L7 | 秘密なし | トレースにもファイルにも秘密の値は含まれない |

</details>

<a name="where-it-stands"></a>

## 現状

- **今動くもの：** `ecr` コマンド（`validate`、`compile`、`replay`、`repair`、`conformance`）、リファレンスアダプター、そして Maestro フローにコンパイルするモバイルアダプター（Android エミュレーターで再生済み）。
- **進行中：** 実際のアプリ LocalSend と、プレプリントと DOI を伴う最初のリリース。
- **未着手：** iOS、デバイス上での修復、npm パッケージ。

部分ごとの状況：[docs/status.md](docs/status.md)。

## 生まれた経緯

ECR は [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers) を一般化したものです。mobile-agent-testers は GitHub のランナー上で AI テスター 1 人につき 1 台のスマートフォンを割り当てるプロジェクトで、ECR のトレースを書く最初のプロジェクトでもあります。アイデアの形は [Remotion](https://www.remotion.dev) から来ています。そこでは動画がコードであり、AI が一度書けば、レンダリングのたびにモデルなしで同じ動画が得られます。ECR では、エージェントが一度探索し、再生がレンダリングにあたります。

<details>
<summary>ECR は最初だとは主張しません：先行するツール</summary>

エージェントの操作を保存または再生するツールはすでにいくつかあり、それぞれ自分のシステム向けです：[Stagehand](https://github.com/browserbase/stagehand)、[Skyvern](https://github.com/Skyvern-AI/skyvern)、[workflow-use](https://github.com/browser-use/workflow-use)、[Midscene](https://github.com/web-infra-dev/midscene)、[Arbigent](https://github.com/takahirom/arbigent)、[muscle-mem](https://github.com/pig-dot-dev/muscle-mem)、[autocompile](https://github.com/mirkokiefer/autocompile)。このプロジェクトが加えるのは、このパターンの名前と、それを文書化した契約です。システムをまたいで使え、ツールなしで動くファイルにコンパイルし、テストが検証する内容を守り、適合性キットで検証できる契約です。

</details>

<a name="build-with-ecr"></a>

## ECR で作る

ECR はパターンであり、モバイル用のツールではありません。エージェントが使えるシステムなら、どれでも一度探索して、そのあとモデルなしで再生できます。以下は、ECR の上に作れるプロジェクトのアイデアです。どれかをきちんと実装した最初のリポジトリをここに掲載します。新しいアイデアは誰でも提案できます。

**ECR で作られたもの：** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers)。モバイルアプリ向けで、ECR のトレースを書く最初のプロジェクトです。

<details>
<summary>作れるもののアイデア</summary>

- **自分のアプリのセキュリティテスト。** エージェントが、アプリのテスト用コピーでアクセス制御の欠陥を探します。あるアカウントが別のアカウントのデータを見られる、有料の画面が支払いなしで開く、といったものです。見つかった欠陥はそれぞれテストにコンパイルされ、修正されるまで赤のままで、修正後は再発を防ぎます。対象は、自分が所有するシステムか、テストの許可を得たシステムだけです。
- **Web アプリ。** ブラウザー用のアダプター。エージェントがサイトを探索し、トレースは Playwright のテストにコンパイルされます。
- **アクセシビリティ。** エージェントがスクリーンリーダーで、またはキーボードだけでアプリを使います。ラベルのないボタンやフォーカストラップなど、先に進めなかったステップはそれぞれテストになります。
- **コマンドラインツール。** エージェントがヘルプからツールの使い方を覚え、トレースは終了コードと出力を検証するシェルのテストにコンパイルされます。
- **API。** エージェントが OpenAPI ファイルをもとに REST API を探索し、トレースはコントラクトテストにコンパイルされます。
- **ゲーム。** エージェントが固定シードでレベルをプレイし、トレースは入力の再生にコンパイルされます。変更のたびに、そのレベルがまだクリアできるかを確かめます。
- **入門ガイド。** エージェントが新しいマシンで README の手順をたどり、トレースは CI のジョブになります。ガイドがコードと合わなくなると、このジョブが失敗します。
- **業務アプリ。** エージェントがサンドボックスで CRM や ERP のバックオフィスの流れをたどり（たとえばレコードを作成して承認を得る）、トレースはそのプラットフォーム自身のテストにコンパイルされます。

</details>

<details>
<summary>リポジトリが掲載される条件と、アイデアの提案方法</summary>

リポジトリは次の条件を満たすと掲載されます。

- 公開されていて、オープンソースのライセンスであること。
- トレースが `ecr validate` に通り、独自のアダプターがある場合はそれが `ecr conformance` に通ること。
- コンパイルされたテストが CI でモデルなしで動き、それを示す成功した実行があること。
- README が[バッジかボタン](#citing-ecr)で ECR を引用していること。
- セキュリティをテストする場合は、ユーザーが所有するシステムか、テストの許可を得たシステムだけを対象とし、他人のシステムへの攻撃を公開しないこと。

掲載を希望するときは、リポジトリへのリンク、トレースを 1 つ、成功した実行を添えて [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) の issue を開いてください。リポジトリは届いた順に掲載します。リストにないアイデアを提案するときは、[Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml) の issue を開いてください。

</details>

<a name="citing-ecr"></a>

## ECR の引用

あなたのプロジェクトで ECR を使っているなら、このバッジを README に追加して示してください。バッジはこのリポジトリにリンクしていて、次のチームはそこからこのパターンを見つけます。

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

または、ページのライトテーマとダークテーマに合わせて表示が変わるこのボタン:

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/tested-with-ecr-dark.svg"><img src="../../assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

論文、講演、製品ページでは、リポジトリを引用してください。GitHub の "Cite this repository" ボタンが [CITATION.cff](../../CITATION.cff) から参照情報を出します。DOI は最初のリリースとともに付与します。

コードそのものについては Apache-2.0 ライセンスが定めています。ECR のコードのコピー、フォーク、パッケージは、変更の有無にかかわらず、[LICENSE](../../LICENSE) と [NOTICE](../../NOTICE) の 2 つのファイルを残さなければなりません。NOTICE には ECR の名前とこのリポジトリへのリンクが書かれています。

## コントリビュート

今いちばん議論したいのは契約です：[issue を開いて](https://github.com/pierridotite/explore-compile-replay/issues/new)、あなたのシステムに合わない点を教えてください。コードを書くなら、[CONTRIBUTING.md](../../CONTRIBUTING.md) に、空いている 2 つの大きな作業（Web アダプターと MCP サーバー）と、手始めに向いた小さなタスクがあります。

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

作者 Pierre Raffalli · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Apache-2.0 ライセンス](../../LICENSE)
