/**
 * IsolaTOR CyberSec v6.0 - Options Controller (English - No Emojis)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const webrtcToggle = document.getElementById('webrtcToggle');
  const autoRotateToggle = document.getElementById('autoRotateToggle');
  const autoWipeToggle = document.getElementById('autoWipeToggle');
  const autoConnectToggle = document.getElementById('autoConnectToggle');
  const bypassListArea = document.getElementById('bypassListArea');
  const saveBypassBtn = document.getElementById('saveBypassBtn');
  
  const exportBackupBtn = document.getElementById('exportBackupBtn');
  const importBackupBtn = document.getElementById('importBackupBtn');
  const importFileInput = document.getElementById('importFileInput');

  const gwName = document.getElementById('gwName');
  const gwScheme = document.getElementById('gwScheme');
  const gwHost = document.getElementById('gwHost');
  const gwPort = document.getElementById('gwPort');
  const addGatewayBtn = document.getElementById('addGatewayBtn');
  const customGatewaysList = document.getElementById('customGatewaysList');

  // Load Settings
  const data = await chrome.storage.local.get([
    'webrtcBlock',
    'autoRotate',
    'autoWipeOnDisconnect',
    'autoConnect',
    'bypassList',
    'customGateways'
  ]);

  if (webrtcToggle) webrtcToggle.checked = data.webrtcBlock !== false;
  if (autoRotateToggle) autoRotateToggle.checked = data.autoRotate !== false;
  if (autoWipeToggle) autoWipeToggle.checked = !!data.autoWipeOnDisconnect;
  if (autoConnectToggle) autoConnectToggle.checked = !!data.autoConnect;

  if (bypassListArea && data.bypassList) {
    bypassListArea.value = data.bypassList.join(', ');
  }

  renderCustomGateways(data.customGateways || []);

  if (webrtcToggle) {
    webrtcToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ webrtcBlock: webrtcToggle.checked });
    });
  }

  if (autoRotateToggle) {
    autoRotateToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ autoRotate: autoRotateToggle.checked });
    });
  }

  if (autoWipeToggle) {
    autoWipeToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ autoWipeOnDisconnect: autoWipeToggle.checked });
    });
  }

  if (autoConnectToggle) {
    autoConnectToggle.addEventListener('change', async () => {
      await chrome.storage.local.set({ autoConnect: autoConnectToggle.checked });
    });
  }

  if (exportBackupBtn) {
    exportBackupBtn.addEventListener('click', async () => {
      const allSettings = await chrome.storage.local.get(null);
      const jsonStr = JSON.stringify(allSettings, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `isolator-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importBackupBtn && importFileInput) {
    importBackupBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          await chrome.storage.local.set(importedData);
          alert('Settings and backup restored successfully!');
          location.reload();
        } catch (err) {
          alert('Invalid backup JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  if (saveBypassBtn) {
    saveBypassBtn.addEventListener('click', async () => {
      const raw = bypassListArea.value;
      const list = raw.split(',').map(s => s.trim()).filter(Boolean);
      await chrome.storage.local.set({ bypassList: list });
      alert('Bypass list saved successfully!');
    });
  }

  if (addGatewayBtn) {
    addGatewayBtn.addEventListener('click', async () => {
      const name = gwName.value.trim();
      const scheme = gwScheme.value;
      const host = gwHost.value.trim();
      const port = parseInt(gwPort.value.trim(), 10);

      if (!name || !host || isNaN(port)) {
        alert('Please fill out all server fields.');
        return;
      }

      const newGw = {
        id: 'custom-' + Date.now(),
        name: name,
        country: 'Custom Bridge',
        scheme: scheme,
        host: host,
        port: port,
        isLocal: host === '127.0.0.1' || host === 'localhost'
      };

      const current = await chrome.storage.local.get(['customGateways']);
      const list = current.customGateways || [];
      list.push(newGw);

      await chrome.storage.local.set({ customGateways: list });

      gwName.value = '';
      gwHost.value = '';
      gwPort.value = '';

      renderCustomGateways(list);
      alert('Custom server added successfully!');
    });
  }

  function renderCustomGateways(list) {
    if (!customGatewaysList) return;
    customGatewaysList.innerHTML = '';
    if (list.length === 0) {
      customGatewaysList.innerHTML = '<p style="font-size:0.8rem; color:#64748b;">No custom bridges added yet.</p>';
      return;
    }

    list.forEach(gw => {
      const div = document.createElement('div');
      div.className = 'gw-item';
      div.innerHTML = `
        <div class="gw-item-info">
          <strong>${gw.name}</strong> (${gw.scheme}://${gw.host}:${gw.port})
        </div>
        <button class="gw-item-del" data-id="${gw.id}">Delete</button>
      `;

      div.querySelector('.gw-item-del').addEventListener('click', async () => {
        const updated = list.filter(item => item.id !== gw.id);
        await chrome.storage.local.set({ customGateways: updated });
        renderCustomGateways(updated);
      });

      customGatewaysList.appendChild(div);
    });
  }
});
