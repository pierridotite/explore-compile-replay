# Bugün var olanlar

[English](../../../docs/status.md) · [简体中文](../../zh-CN/docs/status.md) · [日本語](../../ja/docs/status.md) · [Español](../../es/docs/status.md) · [Português](../../pt-BR/docs/status.md) · [Tiếng Việt](../../vi/docs/status.md) · Türkçe

Parça parça: neyin taslak olduğu ve neyin başlamadığı. Kodla birlikte güncellenir.

| Parça | Durum |
|---|---|
| İz şeması, [`spec/schema.ts`](../../../spec/schema.ts) | Taslak. Tip kontrolünden geçti, doğrulanmış bir örneği ve üretilmiş bir [JSON Schema](../../../spec/trace.schema.json) dosyası var. Bir adım, bir izi gösteren araçlar için kanıt taşıyabilir (bir ekran görüntüsü, parmağın dokunduğu yer) |
| Adaptör sözleşmesi, [`spec/contract.ts`](../../../spec/contract.ts) | Taslak. Tip kontrolünden geçti |
| Yedi yasa, [`spec/laws.md`](../../../spec/laws.md) | Taslak |
| Çekirdek, [`packages/core`](../../../packages/core/src/index.ts) | İlk dilim: bir sürücü aracılığıyla iz kaydetmek, doğrulamak, hash'ini almak, parametreleri çözmek, bir kaynak haritasını kontrol etmek, kaydedilmiş bir hatayı bir gerilemeden ayırmak |
| `ecr` komutu, [`packages/cli`](../../../packages/cli/src/run.ts) | Bu depodan çalışır: `validate`, `compile`, `replay`, `repair`, `conformance`. Henüz npm'de değil. Bkz. [komut](command.md) |
| Bir ajanın keşfetmesi için MCP sunucusu | Başlamadı. Katkılara açık: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Referans adaptör, [`packages/adapter-fixture`](../../../packages/adapter-fixture/src/adapter.ts) | Çalışıyor. Bellekte bir yapılacaklar listesi, sade bir `node:test` dosyasına derlenir |
| Uygunluk kiti, [`packages/conformance`](../../../packages/conformance/src/index.ts) | L1, L2, L3, L4 (ağ kapalıyken), L5 ve L7'yi, L6'nın da bir kısmını kontrol eder |
| Onarım, [`packages/core`](../../../packages/core/src/repair.ts) | İlk dilim: `ecr repair`, sapan adım için yeni bir eylemi kabul eder ya da reddeder. Hiçbir modeli çağırmaz ve kendisi hiçbir şey önermez. LocalSend'de, Android emülatörlerinde, yeniden yazılmış bir metin yüzünden bozulan 26 izden 25'i için bir ajanın önerisini hiçbir kontrolü değiştirmeden kabul etti ve başarısız bir kontrol üzerindeki her öneriyi reddetti. İki adım gerektiren bir değişiklik reddedilir |
| Mobil adaptör, [`packages/adapter-maestro`](../../../packages/adapter-maestro/README.md) | Taslak. Bir mobil kelime dağarcığı ve [Maestro](https://maestro.dev) akışlarına bir derleyici. Bir Android emülatöründe, mobile-agent-testers'ın demo uygulamasına karşı: elle yazılmış iki akış [elle başlatılan bir çalıştırmada](../../../.github/workflows/device.yml) yeniden oynatılır, bir ajanın keşfettiği dört yoldan ikisi bir adımda durdu, 37 ve 25 adımlık diğer ikisi model olmadan baştan sona yeniden oynatıldı. Bir başarısızlık, adımını ya da kontrolünü belirtir. Sürücü yok. iOS'ta denenmedi. Gerçek bir uygulama olan LocalSend'de: bir ajanın 20 keşfinden 7 iz tutuldu ve değişmemiş uygulamada 140 yeniden oynatmanın 137'si, model olmadan, izin kaydettiği sonucu verdi ([sonuçlar](../README.md#results-on-localsend)). Model kullanmayan bir robotun 24 yolundan 20'si baştan sona yeniden oynatıldı |
| Playwright testlerine derleyen web adaptörü | Başlamadı. Katkılara açık: [CONTRIBUTING.md](../../../CONTRIBUTING.md) |
| Sapma ölçütü: bir yeniden oynatma gerektiğinde kırılıyor mu, onarılıyor mu, kırmızı kalıyor mu? | LocalSend'de çalıştırıldı: beş sınıfta 25 değişiklik; [mutantlar](../../../drift-bench/mutants/localsend/README.md), [protokolün](../../../paper/protocol.md) istediği gibi izler dondurulduktan sonra yazıldı. Hiçbir davranış değişikliği yeşil bitmedi. Sınıfa göre sonuçlar: [README](../README.md#results-on-localsend), dosyalar [`paper/results/`](../../../paper/results/) içinde |
| Makale | Yazıldı: [PDF](../../../paper/ecr-paper.pdf), 8 sayfa, LocalSend'deki değerlendirmeyle. Ön baskı ilk sürümle birlikte Zenodo'da yayımlanacak |
