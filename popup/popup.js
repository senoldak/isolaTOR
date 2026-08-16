/**
 * IsolaTOR - Redesigned Clean & Fast Popup Controller (v6.0 English)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const powerBtn = document.getElementById('powerBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const ipDisplay = document.getElementById('ipDisplay');
  const pingDisplay = document.getElementById('pingDisplay');
  const locationDisplay = document.getElementById('locationDisplay');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const themeNameTag = document.getElementById('themeNameTag');
  const rotateIpBtn = document.getElementById('rotateIpBtn');
  const testIpBtn = document.getElementById('testIpBtn');
  const panicBtn = document.getElementById('panicBtn');
  const themeBtn = document.getElementById('themeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const regionPills = document.querySelectorAll('.region-pill');

  const THEMES = [
    { id: 'cyber', label: 'Cyber v6.0' },
    { id: 'matrix', label: 'Matrix' },
    { id: 'blood', label: 'Blood' },
    { id: 'midnight', label: 'Midnight' }
  ];

  let currentThemeIdx = 0;
  let isConnected = false;

  function refreshState() {
    chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (res) => {
      if (!res) return;
      isConnected = res.connected;
      applyTheme(res.theme || 'cyber');
      updateUIState(isConnected, res.state);
      updateActivePill(res.gateway?.id);
    });
  }

  function applyTheme(themeId) {
    document.body.setAttribute('data-theme', themeId);
    currentThemeIdx = THEMES.findIndex(t => t.id === themeId);
    if (currentThemeIdx === -1) currentThemeIdx = 0;
    if (themeNameTag) themeNameTag.textContent = THEMES[currentThemeIdx].label;
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
      const nextTheme = THEMES[currentThemeIdx];
      applyTheme(nextTheme.id);
      chrome.runtime.sendMessage({ action: 'SET_THEME', theme: nextTheme.id });
    });
  }

  function updateActivePill(activeId) {
    if (!regionPills) return;
    regionPills.forEach(pill => {
      if (pill.dataset.id === activeId) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  function updateUIState(connected, state) {
    if (connected) {
      if (powerBtn) powerBtn.className = 'power-trigger connected';
      if (statusDot) statusDot.className = 'pulse-dot connected';
      if (statusText) {
        statusText.textContent = 'PROTECTED';
        statusText.style.color = 'var(--accent-green)';
      }

      if (ipDisplay) ipDisplay.textContent = state?.ip || 'Masked IP';
      if (pingDisplay) pingDisplay.textContent = `${state?.ping || 28} ms`;
      if (locationDisplay) locationDisplay.textContent = state?.country || 'Anonymous Exit';
      if (scoreDisplay) scoreDisplay.textContent = '🛡️ 100/100';
    } else {
      if (powerBtn) powerBtn.className = 'power-trigger';
      if (statusDot) statusDot.className = 'pulse-dot disconnected';
      if (statusText) {
        statusText.textContent = 'DISCONNECTED';
        statusText.style.color = 'var(--text-secondary)';
      }

      if (ipDisplay) ipDisplay.textContent = '---.---.---.---';
      if (pingDisplay) pingDisplay.textContent = '-- ms';
      if (locationDisplay) locationDisplay.textContent = 'Direct';
      if (scoreDisplay) scoreDisplay.textContent = '⚠️ 20/100';
    }
  }

  if (powerBtn) {
    powerBtn.addEventListener('click', () => {
      if (isConnected) {
        powerBtn.className = 'power-trigger';
        if (statusDot) statusDot.className = 'pulse-dot connecting';
        if (statusText) statusText.textContent = 'DISCONNECTING...';

        chrome.runtime.sendMessage({ action: 'DISCONNECT' }, (res) => {
          if (res?.success) {
            isConnected = false;
            updateUIState(false, null);
          }
        });
      } else {
        powerBtn.className = 'power-trigger connecting';
        if (statusDot) statusDot.className = 'pulse-dot connecting';
        if (statusText) statusText.textContent = 'CONNECTING...';

        const activePill = document.querySelector('.region-pill.active');
        const selectedGwId = activePill ? activePill.dataset.id : 'gw-auto-live';

        chrome.runtime.sendMessage({ action: 'CONNECT', gatewayId: selectedGwId }, (res) => {
          if (res?.success) {
            isConnected = true;
            updateUIState(true, { ip: 'Masking IP...', ping: 28, country: 'Anonymous Network' });
            setTimeout(refreshState, 1000);
          } else {
            updateUIState(false, null);
            alert('Connection failed: ' + (res?.error || 'Unknown error'));
          }
        });
      }
    });
  }

  if (regionPills) {
    regionPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const targetId = pill.dataset.id;
        updateActivePill(targetId);
        chrome.runtime.sendMessage({ action: 'SELECT_GATEWAY', gatewayId: targetId }, () => {
          if (isConnected) refreshState();
        });
      });
    });
  }

  if (rotateIpBtn) {
    rotateIpBtn.addEventListener('click', () => {
      rotateIpBtn.innerHTML = `<span>⏳ Rotating</span>`;
      chrome.runtime.sendMessage({ action: 'ROTATE_IP' }, () => {
        setTimeout(() => {
          rotateIpBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            <span>Rotate IP</span>
          `;
          refreshState();
        }, 1000);
      });
    });
  }

  if (testIpBtn) {
    testIpBtn.addEventListener('click', () => {
      testIpBtn.innerHTML = `<span>Verifying...</span>`;
      chrome.runtime.sendMessage({ action: 'REFRESH_IP' }, (res) => {
        testIpBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Verify</span>
        `;
        if (res) {
          if (ipDisplay) ipDisplay.textContent = res.ip;
          if (pingDisplay) pingDisplay.textContent = `${res.ping} ms`;
          if (locationDisplay) locationDisplay.textContent = res.country;
        }
      });
    });
  }

  if (panicBtn) {
    panicBtn.addEventListener('click', () => {
      if (confirm('Emergency Panic Mode: All tabs will be sanitized and proxy closed. Proceed?')) {
        chrome.runtime.sendMessage({ action: 'PANIC' }, () => window.close());
      }
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
      else window.open(chrome.runtime.getURL('options/options.html'));
    });
  }

  refreshState();
});
