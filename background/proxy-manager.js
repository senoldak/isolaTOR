/**
 * IsolaTOR - Zero DNS Leak & Resilient SOCKS5h Proxy Engine (English v6.0)
 */

export class ProxyManager {
  constructor() {
    this.isConnected = false;
  }

  async setTorProxy(gateway, bypassList = [], backupList = []) {
    return new Promise((resolve, reject) => {
      try {
        let proxyConfig;
        const host = String(gateway.host).trim();
        const port = parseInt(gateway.port, 10);

        const bypassArr = Array.isArray(bypassList) && bypassList.length > 0 ? bypassList : [];
        const bypassConditions = bypassArr.map(d => `shExpMatch(host, "${d}")`).join(' || ');

        let proxyChain = `SOCKS5 ${host}:${port}`;
        if (Array.isArray(backupList) && backupList.length > 0) {
          const backups = backupList.slice(0, 4).map(b => `SOCKS5 ${b.host}:${b.port}`).join('; ');
          proxyChain += `; ${backups}`;
        }

        const pacScript = [
          "function FindProxyForURL(url, host) {",
          "  if (isPlainHostName(host) || host === 'localhost' || host === '127.0.0.1') {",
          "    return 'DIRECT';",
          "  }",
          bypassConditions ? `  if (${bypassConditions}) { return 'DIRECT'; }` : "",
          "  if (shExpMatch(host, '*.onion')) {",
          "    return 'HTTPS onion.ws:443; HTTPS tor2web.in:443; SOCKS5 127.0.0.1:9050';",
          "  }",
          gateway.isLocal
            ? "  return 'SOCKS5 127.0.0.1:9050; SOCKS5 127.0.0.1:9150';"
            : `  return '${proxyChain}';`,
          "}"
        ].filter(Boolean).join("\n");

        proxyConfig = {
          mode: 'pac_script',
          pacScript: { data: pacScript }
        };

        chrome.proxy.settings.set(
          { value: proxyConfig, scope: 'regular' },
          () => {
            if (chrome.runtime.lastError) {
              console.error('[IsolaTOR] Proxy Set Error:', chrome.runtime.lastError);
              return reject(new Error(chrome.runtime.lastError.message));
            }
            this.isConnected = true;
            console.log('[IsolaTOR] Zero-DNS-Leak Proxy Active.');
            resolve(true);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  async clearProxy() {
    return new Promise((resolve) => {
      chrome.proxy.settings.set(
        { value: { mode: 'direct' }, scope: 'regular' },
        () => {
          this.isConnected = false;
          console.log('[IsolaTOR] Proxy Cleared -> DIRECT');
          resolve(true);
        }
      );
    });
  }
}
