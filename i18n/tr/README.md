<div align="center">

<img src="../../assets/logo.svg" alt="" width="96" height="96">

# Explore-Compile-Replay

**Bir ajan uygulamanızı bir kez keşfeder. Yaptıkları, CI'da hiçbir model olmadan yeniden çalışan standart bir teste dönüşür.**

[![CI](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml/badge.svg)](https://github.com/pierridotite/explore-compile-replay/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/pierridotite/explore-compile-replay?style=flat&label=stars&color=1f883d)](https://github.com/pierridotite/explore-compile-replay/stargazers)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-1f883d)](../../LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/pierridotite/explore-compile-replay?color=1f883d)](https://github.com/pierridotite/explore-compile-replay/commits/main)

**[Hızlı başlangıç](#quick-start)** · **[Belgeler](docs/command.md)** · **[Makale ve şartname](#paper-and-specification)** · **[Katkıda bulunma](../../CONTRIBUTING.md)** · **[Değişiklikler](../../CHANGELOG.md)**

<sub>[English](../../README.md) · [简体中文](../zh-CN/README.md) · [日本語](../ja/README.md) · [Español](../es/README.md) · [Português](../pt-BR/README.md) · [Tiếng Việt](../vi/README.md) · Türkçe</sub>

<a href="https://www.linkedin.com/in/pierre-raffalli/"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/linkedin-follow-dark.svg"><img src="../../assets/linkedin-follow-light.svg" alt="Follow Pierre Raffalli on LinkedIn" width="160" height="54"></picture></a>
<a href="https://discord.gg/WuaCANscr8"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/discord-join-dark.svg"><img src="../../assets/discord-join-light.svg" alt="Join us on Discord" width="160" height="54"></picture></a>
<a href="#paper-and-specification"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/paper-dark.svg"><img src="../../assets/paper-light.svg" alt="Read about the paper" width="160" height="54"></picture></a>

</div>

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/how-it-works-dark.svg"><img src="../../assets/how-it-works-light.svg" alt="Explore once with an agent. The trace is compiled to a test file that runs without ECR and is replayed in CI with no model. When the app changes, a bounded repair proposes a patch, which is compiled again." width="900"></picture></p>

Yapay zekâ ajanları kimsenin test etmeyi düşünmediği şeyleri bulmakta iyidir. Ama yavaştırlar, her çalıştırmada para harcatırlar ve aynı yolu asla iki kez izlemezler, bu yüzden CI'a uymazlar. Explore-Compile-Replay (ECR) ilk kısmı tutar ve gerisini atar: ajan bir kez çalışır ve izlediği yol, herkesin okuyabileceği, inceleyebileceği ve çalıştırabileceği sade bir test dosyası olarak saklanır.

> **İlk taslak, 24 Kasım 2026'da açıldı.** Bir oyuncak sistemde ve bir demo mobil uygulamada baştan sona çalışıyor, henüz gerçek bir uygulamada değil: [şu anki durum](#where-it-stands).

<a name="quick-start"></a>

## Hızlı başlangıç

Node 22.18 veya üstü ve pnpm gerekir. npm'de henüz bir şey yok: bir klondan çalışır.

```sh
git clone https://github.com/pierridotite/explore-compile-replay && cd explore-compile-replay
pnpm install
pnpm check     # types, tests and the conformance report

export ECR_PARAM_ITEM_TITLE="Buy bread" ECR_PARAM_PRIVATE_NOTE="Door code 4821"
pnpm ecr replay packages/adapter-fixture/examples/anna-first-item.trace.json \
  --adapter packages/adapter-fixture/src/index.ts
# pass  anna-first-item (node-test, 80 ms)
```

Bu komut, kaydedilmiş bir izi bellekteki bir yapılacaklar listesine, yani referans sisteme karşı yeniden oynatır. Tüm komutlar: [docs/command.md](docs/command.md).

## Nasıl çalışır

1. **Explore (keşfet).** Bir ajan bir personayı canlandırır ve sistemi bir kez kullanır. Her eylem ve her kontrol, tipli bir ize (trace) kaydedilir.
2. **Compile (derle).** İz standart bir test dosyasına dönüşür; bugün bir mobil uygulama için bir [Maestro](https://maestro.dev) akışı. ECR olmadan çalışır.
3. **Replay (yeniden oynat).** Dosya CI'da çalışır. Model yok, token yok, her seferinde aynı karar.

Uygulama değiştiğinde ve bir adım bozulduğunda, ajanınız o adım için yeni bir eylem önerir ve sınırlı bir **onarım** bunu kabul eder ya da reddeder. Bir onarım, bir adımın hedefini nasıl bulduğunu değiştirebilir, testin neyi kontrol ettiğini asla değiştiremez. Ajanın bulduğu bir hata da saklanır: hata düzeltilene kadar kırmızı kalan bir teste derlenir.

<details>
<summary>Bir izin bir adımı ve neye derlendiği</summary>

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

Dokunuş, düğmenin ekrandaki yeriyle değil adıyla saklanır. Yazılan metin değeriyle asla saklanmaz, adıyla saklanır. Örneğin tamamı: [iz](../../packages/adapter-maestro/examples/anna-first-item-mobile.trace.json) ve [akış](../../packages/adapter-maestro/examples/anna-first-item-mobile.flow.yaml).

</details>

<details>
<summary>Bir yeniden oynatmanın dört sonucu</summary>

| Sonuç | Anlamı |
|---|---|
| `pass` | Tüm kontroller tutuyor |
| `bug` | Yeniden oynatma, izin kaydettiği hatada duruyor ve başka hiçbir yerde durmuyor |
| `fixed` | Hata olarak kaydedilen kontrol artık tutuyor. Bir korumaya dönüşür |
| `FAIL` | Diğer her şey: bir adım artık hedefini bulamıyor ya da tutan bir kontrol artık tutmuyor |

</details>

<a name="paper-and-specification"></a>

## Makale ve şartname

ECR tek bir araç değil, herkesin uygulayabileceği bir standart olmayı hedefliyor.

- **Şartname.** [İz biçimi](../../spec/schema.ts) (ayrıca bir [JSON Schema](../../spec/trace.schema.json) olarak yayımlandı), [adaptör sözleşmesi](../../spec/contract.ts) ve [yedi yasa](../../spec/laws.md): belirlenimcilik, sadakat, izlenebilirlik, model yok, durum, güvenli onarım, sır yok. Hâlâ değişebilecek taslaklar.
- **Uygunluk kiti.** Bir adaptörü yasa yasa kontrol eder. Onu geçen bir adaptör, kim yazmış olursa olsun uygundur. Nasıl yazılır: [docs/adapter.md](docs/adapter.md).
- **Makale.** Bu kalıbı, sözleşmeyi ve gerçek bir uygulama olan [LocalSend](https://github.com/localsend/localsend) üzerindeki bir değerlendirmeyi anlatır. [Değerlendirme protokolü](../../paper/protocol.md) ilk ölçümden önce yayımlandı. Yazılıyor: ön baskı ilk sürümle birlikte Zenodo'ya gelecek.
- **Atıf.** [CITATION.cff](../../CITATION.cff) ya da deponun sayfasındaki "Cite this repository" ve ECR kullanan projeler için bir rozet: [ECR'ye atıf](#citing-ecr).

<details>
<summary>Kısaca yedi yasa</summary>

| | Yasa | Kısaca |
|---|---|---|
| L1 | Belirlenimcilik | Aynı iz aynı baytlara derlenir. Aynı dosya aynı kararı verir |
| L2 | Sadakat | Dosya, izin eylemlerini ve kontrollerini aynı sırayla çalıştırır |
| L3 | İzlenebilirlik | İzin her adımı dosyanın ayrı bir aralığına karşılık gelir |
| L4 | Model yok | Derleme ve yeniden oynatma hiçbir modeli çağırmaz |
| L5 | Durum | Adaptör bir durumu kaydedebiliyorsa, geri yüklenen durum aynısı olarak gözlenir |
| L6 | Güvenli onarım | Bir yama başarısız adımın içinde kalır ve hiçbir kontrolü silmez ya da zayıflatmaz |
| L7 | Sır yok | Ne iz ne de dosya gizli bir değer içerir |

</details>

<a name="where-it-stands"></a>

## Şu anki durum

- **Bugün çalışan:** `ecr` komutu (`validate`, `compile`, `replay`, `repair`, `conformance`), bir referans adaptör ve Maestro akışlarına derleyen, bir Android emülatöründe yeniden oynatılmış bir mobil adaptör.
- **Sürüyor:** gerçek bir uygulama olarak LocalSend ve ön baskı ile DOI'yi içeren ilk sürüm.
- **Henüz yok:** iOS, bir cihazda onarım, npm'de bir paket.

Parça parça: [docs/status.md](docs/status.md).

## Nereden geliyor

ECR, GitHub'ın runner'larında her yapay zekâ test edicisine bir telefon veren ve ECR izlerini yazan ilk proje olan [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers)'ın genelleştirilmiş hâlidir. Fikrin biçimi, bir videonun kod olduğu [Remotion](https://www.remotion.dev)'dan geliyor: bir yapay zekâ onu bir kez yazar ve her render, hiçbir model olmadan aynı videoyu verir. Burada ajan bir kez keşfeder ve yeniden oynatma render'ın kendisidir.

<details>
<summary>ECR ilk olduğunu iddia etmiyor: önceki araçlar</summary>

Bir ajanın yaptıklarını saklayan ya da yeniden oynatan birkaç araç zaten var, her biri kendi sistemi için: [Stagehand](https://github.com/browserbase/stagehand), [Skyvern](https://github.com/Skyvern-AI/skyvern), [workflow-use](https://github.com/browser-use/workflow-use), [Midscene](https://github.com/web-infra-dev/midscene), [Arbigent](https://github.com/takahirom/arbigent), [muscle-mem](https://github.com/pig-dot-dev/muscle-mem) ve [autocompile](https://github.com/mirkokiefer/autocompile). Bu projenin eklediği, kalıp için bir ad ve yazılı bir sözleşmedir: farklı sistemlerde işleyen, aracın kendisi olmadan çalışan dosyalara derleyen, testlerin kontrol ettiğini koruyan ve bir uygunluk kitiyle doğrulanabilen bir sözleşme.

</details>

<a name="build-with-ecr"></a>

## ECR ile geliştirin

ECR bir kalıptır, bir mobil araç değil: bir ajanın kullanabildiği her sistem bir kez keşfedilip ardından modelsiz yeniden oynatılabilir. Aşağıda onun üzerine kurulabilecek proje fikirleri var. Bunlardan birini düzgün biçimde hayata geçiren ilk depolar burada listelenecek ve herkes yeni bir fikir önerebilir.

**ECR ile geliştirilenler:** [mobile-agent-testers](https://github.com/pierridotite/mobile-agent-testers), mobil uygulamalar için, ECR izleri yazan ilk proje.

<details>
<summary>Geliştirilecek fikirler</summary>

- **Kendi uygulamanızın güvenlik testleri.** Bir ajan, uygulamanızın bir test kopyasında erişim açıkları arar: başka bir hesabın verilerini görebilen bir hesap, ödeme yapmadan açılan ücretli bir ekran. Her bulgu, açık düzeltilene kadar kırmızı kalan ve sonra açığın geri gelmesini önleyen bir teste derlenir. Yalnızca sahibi olduğunuz ya da test etme izniniz olan sistemlerde.
- **Web uygulamaları.** Bir tarayıcı adaptörü: ajan bir siteyi keşfeder ve iz bir Playwright testine derlenir.
- **Erişilebilirlik.** Ajan bir uygulamayı bir ekran okuyucuyla ya da yalnızca klavyeyle kullanır. Geçemediği her adım, örneğin etiketsiz bir düğme ya da bir odak tuzağı, bir teste dönüşür.
- **Komut satırı araçları.** Ajan bir aracı yardım metninden öğrenir ve iz, çıkış kodlarını ve çıktıları kontrol eden bir kabuk testine derlenir.
- **API'ler.** Ajan bir REST API'yi OpenAPI dosyasından keşfeder ve iz sözleşme testlerine derlenir.
- **Oyunlar.** Ajan sabit bir tohumla bir bölüm oynar ve iz, her değişiklikten sonra bölümün hâlâ bitirilebildiğini kontrol eden bir girdi tekrarına derlenir.
- **Başlangıç kılavuzları.** Ajan yeni bir makinede bir README'yi adım adım izler ve iz, kılavuz artık kodla uyuşmadığında başarısız olan bir CI işine dönüşür.
- **Kurumsal uygulamalar.** Ajan bir sandbox'ta bir CRM ya da ERP'nin arka ofis akışından geçer, örneğin bir kayıt oluşturup onaylatır, ve iz platformun kendi testlerine derlenir.

</details>

<details>
<summary>Bir depo nasıl listelenir ve bir fikir nasıl önerilir</summary>

Bir depo şu durumda listelenir:

- herkese açıktır ve açık kaynak bir lisansı vardır;
- izleri `ecr validate` kontrolünden geçer ve kendi adaptörü varsa o adaptör `ecr conformance` kontrolünden geçer;
- derlenen testleri CI'da modelsiz çalışır ve bunu gösteren yeşil bir çalıştırma vardır;
- README dosyası ECR'ye [rozet ya da düğmeyle](#citing-ecr) atıf yapar;
- güvenlik test ediyorsa yalnızca kullanıcılarının sahibi olduğu ya da test etme izni olan sistemleri test eder ve başkalarının sistemlerine yönelik hiçbir saldırı yayımlamaz.

Listelenmek için deponuzun bağlantısını, bir izi ve yeşil çalıştırmayı ekleyerek bir [Built with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=built-with-ecr.yml) issue'su açın. Depolar geliş sırasına göre listelenir. Listede olmayan bir fikir önermek için bir [Idea to build with ECR](https://github.com/pierridotite/explore-compile-replay/issues/new?template=idea.yml) issue'su açın.

</details>

<a name="citing-ecr"></a>

## ECR'ye atıf

Projeniz ECR kullanıyorsa bunu gösterin: bu rozeti README dosyanıza ekleyin. Rozet bu depoya bağlantı verir; bir sonraki ekip kalıbı böyle bulur.

[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)

```md
[![tested with Explore-Compile-Replay](https://img.shields.io/badge/tested%20with-Explore--Compile--Replay-18181B)](https://github.com/pierridotite/explore-compile-replay)
```

Ya da sayfanın açık veya koyu temasına uyan bu düğme:

<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="../../assets/tested-with-ecr-dark.svg"><img src="../../assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>

```html
<a href="https://github.com/pierridotite/explore-compile-replay"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-dark.svg"><img src="https://raw.githubusercontent.com/pierridotite/explore-compile-replay/main/assets/tested-with-ecr-light.svg" alt="Tested with Explore-Compile-Replay" width="320" height="54"></picture></a>
```

Bir makalede, bir konuşmada ya da bir ürün sayfasında depoya atıf yapın: GitHub'daki "Cite this repository" düğmesi kaynağı [CITATION.cff](../../CITATION.cff) dosyasından verir. İlk sürümle birlikte bir DOI gelecek.

Kodun kendisi için Apache-2.0 lisansı geçerlidir: ECR kodunun her kopyası, fork'u ya da paketi, değiştirilmiş olsun ya da olmasın, [LICENSE](../../LICENSE) ve [NOTICE](../../NOTICE) dosyalarını korumak zorundadır. NOTICE, ECR'nin adını ve bu deponun bağlantısını içerir.

## Yıldız geçmişi

<a href="https://star-history.com/#pierridotite/explore-compile-replay&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date&theme=dark"><img src="https://api.star-history.com/svg?repos=pierridotite/explore-compile-replay&type=Date" alt="Star History Chart"></picture></a>

## Katkıda bulunma

Şu an sorgulanması gereken şey sözleşme: [bir issue açın](https://github.com/pierridotite/explore-compile-replay/issues/new) ve sisteminize neyin uymayacağını söyleyin. Kod yazmak için [CONTRIBUTING.md](../../CONTRIBUTING.md), açık iki büyük parçayı (bir web adaptörü ve bir MCP sunucusu) ve başlamak için daha küçük görevleri listeler.

<a href="https://github.com/pierridotite/explore-compile-replay/graphs/contributors"><img src="https://contrib.rocks/image?repo=pierridotite/explore-compile-replay" alt="Contributors" /></a>

Pierre Raffalli tarafından yapıldı · [LinkedIn](https://www.linkedin.com/in/pierre-raffalli/) · [GitHub](https://github.com/pierridotite) · [Discord](https://discord.gg/WuaCANscr8) · [Apache-2.0 lisansı](../../LICENSE)
