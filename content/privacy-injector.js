/**
 * IsolaTOR - Anti-Fingerprint, OS Camouflage & Timezone Matcher (English v6.0)
 */

(function () {
  'use strict';

  // 1. Timezone Matcher
  try {
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      const options = originalResolvedOptions.apply(this, arguments);
      options.timeZone = 'Europe/Amsterdam';
      return options;
    };
  } catch (e) {}

  // 2. OS & Platform Camouflage
  const spoofProfiles = {
    mac: {
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      platform: 'MacIntel',
      appVersion: '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  };

  const activeProfile = spoofProfiles.mac;

  try {
    Object.defineProperty(navigator, 'userAgent', { get: () => activeProfile.ua });
    Object.defineProperty(navigator, 'platform', { get: () => activeProfile.platform });
    Object.defineProperty(navigator, 'appVersion', { get: () => activeProfile.appVersion });
  } catch (e) {}

  // 3. Global Privacy Control & Do Not Track
  try {
    Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' });
    Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
  } catch (e) {}

  // 4. Hardware Concurrency & Memory Spoofing
  try {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  } catch (e) {}

  // 5. Canvas Anti-Fingerprinting
  const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) {
    const imageData = originalGetImageData.apply(this, arguments);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 64) {
      data[i] = data[i] ^ 1;
    }
    return imageData;
  };

  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function () {
    const ctx = this.getContext('2d');
    if (ctx && this.width > 0 && this.height > 0) {
      try {
        const img = ctx.getImageData(0, 0, 1, 1);
        img.data[0] = img.data[0] ^ 1;
        ctx.putImageData(img, 0, 0);
      } catch (e) {}
    }
    return originalToDataURL.apply(this, arguments);
  };

  // 6. AudioContext Anti-Fingerprinting
  if (window.AudioBuffer) {
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function (channel) {
      const data = originalGetChannelData.apply(this, arguments);
      for (let i = 0; i < data.length; i += 100) {
        data[i] += 0.0000001 * (Math.random() - 0.5);
      }
      return data;
    };
  }

  // 7. WebRTC Offer Interceptor
  if (window.RTCPeerConnection) {
    const originalCreateOffer = RTCPeerConnection.prototype.createOffer;
    RTCPeerConnection.prototype.createOffer = function (options) {
      return originalCreateOffer.apply(this, arguments);
    };
  }

  console.log('[IsolaTOR Armor] Anti-Fingerprint Active.');
})();
