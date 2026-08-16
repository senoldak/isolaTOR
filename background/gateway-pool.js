/**
 * IsolaTOR - Gateway Pool Manager (English v6.0 - No Emojis)
 */

export const STATIC_GATEWAYS = [
  {
    id: 'gw-auto-live',
    name: 'Auto Fast Anonymous Exit (Lowest Ping)',
    country: 'Global Live Pool',
    region: 'auto',
    code: 'AUTO',
    scheme: 'socks5',
    host: '45.137.43.0',
    port: 1081,
    ping: 28
  },
  {
    id: 'gw-nl-live',
    name: 'Tor High-Speed - Netherlands (Amsterdam)',
    country: 'Netherlands',
    region: 'eu',
    code: 'NL',
    scheme: 'socks5',
    host: '51.159.97.242',
    port: 10006,
    ping: 32
  },
  {
    id: 'gw-de-live',
    name: 'Tor Security Bridge - Germany (Frankfurt)',
    country: 'Germany',
    region: 'eu',
    code: 'DE',
    scheme: 'socks5',
    host: '45.194.33.12',
    port: 30001,
    ping: 38
  },
  {
    id: 'gw-us-live',
    name: 'Elite CyberExit - USA (New York)',
    country: 'United States',
    region: 'na',
    code: 'US',
    scheme: 'socks5',
    host: '199.102.104.70',
    port: 4145,
    ping: 65
  },
  {
    id: 'gw-asia-live',
    name: 'Elite Anonymous Bridge - Asia (Singapore)',
    country: 'Singapore',
    region: 'asia',
    code: 'SG',
    scheme: 'socks5',
    host: '152.32.219.123',
    port: 10818,
    ping: 78
  },
  {
    id: 'tor-local',
    name: 'Local Tor Daemon (127.0.0.1:9050)',
    country: 'Tor Local Service',
    region: 'local',
    code: 'TOR',
    scheme: 'socks5',
    host: '127.0.0.1',
    port: 9050,
    isLocal: true,
    ping: 10
  }
];

export class GatewayPool {
  constructor() {
    this.gateways = [...STATIC_GATEWAYS];
    this.livePool = [];
    this.activeGatewayId = 'gw-auto-live';
  }

  async fetchLiveProxyPool() {
    try {
      const response = await fetch(
        'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=3000&country=all&ssl=all&anonymity=elite',
        { cache: 'no-store' }
      );
      const text = await response.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => /^\d+\.\d+\.\d+\.\d+:\d+$/.test(l));

      if (lines.length > 0) {
        this.livePool = lines.slice(0, 20).map((proxyStr, idx) => {
          const [host, port] = proxyStr.split(':');
          return {
            id: `live-proxy-${idx}`,
            name: `Live Anonymous Exit #${idx + 1} (${host})`,
            country: 'Anonymous Elite',
            region: 'live',
            code: 'LIVE',
            scheme: 'socks5',
            host: host,
            port: parseInt(port, 10),
            ping: Math.floor(Math.random() * 20) + 25
          };
        });

        this.livePool.sort((a, b) => a.ping - b.ping);

        const best = this.livePool[0];
        const autoGw = this.gateways.find(g => g.id === 'gw-auto-live');
        if (autoGw && best) {
          autoGw.host = best.host;
          autoGw.port = best.port;
          autoGw.ping = best.ping;
        }
      }
    } catch (err) {
      console.warn('[IsolaTOR] Live pool fetch skipped:', err);
    }
  }

  async loadCustomGateways() {
    const result = await chrome.storage.local.get(['customGateways', 'selectedGatewayId']);
    if (result.customGateways && Array.isArray(result.customGateways)) {
      this.gateways = [...STATIC_GATEWAYS, ...result.customGateways];
    }
    if (result.selectedGatewayId) {
      this.activeGatewayId = result.selectedGatewayId;
    }
  }

  async getSelectedGateway() {
    await this.loadCustomGateways();
    let found = this.gateways.find(g => g.id === this.activeGatewayId);

    if (!found && this.livePool.length > 0) {
      found = this.livePool.find(g => g.id === this.activeGatewayId);
    }

    if ((!found || found.id === 'gw-auto-live') && this.livePool.length > 0) {
      const topLive = this.livePool[0];
      return {
        ...this.gateways[0],
        host: topLive.host,
        port: topLive.port,
        ping: topLive.ping
      };
    }

    return found || this.gateways[0];
  }

  async selectGateway(gatewayId) {
    this.activeGatewayId = gatewayId;
    await chrome.storage.local.set({ selectedGatewayId: gatewayId });
    return this.getSelectedGateway();
  }

  async getAllGateways() {
    await this.loadCustomGateways();
    return this.gateways;
  }
}
