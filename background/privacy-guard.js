/**
 * IsolaTOR - WebRTC Leak Shield (English v6.0)
 */

export class PrivacyGuard {
  async enableProtection() {
    return new Promise((resolve) => {
      try {
        if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy) {
          chrome.privacy.network.webRTCIPHandlingPolicy.set(
            { value: 'disable_non_proxied_udp', scope: 'regular' },
            () => {
              console.log('[IsolaTOR] WebRTC Leak Guard Enabled (disable_non_proxied_udp).');
              resolve(true);
            }
          );
        } else {
          resolve(false);
        }
      } catch (err) {
        console.warn('[IsolaTOR] Privacy API Error:', err);
        resolve(false);
      }
    });
  }

  async disableProtection() {
    return new Promise((resolve) => {
      try {
        if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy) {
          chrome.privacy.network.webRTCIPHandlingPolicy.clear({ scope: 'regular' }, () => {
            console.log('[IsolaTOR] WebRTC Leak Guard Restored to Default.');
            resolve(true);
          });
        } else {
          resolve(false);
        }
      } catch (err) {
        resolve(false);
      }
    });
  }
}
