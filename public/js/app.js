/* ============================================
   RackMind Client-Side JS
   ============================================ */

(function () {
  'use strict';

  // --- Theme Toggle ---
  const savedTheme = localStorage.getItem('rackmind-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateThemeIcons(theme) {
    document.querySelectorAll('.theme-toggle i').forEach((icon) => {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  }

  updateThemeIcons(savedTheme);

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

  // --- Flash Message Dismiss ---
  document.querySelectorAll('.alert-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alert = btn.closest('.alert');
      alert.style.opacity = '0';
      alert.style.transform = 'translateY(-10px)';
      setTimeout(() => alert.remove(), 200);
    });
  });

  // --- Delete Confirmations ---
  document.querySelectorAll('.delete-form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Are you sure you want to delete this? This action cannot be undone.')) {
        e.preventDefault();
      }
    });
  });

  // --- Dynamic Category -> Type Dropdown ---
  const categorySelect = document.getElementById('categorySelect');
  const typeSelect = document.getElementById('typeSelect');

  if (categorySelect && typeSelect) {
    categorySelect.addEventListener('change', async () => {
      const categoryId = categorySelect.value;
      typeSelect.innerHTML = '<option value="">Loading...</option>';

      if (!categoryId) {
        typeSelect.innerHTML = '<option value="">Select a type</option>';
        return;
      }

      try {
        const res = await fetch(`/api/types-by-category/${categoryId}`);
        const types = await res.json();
        typeSelect.innerHTML = '<option value="">Select a type</option>';
        types.forEach((t) => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.name;
          typeSelect.appendChild(opt);
        });
      } catch {
        typeSelect.innerHTML = '<option value="">Error loading types</option>';
      }
    });
  }

  // --- Toggle Unique/Quantity fields ---
  const isUniqueCheck = document.getElementById('isUnique');
  const serialField = document.getElementById('serialField');
  const quantityField = document.getElementById('quantityField');

  if (isUniqueCheck) {
    function toggleUniqueFields() {
      if (isUniqueCheck.checked) {
        if (serialField) serialField.style.display = '';
        if (quantityField) quantityField.style.display = 'none';
      } else {
        if (serialField) serialField.style.display = 'none';
        if (quantityField) quantityField.style.display = '';
      }
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
      row.innerHTML = `
        <input type="text" name="spec_key[]" placeholder="Key (e.g. CPU)">
        <input type="text" name="spec_value[]" placeholder="Value (e.g. i7-12700K)">
        <button type="button" class="btn-remove-spec" title="Remove"><i class="fa-solid fa-xmark"></i></button>
      `;
      specsContainer.appendChild(row);

      row.querySelector('.btn-remove-spec').addEventListener('click', () => row.remove());
    });

    // Existing remove buttons
    specsContainer.querySelectorAll('.btn-remove-spec').forEach((btn) => {
      btn.addEventListener('click', () => btn.closest('.specs-row').remove());
    });
  }

  // --- Icon Picker ---
  const FA_ICONS = [
    'fa-solid fa-server', 'fa-solid fa-desktop', 'fa-solid fa-laptop', 'fa-solid fa-display',
    'fa-solid fa-keyboard', 'fa-solid fa-computer-mouse', 'fa-solid fa-hard-drive', 'fa-solid fa-memory',
    'fa-solid fa-microchip', 'fa-solid fa-network-wired', 'fa-solid fa-wifi', 'fa-solid fa-ethernet',
    'fa-solid fa-shield-halved', 'fa-solid fa-tower-broadcast', 'fa-solid fa-database', 'fa-solid fa-usb',
    'fa-solid fa-plug', 'fa-solid fa-bolt', 'fa-solid fa-tv', 'fa-solid fa-border-all',
    'fa-solid fa-minus', 'fa-solid fa-battery-half', 'fa-solid fa-battery-full', 'fa-solid fa-magnet',
    'fa-solid fa-arrow-right', 'fa-solid fa-lightbulb', 'fa-solid fa-toggle-on', 'fa-solid fa-fire',
    'fa-solid fa-link', 'fa-solid fa-table-cells', 'fa-solid fa-eye', 'fa-solid fa-gear',
    'fa-solid fa-wave-square', 'fa-solid fa-sliders', 'fa-solid fa-screwdriver-wrench', 'fa-solid fa-pen',
    'fa-solid fa-gauge-high', 'fa-solid fa-chart-line', 'fa-solid fa-car-battery', 'fa-solid fa-scissors',
    'fa-solid fa-wrench', 'fa-solid fa-wind', 'fa-solid fa-screwdriver', 'fa-solid fa-grip',
    'fa-solid fa-hand-point-up', 'fa-solid fa-magnifying-glass', 'fa-solid fa-square',
    'fa-solid fa-cube', 'fa-solid fa-circle-notch', 'fa-solid fa-diamond', 'fa-solid fa-table',
    'fa-solid fa-rotate', 'fa-solid fa-temperature-high', 'fa-solid fa-arrow-down', 'fa-solid fa-droplet',
    'fa-solid fa-location-dot', 'fa-solid fa-building', 'fa-solid fa-warehouse', 'fa-solid fa-box',
    'fa-solid fa-box-open', 'fa-solid fa-boxes-stacked', 'fa-solid fa-drawer',
    'fa-solid fa-folder', 'fa-solid fa-folder-open', 'fa-solid fa-tag', 'fa-solid fa-tags',
    'fa-solid fa-barcode', 'fa-solid fa-qrcode', 'fa-solid fa-print', 'fa-solid fa-camera',
    'fa-solid fa-image', 'fa-solid fa-file', 'fa-solid fa-clipboard', 'fa-solid fa-toolbox',
    'fa-solid fa-hammer', 'fa-solid fa-flask', 'fa-solid fa-atom', 'fa-solid fa-cog',
    'fa-solid fa-cogs', 'fa-solid fa-tools', 'fa-solid fa-tape', 'fa-solid fa-ruler',
    'fa-solid fa-weight-hanging', 'fa-solid fa-thermometer-half', 'fa-solid fa-fan',
    'fa-solid fa-solar-panel', 'fa-solid fa-car', 'fa-solid fa-bicycle', 'fa-solid fa-truck',
    'fa-solid fa-globe', 'fa-solid fa-map-marker-alt', 'fa-solid fa-home', 'fa-solid fa-door-open',
    'fa-solid fa-key', 'fa-solid fa-lock', 'fa-solid fa-unlock', 'fa-solid fa-star',
    'fa-solid fa-heart', 'fa-solid fa-circle', 'fa-solid fa-check', 'fa-solid fa-xmark',
    'fa-solid fa-plus', 'fa-solid fa-trash', 'fa-solid fa-pencil', 'fa-solid fa-download',
    'fa-solid fa-upload', 'fa-solid fa-cloud', 'fa-solid fa-code', 'fa-solid fa-terminal',
    'fa-solid fa-bug', 'fa-solid fa-robot', 'fa-solid fa-brain', 'fa-solid fa-music',
    'fa-solid fa-headphones', 'fa-solid fa-phone', 'fa-solid fa-mobile', 'fa-solid fa-tablet',
    'fa-solid fa-clock', 'fa-solid fa-calendar', 'fa-solid fa-bell', 'fa-solid fa-envelope',
    'fa-solid fa-a', 'fa-solid fa-r', 'fa-solid fa-t', 'fa-solid fa-power-off',
    'fa-solid fa-battery-quarter', 'fa-solid fa-battery-three-quarters',
    'fa-solid fa-signal', 'fa-solid fa-satellite-dish', 'fa-solid fa-tower-cell',
    'fa-solid fa-video', 'fa-solid fa-microphone', 'fa-solid fa-volume-high',
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
      const filtered = filter
        ? FA_ICONS.filter((ic) => ic.toLowerCase().includes(filter.toLowerCase()))
        : FA_ICONS;

      iconPickerGrid.innerHTML = '';
      filtered.forEach((ic) => {
        const div = document.createElement('div');
        div.className = 'icon-picker-item' + (iconInput.value === ic ? ' selected' : '');
        div.innerHTML = `<i class="${ic}"></i>`;
        div.title = ic.replace('fa-solid fa-', '');
        div.addEventListener('click', () => {
          iconInput.value = ic;
          iconPreview.className = ic;
          iconLabel.textContent = ic;
          iconPickerDropdown.classList.remove('open');
          iconPickerGrid.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
          div.classList.add('selected');
        });
        iconPickerGrid.appendChild(div);
      });
    }

    iconPickerTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      iconPickerDropdown.classList.toggle('open');
      if (iconPickerDropdown.classList.contains('open')) {
        renderIcons('');
        setTimeout(() => iconSearchInput.focus(), 50);
      }
    });

    if (iconSearchInput) {
      iconSearchInput.addEventListener('input', () => renderIcons(iconSearchInput.value));
      iconSearchInput.addEventListener('click', (e) => e.stopPropagation());
    }

    document.addEventListener('click', () => {
      iconPickerDropdown.classList.remove('open');
    });

    iconPickerDropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  // --- Location Tree Toggle ---
  document.querySelectorAll('.tree-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      const children = toggle.closest('.tree-item').querySelector('.tree-children');
      if (children) {
        children.classList.toggle('collapsed');
      }
    });
  });
})();
