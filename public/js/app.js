/* ============================================
   RackMind Client-Side JS
   ============================================ */

(function () {
  'use strict';

  // CSRF helper: adds token header to mutating requests
  function csrfHeaders(extra) {
    var h = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    if (window._csrfToken) h['x-csrf-token'] = window._csrfToken;
    return h;
  }

  // --- Theme Toggle (with system auto-detect) ---
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const savedTheme = localStorage.getItem('rackmind-theme') || getSystemTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateThemeIcons(theme) {
    document.querySelectorAll('.theme-toggle i').forEach((icon) => {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  }

  updateThemeIcons(savedTheme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('rackmind-theme')) {
      const theme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      updateThemeIcons(theme);
    }
  });

  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('rackmind-theme', next);
      updateThemeIcons(next);
    });
  });

  // --- Mobile Sidebar ---
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // --- Fade-Up Scroll Animations ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '-30px' }
  );

  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

  // --- Toast Notifications ---
  function dismissToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }

  document.querySelectorAll('.toast').forEach((toast) => {
    const delay = parseInt(toast.dataset.autoDismiss) || 4000;
    setTimeout(() => dismissToast(toast), delay);
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', () => dismissToast(toast));
  });

  // --- Command Palette ---
  const cmdPalette = document.getElementById('cmdPalette');
  const cmdInput = document.getElementById('cmdPaletteInput');
  const cmdResults = document.getElementById('cmdPaletteResults');
  const cmdTrigger = document.getElementById('cmdPaletteTrigger');

  const defaultActions = cmdResults ? cmdResults.innerHTML : '';

  function openCmdPalette() {
    if (!cmdPalette) return;
    cmdPalette.classList.add('active');
    cmdInput.value = '';
    cmdResults.innerHTML = defaultActions;
    setTimeout(() => cmdInput.focus(), 50);
  }

  function closeCmdPalette() {
    if (!cmdPalette) return;
    cmdPalette.classList.remove('active');
  }

  if (cmdTrigger) cmdTrigger.addEventListener('click', openCmdPalette);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      cmdPalette && cmdPalette.classList.contains('active') ? closeCmdPalette() : openCmdPalette();
    }
    if (e.key === 'Escape' && cmdPalette && cmdPalette.classList.contains('active')) closeCmdPalette();
  });

  if (cmdPalette) cmdPalette.addEventListener('click', (e) => { if (e.target === cmdPalette) closeCmdPalette(); });

  if (cmdInput) {
    let cmdTimeout = null;
    cmdInput.addEventListener('input', () => {
      clearTimeout(cmdTimeout);
      const q = cmdInput.value.trim();
      if (q.length < 2) { cmdResults.innerHTML = defaultActions; return; }
      cmdTimeout = setTimeout(async () => {
        try {
          const res = await fetch('/api/search/global?q=' + encodeURIComponent(q));
          if (!res.ok) return;
          const results = await res.json();
          if (results.length === 0) { cmdResults.innerHTML = '<div class="cmd-palette-label" style="padding:16px 12px;">No results found</div>'; return; }
          cmdResults.innerHTML = '<div class="cmd-palette-section"><div class="cmd-palette-label">Results</div>' +
            results.map(r => `<a href="${r.url}" class="cmd-palette-item"><i class="${r.icon || 'fa-solid fa-box'}"></i><span>${r.name}</span><span class="cmd-type">${r.type}</span></a>`).join('') + '</div>';
        } catch { /* silent */ }
      }, 200);
    });

    cmdInput.addEventListener('keydown', (e) => {
      const items = cmdResults.querySelectorAll('.cmd-palette-item');
      const selected = cmdResults.querySelector('.cmd-palette-item.selected');
      let idx = Array.from(items).indexOf(selected);
      if (e.key === 'ArrowDown') { e.preventDefault(); if (selected) selected.classList.remove('selected'); idx = (idx + 1) % items.length; items[idx]?.classList.add('selected'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (selected) selected.classList.remove('selected'); idx = idx <= 0 ? items.length - 1 : idx - 1; items[idx]?.classList.add('selected'); }
      else if (e.key === 'Enter' && selected) { e.preventDefault(); selected.click(); }
    });
  }

  // --- Delete Confirmations (Modal) ---
  const confirmModal = document.getElementById('confirmModal');
  const confirmForm = document.getElementById('confirmForm');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmCancel = document.getElementById('confirmCancel');

  if (confirmModal && confirmForm && confirmCancel) {
    document.querySelectorAll('.delete-form').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmTitle.textContent = form.dataset.confirmTitle || 'Confirm Delete';
        confirmMessage.innerHTML = form.dataset.confirmMessage || 'Are you sure? This action cannot be undone.';
        confirmForm.action = form.action;
        confirmModal.classList.add('active');
      });
    });
    confirmCancel.addEventListener('click', () => confirmModal.classList.remove('active'));
    confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) confirmModal.classList.remove('active'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && confirmModal.classList.contains('active')) confirmModal.classList.remove('active'); });
  }

  // --- Dynamic Category -> Type Dropdown ---
  const categorySelect = document.getElementById('categorySelect');
  const typeSelect = document.getElementById('typeSelect');

  if (categorySelect && typeSelect) {
    categorySelect.addEventListener('change', async () => {
      const categoryId = categorySelect.value;
      typeSelect.innerHTML = '<option value="">Loading...</option>';
      if (!categoryId) { typeSelect.innerHTML = '<option value="">Select a type</option>'; return; }
      try {
        const res = await fetch(`/api/types-by-category/${categoryId}`);
        const types = await res.json();
        typeSelect.innerHTML = '<option value="">Select a type</option>';
        types.forEach((t) => { const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.name; typeSelect.appendChild(opt); });
      } catch { typeSelect.innerHTML = '<option value="">Error loading types</option>'; }
    });
  }

  // --- Toggle Unique/Quantity fields ---
  const isUniqueCheck = document.getElementById('isUnique');
  const serialField = document.getElementById('serialField');
  const quantityField = document.getElementById('quantityField');

  if (isUniqueCheck) {
    function toggleUniqueFields() {
      if (isUniqueCheck.checked) { if (serialField) serialField.style.display = ''; if (quantityField) quantityField.style.display = 'none'; }
      else { if (serialField) serialField.style.display = 'none'; if (quantityField) quantityField.style.display = ''; }
    }
    isUniqueCheck.addEventListener('change', toggleUniqueFields);
    toggleUniqueFields();
  }

  // --- Dynamic Specs Key-Value ---
  const specsContainer = document.getElementById('specsContainer');
  const addSpecBtn = document.getElementById('addSpecBtn');

  if (addSpecBtn && specsContainer) {
    addSpecBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'specs-row';
      row.innerHTML = `<input type="text" name="spec_key[]" placeholder="Key (e.g. CPU)"><input type="text" name="spec_value[]" placeholder="Value (e.g. i7-12700K)"><button type="button" class="btn-remove-spec" title="Remove"><i class="fa-solid fa-xmark"></i></button>`;
      specsContainer.appendChild(row);
      row.querySelector('.btn-remove-spec').addEventListener('click', () => row.remove());
    });
    specsContainer.querySelectorAll('.btn-remove-spec').forEach((btn) => { btn.addEventListener('click', () => btn.closest('.specs-row').remove()); });
  }

  // --- Icon Picker ---
  const FA_ICONS = [
    'fa-solid fa-server','fa-solid fa-desktop','fa-solid fa-laptop','fa-solid fa-display',
    'fa-solid fa-keyboard','fa-solid fa-computer-mouse','fa-solid fa-hard-drive','fa-solid fa-memory',
    'fa-solid fa-microchip','fa-solid fa-network-wired','fa-solid fa-wifi','fa-solid fa-ethernet',
    'fa-solid fa-shield-halved','fa-solid fa-tower-broadcast','fa-solid fa-database','fa-solid fa-usb',
    'fa-solid fa-plug','fa-solid fa-bolt','fa-solid fa-tv','fa-solid fa-border-all',
    'fa-solid fa-minus','fa-solid fa-battery-half','fa-solid fa-battery-full','fa-solid fa-magnet',
    'fa-solid fa-arrow-right','fa-solid fa-lightbulb','fa-solid fa-toggle-on','fa-solid fa-fire',
    'fa-solid fa-link','fa-solid fa-table-cells','fa-solid fa-eye','fa-solid fa-gear',
    'fa-solid fa-wave-square','fa-solid fa-sliders','fa-solid fa-screwdriver-wrench','fa-solid fa-pen',
    'fa-solid fa-gauge-high','fa-solid fa-chart-line','fa-solid fa-car-battery','fa-solid fa-scissors',
    'fa-solid fa-wrench','fa-solid fa-wind','fa-solid fa-screwdriver','fa-solid fa-grip',
    'fa-solid fa-hand-point-up','fa-solid fa-magnifying-glass','fa-solid fa-square',
    'fa-solid fa-cube','fa-solid fa-circle-notch','fa-solid fa-diamond','fa-solid fa-table',
    'fa-solid fa-rotate','fa-solid fa-temperature-high','fa-solid fa-arrow-down','fa-solid fa-droplet',
    'fa-solid fa-location-dot','fa-solid fa-building','fa-solid fa-warehouse','fa-solid fa-box',
    'fa-solid fa-box-open','fa-solid fa-boxes-stacked','fa-solid fa-drawer',
    'fa-solid fa-folder','fa-solid fa-folder-open','fa-solid fa-tag','fa-solid fa-tags',
    'fa-solid fa-barcode','fa-solid fa-qrcode','fa-solid fa-print','fa-solid fa-camera',
    'fa-solid fa-image','fa-solid fa-file','fa-solid fa-clipboard','fa-solid fa-toolbox',
    'fa-solid fa-hammer','fa-solid fa-flask','fa-solid fa-atom','fa-solid fa-cog',
    'fa-solid fa-cogs','fa-solid fa-tools','fa-solid fa-tape','fa-solid fa-ruler',
    'fa-solid fa-weight-hanging','fa-solid fa-thermometer-half','fa-solid fa-fan',
    'fa-solid fa-solar-panel','fa-solid fa-car','fa-solid fa-bicycle','fa-solid fa-truck',
    'fa-solid fa-globe','fa-solid fa-map-marker-alt','fa-solid fa-home','fa-solid fa-door-open',
    'fa-solid fa-key','fa-solid fa-lock','fa-solid fa-unlock','fa-solid fa-star',
    'fa-solid fa-heart','fa-solid fa-circle','fa-solid fa-check','fa-solid fa-xmark',
    'fa-solid fa-plus','fa-solid fa-trash','fa-solid fa-pencil','fa-solid fa-download',
    'fa-solid fa-upload','fa-solid fa-cloud','fa-solid fa-code','fa-solid fa-terminal',
    'fa-solid fa-bug','fa-solid fa-robot','fa-solid fa-brain','fa-solid fa-music',
    'fa-solid fa-headphones','fa-solid fa-phone','fa-solid fa-mobile','fa-solid fa-tablet',
    'fa-solid fa-clock','fa-solid fa-calendar','fa-solid fa-bell','fa-solid fa-envelope',
    'fa-solid fa-a','fa-solid fa-r','fa-solid fa-t','fa-solid fa-power-off',
    'fa-solid fa-battery-quarter','fa-solid fa-battery-three-quarters',
    'fa-solid fa-signal','fa-solid fa-satellite-dish','fa-solid fa-tower-cell',
    'fa-solid fa-video','fa-solid fa-microphone','fa-solid fa-volume-high',
  ];

  const iconPickerTrigger = document.getElementById('iconPickerTrigger');
  const iconPickerDropdown = document.getElementById('iconPickerDropdown');
  const iconPickerGrid = document.getElementById('iconPickerGrid');
  const iconSearchInput = document.getElementById('iconSearchInput');
  const iconInput = document.getElementById('iconInput');
  const iconPreview = document.getElementById('iconPreview');
  const iconLabel = document.getElementById('iconLabel');

  if (iconPickerTrigger && iconPickerDropdown && iconPickerGrid) {
    function renderIcons(filter) {
      const filtered = filter ? FA_ICONS.filter((ic) => ic.toLowerCase().includes(filter.toLowerCase())) : FA_ICONS;
      iconPickerGrid.innerHTML = '';
      filtered.forEach((ic) => {
        const div = document.createElement('div');
        div.className = 'icon-picker-item' + (iconInput.value === ic ? ' selected' : '');
        div.innerHTML = `<i class="${ic}"></i>`;
        div.title = ic.replace('fa-solid fa-', '');
        div.addEventListener('click', () => {
          iconInput.value = ic; iconPreview.className = ic; iconLabel.textContent = ic;
          iconPickerDropdown.classList.remove('open');
          iconPickerGrid.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
          div.classList.add('selected');
        });
        iconPickerGrid.appendChild(div);
      });
    }

    iconPickerTrigger.addEventListener('click', (e) => {
      e.stopPropagation(); iconPickerDropdown.classList.toggle('open');
      if (iconPickerDropdown.classList.contains('open')) { renderIcons(''); setTimeout(() => iconSearchInput.focus(), 50); }
    });
    if (iconSearchInput) { iconSearchInput.addEventListener('input', () => renderIcons(iconSearchInput.value)); iconSearchInput.addEventListener('click', (e) => e.stopPropagation()); }
    document.addEventListener('click', () => iconPickerDropdown.classList.remove('open'));
    iconPickerDropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  // --- Location Tree Toggle ---
  document.querySelectorAll('.tree-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      const children = toggle.closest('.tree-item').querySelector('.tree-children');
      if (children) children.classList.toggle('collapsed');
    });
  });

  // --- Quantity +/- Buttons ---
  document.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const itemId = btn.dataset.itemId;
      const delta = parseInt(btn.dataset.delta, 10);
      const container = btn.closest('.qty-controls');
      const valueEl = container.querySelector('.qty-value');
      const currentQty = parseInt(valueEl.textContent, 10);
      const newQty = currentQty + delta;
      if (newQty < 0) return;
      try {
        const res = await fetch(`/api/items/${itemId}/quantity`, { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify({ quantity: newQty }) });
        if (res.ok) valueEl.textContent = newQty;
      } catch (err) { console.error('Failed to update quantity:', err); }
    });
  });

  // --- Toggle Threshold Field ---
  const thresholdField = document.getElementById('thresholdField');
  if (thresholdField) {
    const uniqueCheck = document.getElementById('isUnique');
    if (uniqueCheck) {
      function toggleThreshold() { thresholdField.style.display = uniqueCheck.checked ? 'none' : ''; }
      uniqueCheck.addEventListener('change', toggleThreshold);
      toggleThreshold();
    }
  }

  // --- Item Link Search ---
  const itemLinkSearch = document.getElementById('itemLinkSearch');
  const itemLinkResults = document.getElementById('itemLinkResults');
  const linkedItems = document.getElementById('linkedItems');

  if (itemLinkSearch && itemLinkResults && linkedItems) {
    let linkTimeout = null;
    itemLinkSearch.addEventListener('input', () => {
      clearTimeout(linkTimeout);
      const q = itemLinkSearch.value.trim();
      if (q.length < 2) { itemLinkResults.style.display = 'none'; return; }
      linkTimeout = setTimeout(async () => {
        try {
          const res = await fetch('/api/search/global?q=' + encodeURIComponent(q));
          if (!res.ok) { itemLinkResults.style.display = 'none'; return; }
          const results = await res.json();
          const items = results.filter(r => r.type === 'item');
          if (items.length === 0) { itemLinkResults.style.display = 'none'; return; }
          itemLinkResults.innerHTML = items.map(r =>
            `<div class="search-dropdown-item" data-id="${r.id}" data-name="${r.name}" style="cursor:pointer;"><i class="${r.icon || 'fa-solid fa-box'}"></i><span>${r.name}</span></div>`
          ).join('');
          itemLinkResults.style.display = 'block';
          itemLinkResults.querySelectorAll('.search-dropdown-item').forEach(el => {
            el.addEventListener('click', () => {
              const tag = document.createElement('span');
              tag.className = 'tag'; tag.style.cssText = 'background:var(--badge-bg);color:var(--badge-text);';
              tag.innerHTML = `${el.dataset.name}<input type="hidden" name="linked_item_ids[]" value="${el.dataset.id}"><button type="button" style="border:none;background:none;padding:0 0 0 4px;font-size:11px;cursor:pointer;color:inherit;" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;
              linkedItems.appendChild(tag); itemLinkSearch.value = ''; itemLinkResults.style.display = 'none';
            });
          });
        } catch { itemLinkResults.style.display = 'none'; }
      }, 300);
    });
  }

  // --- Saved Filters ---
  const saveFilterBtn = document.getElementById('saveFilterBtn');
  const savedFilterPills = document.getElementById('savedFilterPills');

  if (saveFilterBtn && savedFilterPills) {
    const STORAGE_KEY = 'rackmind-saved-filters';
    function getSavedFilters() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
    function saveSavedFilters(filters) { localStorage.setItem(STORAGE_KEY, JSON.stringify(filters)); }

    function renderSavedFilters() {
      const filters = getSavedFilters();
      savedFilterPills.innerHTML = '';
      filters.forEach((f, i) => {
        const pill = document.createElement('span');
        pill.className = 'filter-pill';
        pill.innerHTML = `<span>${f.name}</span><span class="remove-pill" data-index="${i}"><i class="fa-solid fa-xmark"></i></span>`;
        pill.addEventListener('click', (e) => {
          if (e.target.closest('.remove-pill')) { const updated = getSavedFilters(); updated.splice(parseInt(e.target.closest('.remove-pill').dataset.index, 10), 1); saveSavedFilters(updated); renderSavedFilters(); }
          else { window.location.href = '/items?' + f.query; }
        });
        savedFilterPills.appendChild(pill);
      });
    }

    saveFilterBtn.addEventListener('click', () => {
      const params = new URLSearchParams(window.location.search); params.delete('page');
      const query = params.toString(); if (!query) return;
      const name = prompt('Name for this filter:'); if (!name) return;
      const filters = getSavedFilters(); filters.push({ name, query }); saveSavedFilters(filters); renderSavedFilters();
    });
    renderSavedFilters();
  }

  // --- Drag & Drop for Location Tree ---
  document.querySelectorAll('.tree-item[draggable="true"]').forEach((item) => {
    item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', item.dataset.locationId); item.classList.add('dragging'); });
    item.addEventListener('dragend', () => { item.classList.remove('dragging'); document.querySelectorAll('.tree-item.drag-over').forEach(el => el.classList.remove('drag-over')); });
    item.addEventListener('dragover', (e) => { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => { item.classList.remove('drag-over'); });
    item.addEventListener('drop', async (e) => {
      e.preventDefault(); item.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = item.dataset.locationId;
      if (draggedId === targetId) return;
      try { const res = await fetch(`/api/locations/${draggedId}/move`, { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify({ parent_id: targetId }) }); if (res.ok) location.reload(); }
      catch (err) { console.error('Failed to move location:', err); }
    });
  });

  // --- Bulk Actions (Items table/grid) ---
  const bulkBar = document.getElementById('bulkBar');
  const bulkCount = document.getElementById('bulkCount');
  const selectAllCheck = document.getElementById('selectAll');
  const bulkChecks = document.querySelectorAll('.bulk-check:not(#selectAll)');

  if (bulkBar && bulkChecks.length > 0) {
    function updateBulkBar() {
      const checked = document.querySelectorAll('.bulk-check:checked:not(#selectAll)');
      if (checked.length > 0) { bulkBar.classList.add('active'); bulkCount.textContent = checked.length; }
      else { bulkBar.classList.remove('active'); }
    }
    bulkChecks.forEach(cb => cb.addEventListener('change', updateBulkBar));
    if (selectAllCheck) { selectAllCheck.addEventListener('change', () => { bulkChecks.forEach(cb => { cb.checked = selectAllCheck.checked; }); updateBulkBar(); }); }

    document.querySelectorAll('.bulk-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ids = Array.from(document.querySelectorAll('.bulk-check:checked:not(#selectAll)')).map(cb => cb.value);
        if (ids.length === 0) return;
        try { const res = await fetch('/api/items/bulk-status', { method: 'PATCH', headers: csrfHeaders(), body: JSON.stringify({ ids, status: btn.dataset.status }) }); if (res.ok) location.reload(); }
        catch (err) { console.error('Bulk status update failed:', err); }
      });
    });

    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.addEventListener('click', async () => {
        const ids = Array.from(document.querySelectorAll('.bulk-check:checked:not(#selectAll)')).map(cb => cb.value);
        if (ids.length === 0 || !confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) return;
        try { const res = await fetch('/api/items/bulk-delete', { method: 'POST', headers: csrfHeaders(), body: JSON.stringify({ ids }) }); if (res.ok) location.reload(); }
        catch (err) { console.error('Bulk delete failed:', err); }
      });
    }
  }
})();
