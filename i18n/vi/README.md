<div align="center">

<img src="../../assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**Một agent khám phá ứng dụng của bạn một lần. Những gì nó làm trở thành một bài test chuẩn, chạy lại trong CI mà không cần mô hình nào.**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](../../LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[Bắt đầu nhanh](#quick-start)** · **[Tài liệu](docs/command.md)** · **[Bài báo và đặc tả](#paper-and-specification)** · **[Đóng góp](../../CONTRIBUTING.md)** · **[Nhật ký thay đổi](../../CHANGELOG.md)**

<sub>[English](../../README.md) · [简体中文](../zh-CN/README.md) · [日本語](../ja/README.md) · [Español](../es/README.md) · [Português](../pt-BR/README.md) · Tiếng Việt · [Türkçe](../tr/README.md)</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/linkedin-follow-dark.svg"><img src="../../assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/discord-join-dark.svg"><img src="../../assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/paper-dark.svg"><img src="../../assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/how-it-works-dark.svg"><img src="../../assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

Các agent AI giỏi tìm ra những chỗ không ai nghĩ đến việc test. Nhưng chúng chậm, tốn tiền mỗi lần chạy và không bao giờ đi cùng một đường hai lần, nên không hợp với CI. Explore-Compile-Replay (ECR) giữ phần đầu và bỏ phần còn lại: agent chạy một lần, và đường đi của nó được giữ lại thành một file test bình thường mà ai cũng đọc, review và chạy được.

