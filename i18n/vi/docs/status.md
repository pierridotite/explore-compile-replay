# Những gì đã có

[English](../../../docs/status.md) · [简体中文](../../zh-CN/docs/status.md) · [日本語](../../ja/docs/status.md) · [Español](../../es/docs/status.md) · [Português](../../pt-BR/docs/status.md) · Tiếng Việt · [Türkçe](../../tr/docs/status.md)

Từng phần một, phần nào là bản nháp và phần nào chưa bắt đầu. Được cập nhật cùng với code.

| Phần | Trạng thái |
|---|---|
| Lược đồ trace, [`spec/schema.ts`](../../../spec/schema.ts) | Bản nháp. Đã kiểm tra kiểu, có một ví dụ đã xác thực và một [JSON Schema](../../../spec/trace.schema.json) được sinh ra. Một bước có thể mang bằng chứng (ảnh chụp màn hình, chỗ ngón tay chạm) cho các công cụ hiển thị trace |
| Hợp đồng adapter, [`spec/contract.ts`](../../../spec/contract.ts) | Bản nháp. Đã kiểm tra kiểu |
| Bảy định luật, [`spec/laws.md`](../../../spec/laws.md) | Bản nháp |
| Lõi, [`packages/core`](../../../packages/core/src/index.ts) | Phần đầu tiên: ghi một trace qua driver, xác thực nó, tính hash, phân giải tham số, kiểm tra source map, phân biệt một lỗi đã ghi với một hồi quy |
| Lệnh `ecr`, [`packages/cli`](../../../packages/cli/src/run.ts) | Chạy từ repo này: `validate`, `compile`, `replay`, `repair`, `conformance`. Chưa có trên npm. Xem [lệnh](command.md) |
| Máy chủ MCP, để một agent khám phá | Chưa bắt đầu. Hoan nghênh đóng góp: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Adapter tham chiếu, [`packages/adapter-fixture`](../../../packages/adapter-fixture/src/adapter.ts) | Chạy được. Một danh sách việc cần làm trong bộ nhớ, biên dịch ra một file `node:test` bình thường |
| Bộ kiểm tra tuân thủ, [`packages/conformance`](../../../packages/conformance/src/index.ts) | Kiểm tra L1, L2, L3, L4 (khi ngắt mạng), L5 và L7, và một phần L6 |
| Sửa, [`packages/core`](../../../packages/core/src/repair.ts) | Phần đầu tiên: `ecr repair` chấp nhận hoặc từ chối một hành động mới cho bước bị lệch. Nó không gọi mô hình nào và tự nó không đề xuất gì. Trên LocalSend, trên trình giả lập Android, nó chấp nhận đề xuất của một agent cho 25 trong 26 trace bị hỏng do một đoạn văn bản được viết lại, mọi kiểm tra giữ nguyên, và từ chối mọi đề xuất trên một kiểm tra thất bại. Thay đổi cần sửa hai bước sẽ bị từ chối |
| Adapter di động, [`packages/adapter-maestro`](../../../packages/adapter-maestro/README.md) | Bản nháp. Một bộ từ vựng di động và một trình biên dịch ra flow [Maestro](https://maestro.dev). Trên trình giả lập Android, với ứng dụng demo của mobile-agent-testers: hai flow viết tay được phát lại trong một [lần chạy khởi động bằng tay](../../../.github/workflows/device.yml), và trong bốn đường đi do agent khám phá, hai dừng ở một bước còn hai đường 37 và 25 bước được phát lại trọn vẹn mà không cần mô hình. Khi thất bại, nó nêu bước hoặc kiểm tra liên quan. Không có driver. Chưa thử trên iOS. Trên LocalSend, một ứng dụng thật: 7 trace được giữ lại từ 20 lần khám phá của một agent, và 137 trong 140 lần phát lại trên ứng dụng không thay đổi cho đúng kết quả mà trace ghi lại, không dùng mô hình ([kết quả](../README.md#results-on-localsend)). 20 trong 24 đường đi của một robot không dùng mô hình được phát lại trọn vẹn |
| Adapter web, biên dịch ra test Playwright | Chưa bắt đầu. Hoan nghênh đóng góp: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Bộ đo trôi dạt: lần phát lại có hỏng, được sửa, hay giữ đỏ khi cần không? | Đã chạy trên LocalSend: 25 thay đổi thuộc năm loại, các [mutant](../../../drift-bench/mutants/localsend/README.md) được viết sau khi các trace đã đóng băng, đúng như [giao thức](../../../paper/protocol.md) yêu cầu. Không có thay đổi hành vi nào kết thúc màu xanh. Kết quả theo loại: [README](../README.md#results-on-localsend), các tệp trong [`paper/results/`](../../../paper/results/) |
| Bài báo | Đã viết xong: [bản PDF](../../../paper/ecr-paper.pdf), 8 trang, với phần đánh giá trên LocalSend. Bản preprint sẽ được công bố trên Zenodo cùng bản phát hành đầu tiên |
