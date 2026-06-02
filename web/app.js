// app.js
document.addEventListener('DOMContentLoaded', () => {
  const client = new MedBoxBleClient();

  // DOM Elements
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const compatBanner = document.getElementById('compat-banner');
  const statusBadge = document.getElementById('connection-status');
  const statusText = document.getElementById('status-text');
  
  const selectedDisplay = document.getElementById('selected-compartment-display');
  const pillMinusBtn = document.getElementById('pill-minus-btn');
  const pillPlusBtn = document.getElementById('pill-plus-btn');
  const pillAmountVal = document.getElementById('pill-amount-val');
  
  const safetySlider = document.getElementById('safety-slider');
  const sliderFill = document.getElementById('slider-fill');
  const sliderHandle = document.getElementById('slider-handle');
  const sliderText = document.getElementById('slider-text');
  
  const consoleLog = document.getElementById('console-log');
  const clearLogBtn = document.getElementById('clear-log-btn');

  // State Variables
  let selectedCompartment = 0;
  let pillAmount = 1;
  const pillNames = ['Tablette A', 'Tablette B', 'Tablette C', 'Tablette D'];
  
  // Checking Browser Web-Bluetooth Compatibility
  if (!client.isSupported()) {
    compatBanner.classList.remove('hidden');
    connectBtn.disabled = true;
    addLog('Browser unterstützt Web Bluetooth nicht. Bitte Chrome/Edge verwenden.', 'error');
  }

  // Initializing Pill Names from Local Storage
  for (let i = 0; i < 4; i++) {
    const savedName = localStorage.getItem(`medbox_pill_name_${i}`);
    const input = document.getElementById(`pill-name-${i}`);
    if (savedName) {
      pillNames[i] = savedName;
      if (input) input.value = savedName;
    }
    
    // Save on change
    if (input) {
      input.addEventListener('input', (e) => {
        const val = e.target.value.trim() || `Fach ${i}`;
        pillNames[i] = val;
        localStorage.setItem(`medbox_pill_name_${i}`, val);
        updateSelectionDisplay();
      });
    }
  }

  // Update selection text helper
  function updateSelectionDisplay() {
    selectedDisplay.textContent = `Fach ${selectedCompartment} (${pillNames[selectedCompartment]})`;
  }
  updateSelectionDisplay();

  // Log function helper
  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    
    let tagClass = 'tag-info';
    let tagText = 'INFO';
    if (type === 'tx') {
      tagClass = 'tag-tx';
      tagText = 'BLE OUT';
    } else if (type === 'rx') {
      tagClass = 'tag-rx';
      tagText = 'BLE IN';
    } else if (type === 'error') {
      tagClass = 'tag-error';
      tagText = 'FEHLER';
    }

    entry.innerHTML = `
      <div class="log-meta">
        <span class="log-time">${timeStr}</span>
        <span class="log-tag ${tagClass}">${tagText}</span>
      </div>
      <div class="log-msg">${escapeHtml(message)}</div>
    `;
    
    consoleLog.appendChild(entry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // BLE Callbacks setup
  client.onConnected = () => {
    statusBadge.className = 'status-badge connected';
    statusText.textContent = 'Verbunden';
    connectBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-flex';
    safetySlider.classList.remove('disabled');
    addLog('GATT-Verbindung zur MedBox hergestellt. Benachrichtigungen sind aktiv.', 'info');
  };

  client.onDisconnected = () => {
    statusBadge.className = 'status-badge disconnected';
    statusText.textContent = 'Getrennt';
    connectBtn.style.display = 'inline-flex';
    disconnectBtn.style.display = 'none';
    safetySlider.classList.add('disabled');
    resetSlider();
    addLog('Verbindung zur MedBox getrennt.', 'error');
  };

  client.onNotification = (feedback) => {
    addLog(feedback, 'rx');
  };

  // Connect & Disconnect handlers
  connectBtn.addEventListener('click', async () => {
    addLog('Scanne nach "MedBox BLE Control"...', 'info');
    try {
      await client.connect();
    } catch (err) {
      addLog(`Verbindung fehlgeschlagen: ${err.message}`, 'error');
    }
  });

  disconnectBtn.addEventListener('click', async () => {
    try {
      await client.disconnect();
    } catch (err) {
      addLog(`Fehler beim Trennen: ${err.message}`, 'error');
    }
  });

  // Clear Log
  clearLogBtn.addEventListener('click', () => {
    consoleLog.innerHTML = '';
    addLog('Protokoll gelöscht.', 'info');
  });

  // Compartment selector handler
  document.querySelectorAll('.cmd-select').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
      selectedCompartment = id;
      
      // Update UI active card states
      document.querySelectorAll('.compartment-card').forEach(card => {
        card.classList.remove('active-dispensation');
      });
      document.getElementById(`comp-card-${id}`).classList.add('active-dispensation');
      
      updateSelectionDisplay();
      addLog(`Ausgewählt für Ausgabe: Fach ${id} (${pillNames[id]})`, 'info');
    });
  });

  // Funnel Rotation handler
  document.querySelectorAll('.cmd-rotate').forEach(button => {
    button.addEventListener('click', async (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
      
      if (!client.isConnected()) {
        addLog('Aktion fehlgeschlagen: Keine Verbindung zur MedBox.', 'error');
        alert('Bitte verbinden Sie zuerst die MedBox über Bluetooth.');
        return;
      }

      addLog(`Rotiere Trichter zu Fach ${id}...`, 'info');
      try {
        // Log outgoing message structure
        const payload = {
          messageType: 4,
          message: { targetCompartmentNumber: id }
        };
        addLog(JSON.stringify(payload), 'tx');
        
        await client.rotateFunnel(id);
      } catch (err) {
        addLog(`Drehung fehlgeschlagen: ${err.message}`, 'error');
      }
    });
  });

  // Pill amount increment / decrement
  pillMinusBtn.addEventListener('click', () => {
    if (pillAmount > 1) {
      pillAmount--;
      pillAmountVal.textContent = pillAmount;
    }
  });

  pillPlusBtn.addEventListener('click', () => {
    if (pillAmount < 5) {
      pillAmount++;
      pillAmountVal.textContent = pillAmount;
    }
  });

  // ==========================================
  // SAFETY SLIDE TO DISPENSE IMPLEMENTATION
  // ==========================================
  let isDragging = false;
  let startX = 0;
  let maxOffset = 0;

  // Calculate sliding dimensions
  function getSliderDimensions() {
    const containerWidth = safetySlider.clientWidth;
    const handleWidth = sliderHandle.clientWidth;
    // Account for padding (3px on left, 3px on right)
    return containerWidth - handleWidth - 6;
  }

  // Handle Drag Start
  function startDrag(e) {
    if (safetySlider.classList.contains('disabled')) return;
    isDragging = true;
    
    // Support touch
    const pageX = e.type.startsWith('touch') ? e.touches[0].pageX : e.pageX;
    startX = pageX;
    maxOffset = getSliderDimensions();
    
    sliderHandle.style.transition = 'none';
    sliderFill.style.transition = 'none';
    
    // Add global events for move and release to prevent clipping issues
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
  }

  // Handle Drag Move
  function dragMove(e) {
    if (!isDragging) return;
    
    // Prevent screen scroll when swiping on mobile
    if (e.cancelable) e.preventDefault();
    
    const pageX = e.type.startsWith('touch') ? e.touches[0].pageX : e.pageX;
    let offset = pageX - startX;
    
    // Lock drag boundaries
    offset = Math.max(0, Math.min(offset, maxOffset));
    
    // Translate visually
    sliderHandle.style.transform = `translateX(${offset}px)`;
    sliderFill.style.width = `${offset + (sliderHandle.clientWidth / 2)}px`;
    
    // Fade out label as you slide
    const progress = offset / maxOffset;
    sliderText.style.opacity = 1 - (progress * 1.5);
  }

  // Handle Drag End
  async function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    
    // Remove global listeners
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);
    
    const containerWidth = safetySlider.clientWidth;
    const handleWidth = sliderHandle.clientWidth;
    maxOffset = getSliderDimensions();
    
    // Read final position
    const currentTransform = window.getComputedStyle(sliderHandle).transform;
    let offset = 0;
    if (currentTransform !== 'none') {
      const matrix = new DOMMatrix(currentTransform);
      offset = matrix.m41;
    }
    
    // Threshold to trigger (90% completion)
    if (offset >= maxOffset * 0.9) {
      // Trigger Dispensation
      await executeDispensation();
    } else {
      // Rebound/Reset Slider
      resetSlider();
    }
  }

  function resetSlider() {
    sliderHandle.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    sliderFill.style.transition = 'width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    sliderHandle.style.transform = 'translateX(0px)';
    sliderFill.style.width = '0px';
    sliderText.style.opacity = '1';
    
    safetySlider.classList.remove('success');
  }

  async function executeDispensation() {
    // Lock UI and play success animation
    safetySlider.classList.add('disabled');
    safetySlider.classList.add('success');
    sliderText.textContent = "AUSGABE GESTARTET...";
    sliderText.style.opacity = '1';
    
    // Full slide locks
    sliderHandle.style.transform = `translateX(${maxOffset}px)`;
    sliderFill.style.width = '100%';
    
    addLog(`Führe Ausgabe aus: ${pillAmount}x ${pillNames[selectedCompartment]} aus Fach ${selectedCompartment}...`, 'info');
    
    try {
      const payload = {
        messageType: 3,
        message: {
          compartmentPosition: selectedCompartment,
          amountOfPillsToDispense: pillAmount
        }
      };
      addLog(JSON.stringify(payload), 'tx');
      
      await client.dispense(selectedCompartment, pillAmount);
    } catch (err) {
      addLog(`Ausgabe fehlgeschlagen: ${err.message}`, 'error');
      alert(`Fehler bei der Tablettenausgabe: ${err.message}`);
    } finally {
      // Small cooldown to let the slider show success state, then release
      setTimeout(() => {
        resetSlider();
        if (client.isConnected()) {
          safetySlider.classList.remove('disabled');
          sliderText.textContent = "ZUM AUSGEBEN WISCHEN";
        }
      }, 1500);
    }
  }

  // Register drag listeners
  sliderHandle.addEventListener('mousedown', startDrag);
  sliderHandle.addEventListener('touchstart', startDrag, { passive: true });
});