> **Bản nháp đầu tiên, mở ngày 24 tháng 11 năm 2026.** Nó chạy trọn vẹn trên một hệ thống đồ chơi và một ứng dụng di động demo, nhưng chưa chạy trên ứng dụng thật: [tiến độ hiện tại](#where-it-stands).

<a name="quick-start"></a>

## Bắt đầu nhanh

Bạn cần Node 22.18 trở lên và pnpm. Chưa có gì trên npm: hãy chạy từ một bản clone.

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

Lệnh này phát lại một trace đã ghi trên một danh sách việc cần làm trong bộ nhớ, tức hệ thống tham chiếu. Tất cả các lệnh: [docs/command.md](docs/command.md).

## Cách hoạt động

1. **Explore (khám phá).** Một agent đóng vai một persona và dùng hệ thống một lần. Mỗi hành động và mỗi kiểm tra được ghi vào một trace có kiểu.
2. **Compile (biên dịch).** Trace trở thành một file test chuẩn, hiện nay là một flow [Maestro](https://maestro.dev) cho ứng dụng di động. Nó chạy mà không cần ECR.
3. **Replay (phát lại).** File chạy trong CI. Không mô hình, không token, lần nào cũng cùng một kết luận.

Khi ứng dụng thay đổi và một bước bị hỏng, agent của bạn đề xuất một hành động mới cho bước đó, và một **bản sửa (repair)** có giới hạn sẽ chấp nhận hoặc từ chối nó. Bản sửa có thể thay đổi cách một bước tìm mục tiêu, nhưng không bao giờ thay đổi điều mà test kiểm tra. Lỗi mà agent tìm thấy cũng được giữ lại: nó được biên dịch thành một test luôn đỏ cho đến khi lỗi được sửa.

<details>
<summary>Một bước của trace, và kết quả khi biên dịch</summary>

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

Một lần chạm được lưu theo tên của nút, không theo vị trí của nó trên màn hình. Văn bản đã gõ được lưu theo tên, không bao giờ theo giá trị. Ví dụ đầy đủ: [trace](../../packages/adapter-maestro/examples/anna-first-item-mobile.trace.json) và [flow](../../packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml).

</details>

<details>
<summary>Bốn kết quả của một lần phát lại</summary>

| Kết quả | Ý nghĩa |
|---|---|
| `pass` | Mọi kiểm tra đều đúng |
| `bug` | Lần phát lại dừng ở đúng lỗi mà trace ghi lại, và không dừng ở chỗ nào khác |
| `fixed` | Kiểm tra từng được ghi là lỗi giờ đã đúng. Nó trở thành một lớp bảo vệ |
| `FAIL` | Mọi trường hợp khác: một bước không còn tìm thấy mục tiêu, hoặc một kiểm tra từng đúng nay không còn đúng |

</details>

<a name="paper-and-specification"></a>

## Bài báo và đặc tả

ECR muốn trở thành một chuẩn mà ai cũng có thể hiện thực, không phải một công cụ.

- **Đặc tả.** [Định dạng trace](../../spec/schema.ts), cũng được công bố dưới dạng [JSON Schema](../../spec/trace.schema.json), [hợp đồng adapter](../../spec/contract.ts) và [bảy định luật](../../spec/laws.md): tất định, trung thực, truy vết được, không mô hình, trạng thái, sửa an toàn, không bí mật. Đây là các bản nháp và vẫn có thể thay đổi.
- **Bộ kiểm tra tuân thủ.** Kiểm tra một adapter theo từng định luật. Adapter nào vượt qua thì tuân thủ, bất kể ai viết nó. Cách viết một adapter: [docs/adapter.md](docs/adapter.md).
- **Bài báo.** Mô tả mẫu này, hợp đồng và một đánh giá trên một ứng dụng thật, [LocalSend](https://github.com/localsend/localsend). [Giao thức đánh giá](../../paper/protocol.md) đã được công khai trước lần đo đầu tiên. Bài báo đang được viết: bản preprint sẽ lên Zenodo cùng bản phát hành đầu tiên.
- **Trích dẫn.** [CITATION.cff](../../CITATION.cff), hoặc "Cite this repository" trên trang của repo, và một huy hiệu cho các dự án dùng ECR: [trích dẫn ECR](#citing-ecr).

<details>
<summary>Tóm tắt bảy định luật</summary>

| | Định luật | Tóm tắt |
|---|---|---|
| L1 | Tất định | Cùng một trace biên dịch ra cùng các byte. Cùng một file cho cùng một kết luận |
| L2 | Trung thực | File chạy các hành động và kiểm tra của trace, theo cùng thứ tự |
| L3 | Truy vết được | Mỗi bước của trace ứng với một đoạn riêng trong file |
| L4 | Không mô hình | Biên dịch và phát lại không gọi mô hình nào |
| L5 | Trạng thái | Một trạng thái đã lưu, khi khôi phục, được quan sát là giống hệt, nếu adapter lưu được trạng thái |
| L6 | Sửa an toàn | Một bản vá chỉ nằm trong bước bị lỗi, và không xóa hay làm yếu kiểm tra nào |
| L7 | Không bí mật | Cả trace lẫn file đều không chứa giá trị bí mật |

</details>

<a name="where-it-stands"></a>

## Tiến độ hiện tại

- **Đã chạy được:** lệnh `ecr` (`validate`, `compile`, `replay`, `repair`, `conformance`), một adapter tham chiếu, và một adapter di động biên dịch ra flow Maestro, đã phát lại trên trình giả lập Android.
- **Đang làm:** một ứng dụng thật là LocalSend, và bản phát hành đầu tiên cùng preprint và DOI.
- **Chưa có:** iOS, sửa trên thiết bị, gói trên npm.

Chi tiết từng phần: [docs/status.md](docs/status.md).

## Nguồn gốc

ECR là sự tổng quát hóa của [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), dự án cho mỗi tester AI một chiếc điện thoại trên runner của GitHub và cũng là dự án đầu tiên viết trace ECR. Hình dạng của ý tưởng đến từ [Remotion](https://www.remotion.dev), nơi một video là code: AI viết nó một lần, và mỗi lần render đều cho cùng một video mà không cần mô hình. Ở đây agent khám phá một lần, và lần phát lại chính là lần render.

<details>
<summary>ECR không nhận mình là đầu tiên: các công cụ đi trước</summary>

Đã có một số công cụ lưu hoặc phát lại những gì một agent đã làm, mỗi công cụ cho hệ thống riêng của nó: [Stagehand](https://github.com/browserbase/stagehand), [Skyvern](https://github.com/Skyvern-AI/skyvern), [workflow-use](https://github.com/browser-use/workflow-use), [Midscene](https://github.com/web-infra-dev/midscene), [Arbigent](https://github.com/takahirom/arbigent), [muscle-mem](https://github.com/pig-dot-dev/muscle-mem) và [autocompile](https://github.com/mirkokiefer/autocompile). Điều dự án này thêm vào là một cái tên cho mẫu này và một hợp đồng thành văn: dùng được cho nhiều hệ thống, biên dịch ra file chạy được mà không cần công cụ, bảo vệ những gì test kiểm tra, và có thể được kiểm chứng bằng một bộ kiểm tra tuân thủ.

</details>

<a name="citing-ecr"></a>

## Trích dẫn ECR

Nếu dự án của bạn dùng ECR, hãy cho mọi người thấy: thêm huy hiệu này vào README của bạn. Huy hiệu dẫn về repo này, và đó là cách nhóm tiếp theo tìm thấy mẫu này.

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

Hoặc nút này, tự đổi theo giao diện sáng hay tối của trang:

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/tested-with-ecr-dark.svg"><img src="../../assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

Trong một bài báo, một bài nói hay trang của một sản phẩm, hãy trích dẫn repo: nút "Cite this repository" trên GitHub cho bạn thông tin trích dẫn, lấy từ [CITATION.cff](../../CITATION.cff). DOI sẽ có cùng bản phát hành đầu tiên.

Với chính phần mã, giấy phép Apache-2.0 quyết định: mọi bản sao, fork hay gói chứa mã của ECR, dù có sửa hay không, đều phải giữ lại hai tệp [LICENSE](../../LICENSE) và [NOTICE](../../NOTICE). NOTICE ghi tên ECR và dẫn về repo này.

## Đóng góp

Điều đáng thử thách nhất lúc này là hợp đồng: [mở một issue](https://github.com/pierridotite/explore-compile-replay/issues/new) và cho biết điều gì không hợp với hệ thống của bạn. Nếu muốn viết code, [CONTRIBUTING.md](../../CONTRIBUTING.md) liệt kê hai phần lớn đang mở, một adapter web và một máy chủ MCP, cùng các việc nhỏ hơn để bắt đầu.

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

Tác giả Pierre Raffalli · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Giấy phép Apache-2.0](../../LICENSE)
