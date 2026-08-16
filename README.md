# 🛡️ IsolaTOR - Tor VPN & Privacy Shield

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](#)
[![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)](#)
[![Security](https://img.shields.io/badge/Security-Audit%20Ready-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](#)

> **Zero-Setup Tor & SOCKS5 Routing, Resilient Gateway Failover, WebRTC Leak Shield, Anti-Fingerprinting & Panic Session Wipe.**

---

## 📌 İçindekiler / Table of Contents
1. [Genel Bakış (Overview)](#-genel-bakış--overview)
2. [Öne Çıkan Özellikler (Key Features)](#-öne-çıkan-özellikler--key-features)
3. [Güvenlik ve Gizlilik Kalkanları (Security & Privacy Shields)](#-güvenlik-ve-gizlilik-kalkanları)
4. [Mimari ve Dosya Yapısı (Architecture & File Structure)](#-mimari-ve-dosya-yapısı)
5. [Kurulum Rehberi (Installation Guide)](#-kurulum-rehberi)
6. [Kullanım ve Kısayollar (Usage & Shortcuts)](#-kullanım-ve-kısayollar)
7. [Gelişmiş Ayarlar (Advanced Settings)](#-gelişmiş-ayarlar)
8. [Teknik Detaylar ve Protokoller (Technical Specifications)](#-teknik-detaylar-ve-protokoller)
9. [SSS (Frequently Asked Questions)](#-sss--faq)
10. [Lisans (License)](#-lisans)

---

## 🌟 Genel Bakış / Overview

**IsolaTOR**, Google Chrome ve Chromium tabanlı tüm modern tarayıcılar (Brave, Edge, Opera, Vivaldi vb.) için geliştirilmiş, **Manifest V3** uyumlu üst düzey bir gizlilik ve anonimlik eklentisidir. 

Karmaşık Tor Expert Bundle veya ek proxy yazılımları kurmaya gerek kalmadan, tek bir tıklamayla canlı küresel Tor/SOCKS5 çıkış düğümlerine bağlanır. WebRTC sızıntılarını donanımsal düzeyde engeller, Canvas ve Audio fingerprinting analizlerini gürültü (noise) enjeksiyonuyla bozar, DNS sızıntılarını sıfıra indirir ve acil durumlar için **Panic Wipe** temizleme mekanizması sunar.

---

## 🚀 Öne Çıkan Özellikler (Key Features)

- 🌐 **Sıfır Kurulumlu Canlı Tor & SOCKS5 Havuzu**: Canlı proxy listeleri ve yerleşik Tor ağ geçitleri arasında en düşük gecikmeli (ping) düğümü otomatik seçer.
- ⚡ **Otomatik Akıllı Düğüm Değişimi (Smart IP Rotation)**: Belirli periyotlarla (varsayılan 5 dk) veya bağlantı koptuğunda kesintisiz şekilde yeni bir düğüme atlar.
- 🛡️ **Sıfır WebRTC & DNS Sızıntısı**: Chromium'un `IPHandlingPolicy.DISABLE_NON_PROXIED_UDP` politikasını uygulayarak gerçek IP ve yerel ağ adreslerinin STUN/TURN sorgularıyla ifşa olmasını önler.
- 🎭 **Gelişmiş Parmak İzi Savunması (Anti-Fingerprinting)**:
  - **Canvas Noise**: Piksel düzeyinde fark edilmeyen XOR gürültüsü ekleyerek kanvas parmak izi çıkarma mekanizmalarını bozar.
  - **AudioContext Spoofing**: Ses osilatör ve FFT frekans verilerine dinamik tolerans ekler.
  - **Platform & OS Kamuflajı**: User-Agent, `navigator.platform`, donanım çekirdeği (`hardwareConcurrency`) ve bellek (`deviceMemory`) değerlerini standartlaştırır.
  - **Timezone Matcher**: Tarayıcı zaman dilimini otomatik olarak `Europe/Amsterdam` ile eşitleyerek lokasyon analizlerini yanıltır.
- 🛑 **Entegre Reklam & Takipçi Engelleyici (Declarative Net Request)**: 1000'den fazla bilinen reklam, telemetri, izleme ve coin-miner ağını bloklar.
- 🚨 **Acil Durum Butonu (Panic Wipe - `Alt+Shift+X`)**: Tek tık veya kısayolla tüm çerezleri, geçmişi, önbelleği, localStorage ve IndexedDB verilerini anında siler ve güvenli bir sayfaya yönlendirir.
- 🎨 **Çoklu Tema Motoru**: Cyberpunk, Stealth (Karanlık), Nord ve Matrix arayüz temaları.
- 🌍 **Çift Dil Desteği (i18n)**: Türkçe ve İngilizce arayüz desteği.

---

## 🔒 Güvenlik ve Gizlilik Kalkanları

| Kalkan Mekanizması | Koruma Seviyesi | Açıklama |
| :--- | :--- | :--- |
| **WebRTC Leak Shield** | 🔴 Kritik | Tarayıcının UDP paketlerini proxy dışına kaçırmasını engeller. |
| **Canvas Randomization** | 🟡 Yüksek | Sitelerin ekran kartı ve font renderlama ile sizi profillemesini önler. |
| **Audio Fingerprint Shield** | 🟡 Yüksek | Ses işleme donanımı parmak izini geçersiz kılar. |
| **DNS Leakage Prevention** | 🔴 Kritik | Tüm DNS çözümlemeleri proxy tüneli içerisinden uzaktan yapılır. |
| **Incognito Auto-Shield** | 🟢 Orta | Gizli sekme açıldığında gizlilik filtrelerini otomatik olarak sıkılaştırır. |
| **Bypass List (Whitelist)** | ⚙️ Özelleştirilebilir | Bankacılık, devlet kurumları ve `localhost` trafiğini tünel dışı tutar. |

---

## 📂 Mimari ve Dosya Yapısı

```plaintext
isolaTOR/
├── manifest.json                  # Manifest V3 yapılandırması, izinler ve kısayollar
├── rules/
│   └── adblock_rules.json         # DNR tabanlı reklam & takipçi engelleme kuralları
├── background/
│   ├── service-worker.js          # Arka plan yaşam döngüsü, alarm ve komut yönetimi
│   ├── proxy-manager.js           # Chromium proxy API ve PAC script yöneticisi
│   ├── gateway-pool.js            # Canlı Tor / SOCKS5 proxy havuzu ve gecikme testi
│   └── privacy-guard.js           # WebRTC, gizlilik ayarları ve tarama verisi temizliği
├── content/
│   └── privacy-injector.js        # Canvas, Audio, WebGL, Navigator spoofing injection
├── popup/
│   ├── popup.html                 # Hızlı bağlantı arayüzü
│   ├── popup.css                  # Modern neon/cyberpunk & stealth stilleri
│   └── popup.js                   # Popup UI mantığı, canlı ping ve güvenlik skoru
├── options/
│   ├── options.html               # Kapsamlı ayarlar ve düğüm yönetim paneli
│   ├── options.css                # Ayarlar sayfası responsive arayüzü
│   └── options.js                 # Düğüm ekleme/silme, whitelist ve kalkan konfigürasyonu
├── icons/                         # 16x16, 32x32, 48x48, 128x128 piksel ve vektörel ikonlar
└── _locales/
    ├── en/messages.json           # İngilizce dil kaynakları
    └── tr/messages.json           # Türkçe dil kaynakları
```

---

## 📥 Kurulum Rehberi (Installation Guide)

1. Bu projeyi bilgisayarınıza indirin veya klonlayın:
   ```bash
   git clone https://github.com/senoldak/isolaTOR.git
   ```
2. Chromium tabanlı tarayıcınızı açın (Google Chrome, Brave, Microsoft Edge vb.).
3. Adres çubuğuna `chrome://extensions/` yazın ve Enter'a basın.
4. Sağ üst köşedeki **"Geliştirici Modu" (Developer Mode)** anahtarını aktif hale getirin.
5. Sol üstteki **"Paketlenmemiş Öğe Yükle" (Load unpacked)** butonuna tıklayın.
6. İndirdiğiniz `isolaTOR` klasörünü seçin.
7. Eklenti simgesi araç çubuğunuza eklenecektir.

---

## ⌨️ Kullanım ve Kısayollar

### Kısayol Tuşları (Default Shortcuts)
- **`Alt + Shift + T`**: Tor / VPN Bağlantısını Aç / Kapat (Toggle Connection).
- **`Alt + Shift + X`**: **Acil Durum Temizliği (Panic Session Wipe)** - Tüm izleri siler ve oturumu sıfırlar.

### Hızlı Başlangıç
1. Araç çubuğundaki **isolaTOR** kalkan ikonuna tıklayın.
2. Ortadaki büyük güç butonuna basarak bağlantıyı başlatın.
3. Bağlantı sağlandığında tünel IP adresiniz, çıkış ülkesi ve canlı ping süresi ekranda görüntülenecektir.
4. Tema değiştirmek için sağ üstteki güneş/ay ikonunu kullanabilirsiniz.

---

## ⚙️ Gelişmiş Ayarlar (Advanced Settings)

Eklenti simgesine sağ tıklayıp **Seçenekler (Options)** sayfasına giderek aşağıdaki ayarları yapılandırabilirsiniz:

- **Özel Proxy Ekleme**: Kendi SOCKS5 veya HTTP(S) Tor ağ geçidinizi (`127.0.0.1:9050` veya uzak proxy) listeye ekleyebilirsiniz.
- **Bypass Listesi (Whitelist)**: Proxy üzerinden geçmesini istemediğiniz domainleri satır satır tanımlayın (örn. `*bank*.com`, `*.gov.tr`, `localhost`).
- **Otomatik Temizleme (Auto-Wipe on Disconnect)**: Bağlantıyı her kestiğinizde oturum çerezlerinin ve önbelleğin otomatik temizlenmesini sağlayın.
- **Gecikme & Canlılık Testi (Health Check)**: Havuzdaki tüm ağ geçitlerini tek tuşla test edin ve en hızlı olanı varsayılan yapın.

---

## 🔬 Teknik Detaylar ve Protokoller

### Proxy Yönetim Mimarisi
IsolaTOR, `chrome.proxy.settings` API'sini kullanarak dinamik bir **PAC (Proxy Auto-Configuration)** komut dosyası oluşturur:
```javascript
function FindProxyForURL(url, host) {
  // Whitelist / Bypass kontrolü
  if (shExpMatch(host, "*.bank.*") || isInNet(host, "127.0.0.0", "255.0.0.0")) {
    return "DIRECT";
  }
  // Aktif Tor / SOCKS5 Tüneli
  return "SOCKS5 127.0.0.1:9050; PROXY 127.0.0.1:9050; DIRECT";
}
```

### Canvas & Audio Noise Enjeksiyonu
Canvas öğelerinden `toDataURL` veya `getImageData` çağrıldığında, piksel dizisine tespit edilemeyecek düzeyde LSB (Least Significant Bit) modifikasyonu uygulanır. Bu sayede hiçbir izleme scripti tarayıcınıza ait sabit bir Canvas hash kodu üretemez.

---

## ❓ SSS / FAQ

**S: Ekstra bir Tor tarayıcısı veya tor.exe kurmam gerekiyor mu?**  
*C: Hayır. Eklenti yerleşik canlı ağ geçitleri ve otomatik failover mekanizmasıyla gelir. Ancak isterseniz yerel `127.0.0.1:9050` Tor Expert Bundle servisini de doğrudan bağlayabilirsiniz.*

**S: Banka hesaplarıma girerken sorun yaşar mıyım?**  
*C: Ayarlar menüsündeki "Bypass Listesi" sayesinde bankacılık ve kamu siteleri otomatik olarak doğrudan bağlantınız (DIRECT) üzerinden çalışır.*

**S: Tarayıcı geçmişim silinir mi?**  
*C: Sadece siz "Panic Wipe" butonuna bastığınızda veya "Bağlantı kesildiğinde otomatik temizle" seçeneğini aktif ettiğinizde geçmiş ve çerezler silinir.*

---

## 📄 Lisans / License

Bu proje **MIT Lisansı** altında açık kaynak olarak lisanslanmıştır. Detaylar için kaynak kodları inceleyebilirsiniz.

---
<p align="center">
  <b>Developed for Ultimate Privacy & Security • IsolaTOR v6.0</b>
</p>
