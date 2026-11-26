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

> **Bản nháp đầu tiên, mở ngày 24 tháng 11 năm 2026, nay đã đo trên một ứng dụng thật.** Trên LocalSend, 7 trace, trong đó một trace không ổn định, gặp 25 thay đổi được cài vào: không có hồi quy nào kết thúc màu xanh, và một lần sửa chỉ một bước được chấp nhận cho 25 trong 26 trace bị hỏng do một đoạn văn bản được viết lại, mọi kiểm tra giữ nguyên. Thay đổi cần sửa hai bước sẽ bị từ chối, và chưa đến một nửa số thay đổi về văn bản và cấu trúc được sửa trọn vẹn: [kết quả và giới hạn](#results-on-localsend).

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
- **Bài báo.** Mô tả mẫu này, hợp đồng và một đánh giá trên một ứng dụng thật, [LocalSend](https://github.com/localsend/localsend): [bản PDF](../../paper/ecr-paper.pdf), 8 trang. [Giao thức đánh giá](../../paper/protocol.md) đã được công khai trước lần đo đầu tiên, và mỗi con số đều lấy từ một [tệp kết quả](../../paper/results/). Bản preprint sẽ lên Zenodo cùng bản phát hành đầu tiên.
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

<a name="results-on-localsend"></a>

## Kết quả trên LocalSend

Phần đánh giá của [bài báo](../../paper/ecr-paper.pdf) chạy trên [LocalSend](https://github.com/localsend/localsend) v1.19.0, một ứng dụng chia sẻ tệp mã nguồn mở, được build từ mã nguồn và chạy trên trình giả lập Android. Một agent, `claude-sonnet-5-5`, đã khám phá nó 20 lần, và một trợ lý AI viết các kiểm tra theo một quy tắc định sẵn: 7 trace được giữ lại, ít hơn 10 trace dự kiến, với 62 kiểm tra. [Giao thức](../../paper/protocol.md) đã được công khai trước lần đo đầu tiên, và mỗi con số dưới đây đều lấy từ một [tệp kết quả](../../paper/results/).

| | Kết quả |
|---|---|
| Không mô hình | Không lần phát lại nào gọi mô hình. Lần phát lại cuối của mỗi trace chạy khi đã ngắt mạng, và vẫn đạt |
| Cùng kết quả | Trên ứng dụng không thay đổi, 137 trong 140 lần phát lại cho đúng kết quả mà trace ghi lại: 6 trace đạt 20 trên 20 lần, một trace 17 lần |
| Chạy lại agent | Khi chạy lại, agent đến được mục tiêu của trace trong 30 trên 35 lần, và đường đi của chính nó được phát lại trọn vẹn trong 12 trên 20 lần |
| Chi phí | Một lần phát lại không gọi mô hình; một lần chạy agent tốn trung vị 0,20 USD. Tính cả mọi lần sửa, một trace được giữ lại rẻ hơn việc chạy lại agent từ lần chạy thứ 8 về giá, nhưng chỉ từ lần thứ 76 về thời gian: một lần phát lại mất 52 đến 101 giây, một lần chạy agent mất 121,5 giây |
| Hồi quy | Không thay đổi nào trong 5 thay đổi hành vi kết thúc màu xanh. Tổng cộng có 25 thay đổi được cài vào, thuộc năm loại |
| Sửa | Lần sửa chỉ một bước do agent đề xuất được chấp nhận cho 25 trong 26 trace bị hỏng do một đoạn văn bản được viết lại, mọi kiểm tra giữ nguyên, và một trợ lý AI, không phải tác giả, đánh giá cả 25 lần sửa là đúng. Một kiểm tra thất bại không bao giờ được sửa |

<details>
<summary>Theo loại thay đổi, và những điểm bất lợi cho ECR</summary>

Năm thay đổi cho mỗi loại, mỗi thay đổi áp dụng riêng, rồi phát lại 7 trace, mỗi trace 3 lần. Phát hiện: một trace thất bại cả 3 lần phát lại.

| Thay đổi | Phát hiện | Sửa được |
|---|---|---|
| D1, một đoạn văn bản được viết lại | 5 trên 5 | 25 trên 26 trace; 4 trong 5 thay đổi được sửa cho mọi trace |
| D2, một định danh bị đổi tên | Không áp dụng: cả 54 lần chạm của 7 trace đều nhắm vào văn bản | |
| D3, mục tiêu bị dời chỗ | 2 trên 5: mục tiêu tìm theo văn bản vẫn tìm thấy sau khi dời chỗ | 0 trên 8 trace: 7 trace cần sửa hai bước, 1 trace dừng ở một kiểm tra |
| D4, một hộp thoại hiện ra trước | 5 trên 5, phần lớn dưới dạng kiểm tra thất bại, loại không bao giờ được sửa | 0 trên 34 trace, như dự kiến: sửa một bước không thể thêm một bước. Trong 90 trên 102 lần thử, chính agent trả lời rằng một bước là không đủ |
| D5, mục tiêu hiện ra trễ 1, 5 hoặc 15 giây | 0 trên 5: 102 trên 105 lần phát lại đạt, nhưng độ trễ 5 giây làm một trace thất bại ở một kiểm tra trong 2 trên 3 lần phát lại | Không yêu cầu sửa |
| D6, một trạng thái được kiểm tra không đạt tới | 5 trên 5 | Mọi đề xuất đều bị từ chối, qua 102 lần thử: không có màu xanh giả |

Những điểm bất lợi cho ECR: một trace không ổn định, thất bại 3 trong 20 lần phát lại ở kiểm tra ngay sau một lần nhấn Quay lại, chưa rõ nguyên nhân. Một lần sửa chỉ đổi một bước, nên chỉ 4 trong 10 thay đổi về văn bản và cấu trúc được sửa cho mọi trace. Khi được một trợ lý AI sửa tự do, chính 68 trace bị hỏng đó cần sửa 2 đến 4 dòng trong flow đã biên dịch, rồi đều đạt 3 trên 3 lần phát lại, trừ trace không ổn định: sửa tự do làm được điều mà giới hạn từ chối, nhưng không có gì bảo vệ những gì nó thay đổi. Với 5 trong 25 lần sửa được chấp nhận, không kiểm tra nào phát hiện được một lần chạm bị bỏ lỡ, vì vậy mỗi lần sửa được chấp nhận đều được đánh giá lại sau đó. Các thay đổi được viết ngay trong dự án, bởi một trợ lý AI, và một ứng dụng, một nền tảng, một mô hình chưa nói được nhiều về các trường hợp khác.

</details>

<a name="where-it-stands"></a>

## Tiến độ hiện tại

- **Đã chạy được:** lệnh `ecr` (`validate`, `compile`, `replay`, `repair`, `conformance`), một adapter tham chiếu, và một adapter di động biên dịch ra flow Maestro. Đã đo trên LocalSend, trên trình giả lập Android: phát lại không dùng mô hình, và các lần sửa được `ecr repair` kiểm tra ngay trên thiết bị.
- **Đang làm:** bản phát hành đầu tiên cùng preprint và DOI.
- **Chưa có:** iOS, gói trên npm.

Chi tiết từng phần: [docs/status.md](docs/status.md).

## Nguồn gốc

ECR là sự tổng quát hóa của [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), dự án cho mỗi tester AI một chiếc điện thoại trên runner của GitHub và cũng là dự án đầu tiên viết trace ECR. Hình dạng của ý tưởng đến từ [Remotion](https://www.remotion.dev), nơi một video là code: AI viết nó một lần, và mỗi lần render đều cho cùng một video mà không cần mô hình. Ở đây agent khám phá một lần, và lần phát lại chính là lần render.

<details>
<summary>ECR không nhận mình là đầu tiên: các công cụ đi trước</summary>

Đã có một số công cụ lưu hoặc phát lại những gì một agent đã làm, mỗi công cụ cho hệ thống riêng của nó: [Stagehand](https://github.com/browserbase/stagehand), [Skyvern](https://github.com/Skyvern-AI/skyvern), [workflow-use](https://github.com/browser-use/workflow-use), [Midscene](https://github.com/web-infra-dev/midscene), [Arbigent](https://github.com/takahirom/arbigent), [muscle-mem](https://github.com/pig-dot-dev/muscle-mem) và [autocompile](https://github.com/mirkokiefer/autocompile). Điều dự án này thêm vào là một cái tên cho mẫu này và một hợp đồng thành văn: dùng được cho nhiều hệ thống, biên dịch ra file chạy được mà không cần công cụ, bảo vệ những gì test kiểm tra, và có thể được kiểm chứng bằng một bộ kiểm tra tuân thủ.

</details>

<a name="build-with-ecr"></a>

## Xây dựng với ECR

ECR là một mẫu, không phải một công cụ cho di động: bất kỳ hệ thống nào mà agent dùng được đều có thể được khám phá một lần rồi phát lại mà không cần mô hình. Dưới đây là các ý tưởng dự án để xây dựng trên nó. Những repo đầu tiên hiện thực đúng cách một trong các ý tưởng này sẽ được liệt kê ở đây, và ai cũng có thể đề xuất ý tưởng mới. Mỗi dự án được liệt kê đều được ghi công bằng tên, kèm tác giả, ở đây và trong ghi chú phát hành của phiên bản tiếp theo.

**Được xây dựng với ECR:** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), của [pierridotite](https://github.com/pierridotite), cho ứng dụng di động, dự án đầu tiên ghi trace ECR. Các agent của nó đã khám phá LocalSend cho bài báo, và 7 trace được giữ lại từ đó phát lại được ở đó mà không cần mô hình: [kết quả](#results-on-localsend).

<details>
<summary>Các ý tưởng để xây dựng</summary>

- **Kiểm thử bảo mật cho chính ứng dụng của bạn.** Một agent tìm lỗ hổng phân quyền trong một bản sao thử nghiệm của ứng dụng: một tài khoản xem được dữ liệu của tài khoản khác, một màn hình trả phí mở được mà không cần trả tiền. Mỗi phát hiện được biên dịch thành một test giữ màu đỏ cho đến khi lỗ hổng được sửa, rồi ngăn nó quay lại. Chỉ trên các hệ thống bạn sở hữu hoặc được phép kiểm thử.
- **Ứng dụng web.** Một adapter cho trình duyệt: agent khám phá một trang web, và trace được biên dịch thành một test Playwright.
- **Khả năng tiếp cận.** Agent dùng ứng dụng bằng trình đọc màn hình, hoặc chỉ bằng bàn phím. Mỗi bước nó không vượt qua được, như một nút không có nhãn hay một bẫy tiêu điểm, trở thành một test.
- **Công cụ dòng lệnh.** Agent học cách dùng một công cụ từ phần trợ giúp của nó, và trace được biên dịch thành một test shell kiểm tra mã thoát và đầu ra.
- **API.** Agent khám phá một REST API từ file OpenAPI của nó, và trace được biên dịch thành các test hợp đồng.
- **Trò chơi.** Agent chơi một màn với một seed cố định, và trace được biên dịch thành một bản phát lại các thao tác, kiểm tra sau mỗi thay đổi rằng màn chơi vẫn có thể hoàn thành.
- **Hướng dẫn bắt đầu.** Agent làm theo một README trên một máy mới, và trace trở thành một job CI sẽ thất bại khi hướng dẫn không còn khớp với code.
- **Ứng dụng doanh nghiệp.** Agent đi qua một quy trình back-office của một CRM hay ERP trong sandbox, chẳng hạn tạo một bản ghi và được phê duyệt, và trace được biên dịch thành các test của chính nền tảng đó.

</details>

<details>
<summary>Cách một repo được liệt kê, và cách đề xuất ý tưởng</summary>

Một repo được liệt kê khi:

- nó công khai, với giấy phép mã nguồn mở;
- các trace của nó vượt qua `ecr validate`, và adapter của nó, nếu có, vượt qua `ecr conformance`;
- các test đã biên dịch chạy trong CI mà không cần mô hình, và có một lần chạy xanh chứng minh điều đó;
- README của nó trích dẫn ECR bằng [huy hiệu hoặc nút](#citing-ecr);
- nếu nó kiểm thử bảo mật, nó chỉ kiểm thử các hệ thống mà người dùng của nó sở hữu hoặc được phép kiểm thử, và không công bố cuộc tấn công nào vào hệ thống của người khác.

Để được liệt kê, hãy mở một issue [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) kèm link repo của bạn, một trace và lần chạy xanh đó. Các repo được liệt kê theo thứ tự gửi đến. Để đề xuất một ý tưởng chưa có trong danh sách, hãy mở một issue [Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml).

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

## Lịch sử star

<a href="https://star-history.com/#pierridotite/explore-compile-replay&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date&theme=dark"><img src="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date" alt="Star History Chart"></picture></a>

## Đóng góp

Điều đáng thử thách nhất lúc này là hợp đồng: [mở một issue](https://github.com/pierridotite/explore-compile-replay/issues/new) và cho biết điều gì không hợp với hệ thống của bạn. Nếu muốn viết code, [CONTRIBUTING.md](../../CONTRIBUTING.md) liệt kê hai phần lớn đang mở, một adapter web và một máy chủ MCP, cùng các việc nhỏ hơn để bắt đầu.

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

Tác giả Pierre Raffalli · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Giấy phép Apache-2.0](../../LICENSE)
