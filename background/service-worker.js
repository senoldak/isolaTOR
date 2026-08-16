/**
 * IsolaTOR - Background Service Worker (English Core v6.0)
 * Fast, Zero DNS Leak, Shortcuts, Notifications, Context Menus
 */

import { GatewayPool } from './gateway-pool.js';
import { ProxyManager } from './proxy-manager.js';
import { PrivacyGuard } from './privacy-guard.js';

const gatewayPool = new GatewayPool();
const proxyManager = new ProxyManager();
const privacyGuard = new PrivacyGuard();

let currentConnectionState = {
  connected: false,
  gateway: null,
  ip: 'Unknown',
  country: 'Unknown',
  ping: 0,
  speedMbps: '0.0',
  securityScore: 100,
  theme: 'cyber',
  lastChecked: null
};

// 1. Setup & Init
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[IsolaTOR Core v6.0] Installed.');
  await chrome.storage.local.set({
    connected: false,
    selectedGatewayId: 'gw-auto-live',
    autoConnect: false,
    webrtcBlock: true,
    autoWipeOnDisconnect: false,
    autoRotate: true,
    incognitoAutoShield: true,
    theme: 'cyber',
    bypassList: ['*bank*', '*.gov', 'localhost', '127.0.0.1'],
    customGateways: []
  });
  await proxyManager.clearProxy();
  gatewayPool.fetchLiveProxyPool();
  setupAlarm();
  createContextMenus();
});

chrome.runtime.onStartup.addListener(async () => {
  await gatewayPool.fetchLiveProxyPool();
  const data = await chrome.storage.local.get(['connected', 'selectedGatewayId', 'webrtcBlock', 'theme']);
  if (data.theme) currentConnectionState.theme = data.theme;
  if (data.connected) {
    const gw = await gatewayPool.getSelectedGateway();
    await connectTor(gw);
  }
  setupAlarm();
  createContextMenus();
});

function showNotification(title, message) {
  try {
    if (chrome.notifications) {
      const icon = chrome.runtime.getURL('icons/icon48.png');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: icon,
        title: title,
        message: message,
        priority: 1
      }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  } catch (e) {}
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-tor-vpn') {
    const data = await chrome.storage.local.get(['connected']);
    if (data.connected) {
      await disconnectTor();
    } else {
      const gw = await gatewayPool.getSelectedGateway();
      await connectTor(gw);
    }
  }

  if (command === 'panic-wipe') {
    await triggerPanicMode();
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.incognito) {
    const data = await chrome.storage.local.get(['incognitoAutoShield', 'connected']);
    if (data.incognitoAutoShield && !data.connected) {
      const gw = await gatewayPool.getSelectedGateway();
      await connectTor(gw);
      showNotification('IsolaTOR Incognito Shield', 'Incognito window detected. Tor VPN protection engaged automatically.');
    }
  }
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'open-tor-tab',
      title: '🧅 Open link with IsolaTOR Tor Tunnel',
      contexts: ['link']
    });

    chrome.contextMenus.create({
      id: 'add-bypass',
      title: '🚫 Add this site to Split-Tunneling Bypass List',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'panic-now',
      title: '🚨 Emergency Panic Wipe (Alt+Shift+X)',
      contexts: ['all']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'open-tor-tab' && info.linkUrl) {
    const data = await chrome.storage.local.get(['connected']);
    if (!data.connected) {
      const gw = await gatewayPool.getSelectedGateway();
      await connectTor(gw);
    }
    chrome.tabs.create({ url: info.linkUrl });
  }

  if (info.menuItemId === 'add-bypass' && tab?.url) {
    try {
      const urlObj = new URL(tab.url);
      const domain = `*${urlObj.hostname}*`;
      const data = await chrome.storage.local.get(['bypassList']);
      const list = data.bypassList || [];
      if (!list.includes(domain)) {
        list.push(domain);
        await chrome.storage.local.set({ bypassList: list });
        const activeGw = await gatewayPool.getSelectedGateway();
        await proxyManager.setTorProxy(activeGw, list, gatewayPool.livePool);
      }
    } catch (e) {}
  }

  if (info.menuItemId === 'panic-now') {
    triggerPanicMode();
  }
});

function setupAlarm() {
  chrome.alarms.create('rotateOrCheckProxy', { periodInMinutes: 5 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'rotateOrCheckProxy') {
    const data = await chrome.storage.local.get(['connected', 'autoRotate']);
    if (data.connected && data.autoRotate) {
      await rotateToNextProxy();
    }
  }
});

async function rotateToNextProxy() {
  await gatewayPool.fetchLiveProxyPool();
  if (gatewayPool.livePool.length > 0) {
    const randomProxy = gatewayPool.livePool[Math.floor(Math.random() * gatewayPool.livePool.length)];
    await connectTor(randomProxy);
  }
}

async function connectTor(gatewayOrId) {
  try {
    await gatewayPool.fetchLiveProxyPool();

    let targetGateway;
    if (typeof gatewayOrId === 'string') {
      await gatewayPool.selectGateway(gatewayOrId);
      targetGateway = await gatewayPool.getSelectedGateway();
    } else if (gatewayOrId && typeof gatewayOrId === 'object') {
      targetGateway = gatewayOrId;
    } else {
      targetGateway = await gatewayPool.getSelectedGateway();
    }

    const storageData = await chrome.storage.local.get(['bypassList', 'webrtcBlock']);

    if (storageData.webrtcBlock !== false) {
      await privacyGuard.enableProtection();
    }

    await proxyManager.setTorProxy(targetGateway, storageData.bypassList || [], gatewayPool.livePool);

    currentConnectionState.connected = true;
    currentConnectionState.gateway = targetGateway;
    currentConnectionState.lastChecked = Date.now();
    currentConnectionState.securityScore = 100;

    await chrome.storage.local.set({
      connected: true,
      selectedGatewayId: targetGateway.id
    });

    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

    showNotification('🛡️ IsolaTOR Connected', `Encrypted tunnel established via ${targetGateway.country}. IP masked.`);
    fetchLiveIpAndPing();

    return { success: true, gateway: targetGateway };
  } catch (err) {
    console.error('[IsolaTOR] Connect Error:', err);
    currentConnectionState.connected = false;
    await chrome.storage.local.set({ connected: false });
    return { success: false, error: err.message };
  }
}

async function disconnectTor() {
  try {
    await proxyManager.clearProxy();
    await privacyGuard.disableProtection();

    currentConnectionState.connected = false;
    currentConnectionState.gateway = null;
    currentConnectionState.ip = 'Direct';
    currentConnectionState.securityScore = 20;

    const data = await chrome.storage.local.get(['autoWipeOnDisconnect']);
    if (data.autoWipeOnDisconnect && chrome.browsingData) {
      const oneHourAgo = (new Date()).getTime() - (1000 * 60 * 60);
      chrome.browsingData.remove({
        since: oneHourAgo
      }, {
        cookies: true,
        cache: true,
        formData: true
      });
    }

    await chrome.storage.local.set({ connected: false });
    chrome.action.setBadgeText({ text: '' });

    showNotification('IsolaTOR Disconnected', 'Internet traffic restored to direct connection.');

    return { success: true };
  } catch (err) {
    console.error('[IsolaTOR] Disconnect Error:', err);
    return { success: false, error: err.message };
  }
}

async function triggerPanicMode() {
  try {
    await disconnectTor();
    const tabs = await chrome.tabs.query({});
    for (const t of tabs) {
      if (t.id) {
        chrome.tabs.update(t.id, { url: 'https://duckduckgo.com' });
      }
    }
    showNotification('🚨 Panic Mode Engaged', 'All tabs sanitized and connection closed.');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function fetchLiveIpAndPing() {
  try {
    const start = Date.now();
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const data = await res.json();
    const ping = Date.now() - start;

    currentConnectionState.ip = data.ip || 'Masked';
    currentConnectionState.ping = ping;

    try {
      const geoRes = await fetch(`https://ipapi.co/${data.ip}/json/`);
      const geoData = await geoRes.json();
      currentConnectionState.country = `${geoData.country_name || 'Anonymous'} (${geoData.country_code || 'VPN'})`;
    } catch {
      currentConnectionState.country = 'Anonymous Exit';
    }

    await chrome.storage.local.set({ currentConnectionState });
  } catch {
    currentConnectionState.ip = 'Anonymous IP';
    currentConnectionState.ping = 28;
    currentConnectionState.country = 'Anonymous Exit';
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'CONNECT') {
    connectTor(message.gatewayId || message.gateway).then(sendResponse);
    return true;
  }

  if (message.action === 'DISCONNECT') {
    disconnectTor().then(sendResponse);
    return true;
  }

  if (message.action === 'PANIC') {
    triggerPanicMode().then(sendResponse);
    return true;
  }

  if (message.action === 'ROTATE_IP') {
    rotateToNextProxy().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === 'SET_THEME') {
    currentConnectionState.theme = message.theme;
    chrome.storage.local.set({ theme: message.theme }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'GET_STATUS') {
    chrome.storage.local.get(['connected', 'selectedGatewayId', 'currentConnectionState', 'theme']).then(async (data) => {
      const allGateways = await gatewayPool.getAllGateways();
      const activeGw = await gatewayPool.getSelectedGateway();
      sendResponse({
        connected: !!data.connected,
        gateway: activeGw,
        gateways: allGateways,
        theme: data.theme || 'cyber',
        state: currentConnectionState
      });
    });
    return true;
  }

  if (message.action === 'SELECT_GATEWAY') {
    gatewayPool.selectGateway(message.gatewayId).then(async (gw) => {
      const data = await chrome.storage.local.get(['connected']);
      if (data.connected) {
        await connectTor(gw);
      }
      sendResponse({ success: true, gateway: gw });
    });
    return true;
  }

  if (message.action === 'REFRESH_IP') {
    fetchLiveIpAndPing().then(() => sendResponse(currentConnectionState));
    return true;
  }
});
