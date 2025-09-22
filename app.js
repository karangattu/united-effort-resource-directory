let resources = [];
let filteredResources = [];
const categoryLabels = {};
let hasSubgroups = false;

const categoryColors = {
  benefits: '#6366f1',
  housing: '#10b981',
  employment: '#f59e0b',
  veterans: '#ef4444',
  'personal-docs': '#8b5cf6',
  services: '#06b6d4'
};

function capitalizeCategory(key) {
  if (categoryLabels[key]) return categoryLabels[key];
  if (!key) return '';
  return key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ');
}

function flattenResources(data) {
  const arr = [];
  (data.categories || []).forEach(cat => {
    categoryLabels[cat.key] = cat.label || capitalizeCategory(cat.key);

    (cat.items || []).forEach(item => {
      arr.push({ ...item, category: cat.key });
    });

    if (Array.isArray(cat.groups)) {
      hasSubgroups = true;
      cat.groups.forEach(group => {
        (group.items || []).forEach(item => {
          arr.push({ ...item, category: cat.key, group: group.label });
        });
      });
    }
  });
  return arr;
}

function renderFilters(data) {
  const filtersEl = document.getElementById('filters');
  filtersEl
    .querySelectorAll('.filter-btn[data-category]:not([data-category="all"])')
    .forEach(el => el.remove());

  (data.categories || []).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat.key;
    btn.textContent = cat.label || capitalizeCategory(cat.key);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterResources();
    });
    filtersEl.appendChild(btn);
  });
}

function renderResources() {
  const grid = document.getElementById('resourcesGrid');
  const noResults = document.getElementById('noResults');

  if (filteredResources.length === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'block';
    document.getElementById('filteredCount').textContent = '0';
    return;
  }

  grid.style.display = 'grid';
  noResults.style.display = 'none';

  const activeBtn = document.querySelector('.filter-btn.active');
  const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';
  const groupMode = document.getElementById('groupBy').value;

  if (groupMode === 'subgroup' && activeCategory !== 'all') {
    const groups = new Map();
    filteredResources.forEach(r => {
      const key = r.group || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    const parts = [];
    groups.forEach((items, label) => {
      parts.push(`<div class="group-header">${label}</div>`);
      parts.push(items.map(resource => renderCard(resource)).join(''));
    });
    grid.innerHTML = parts.join('');
  } else {
    grid.innerHTML = filteredResources.map(resource => renderCard(resource)).join('');
  }

  document.getElementById('filteredCount').textContent = String(filteredResources.length);
}

function renderCard(resource) {
  const catColor = categoryColors[resource.category] || getComputedStyle(document.documentElement).getPropertyValue('--brand-primary');
  const diffClass = `difficulty-${(resource.difficulty || '').toLowerCase()}`;
  return `
    <div class="resource-card" style="border-left-color:${catColor}">
      <div class="resource-category" style="background:${catColor}">${capitalizeCategory(resource.category)}</div>
      <h3 class="resource-title">${resource.title}</h3>
      <p class="resource-description">${resource.description}</p>
      <div class="resource-details">
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>Provider: ${resource.provider}</span>
        </div>
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span>Difficulty: <span class="badge ${diffClass}">${resource.difficulty}</span></span>
        </div>
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h10v14z"/></svg>
          <span>Who can help: ${resource.canDo}</span>
        </div>
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span>Location: <span class="chip">${resource.location}</span></span>
        </div>
      </div>
    </div>`;
}

function filterResources() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
  const activeBtn = document.querySelector('.filter-btn.active');
  const activeCategory = activeBtn ? activeBtn.dataset.category : 'all';

  filteredResources = resources.filter(resource => {
    const matchesSearch =
      !searchTerm ||
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm) ||
      resource.provider.toLowerCase().includes(searchTerm);

    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  sortFiltered();
  renderResources();
}

function sortFiltered() {
  const by = document.getElementById('sortBy').value;
  const order = document.getElementById('sortOrder').value;
  const dir = order === 'desc' ? -1 : 1;

  const diffRank = { low: 1, medium: 2, high: 3 };
  filteredResources.sort((a, b) => {
    let av, bv;
    switch (by) {
      case 'difficulty':
        av = diffRank[(a.difficulty || '').toLowerCase()] || 999;
        bv = diffRank[(b.difficulty || '').toLowerCase()] || 999;
        break;
      case 'provider':
        av = (a.provider || '').toLowerCase();
        bv = (b.provider || '').toLowerCase();
        break;
      case 'title':
      default:
        av = (a.title || '').toLowerCase();
        bv = (b.title || '').toLowerCase();
    }
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
}

function showSchemaIssues(issues) {
  const box = document.getElementById('schemaErrors');
  if (!issues || issues.length === 0) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  box.style.display = 'block';
  box.innerHTML = `<h4>Data issues detected:</h4><ul>` + issues.map(i => `<li>${i}</li>`).join('') + `</ul>`;
}

function validateData(data) {
  const issues = [];
  if (!data || !Array.isArray(data.categories)) {
    issues.push('Missing "categories" array.');
    return { issues };
  }
  data.categories.forEach((cat, ci) => {
    if (!cat || typeof cat.key !== 'string') issues.push(`Category[${ci}] is missing a string "key".`);
    if (!cat || typeof cat.label !== 'string') issues.push(`Category[${ci}] is missing a string "label".`);
    const hasItems = Array.isArray(cat.items) && cat.items.length > 0;
    const hasGroups = Array.isArray(cat.groups) && cat.groups.length > 0;
    if (!hasItems && !hasGroups) issues.push(`Category "${cat.label || cat.key || ci}" has no items or groups.`);

    const checkItem = (item, ii, where) => {
      if (!item || typeof item.title !== 'string') issues.push(`${where}[${ii}] missing string "title".`);
      if (!item || typeof item.description !== 'string') issues.push(`${where}[${ii}] missing string "description".`);
      if (!item || typeof item.provider !== 'string') issues.push(`${where}[${ii}] missing string "provider".`);
      if (!item || typeof item.difficulty !== 'string') issues.push(`${where}[${ii}] missing string "difficulty".`);
      const d = (item.difficulty || '').toLowerCase();
      if (d && !['low', 'medium', 'high'].includes(d)) issues.push(`${where}[${ii}] difficulty should be low|medium|high.`);
    };

    (cat.items || []).forEach((it, ii) => checkItem(it, ii, `Category ${cat.key} item`));
    (cat.groups || []).forEach((grp, gi) => {
      if (!grp || typeof grp.label !== 'string') issues.push(`Category ${cat.key} group[${gi}] missing string "label".`);
      (grp && grp.items || []).forEach((it, ii) => checkItem(it, ii, `Category ${cat.key} group ${grp.label} item`));
    });
  });
  return { issues };
}

function showLoadingSkeleton(count = 6) {
  const grid = document.getElementById('resourcesGrid');
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push(`
      <div class="skeleton-card">
        <div class="skeleton sk-chip"></div>
        <div class="skeleton sk-title"></div>
        <div class="skeleton sk-text"></div>
        <div class="skeleton sk-text" style="width:80%"></div>
        <div class="sk-line">
          <div class="skeleton sk-pill"></div>
          <div class="skeleton sk-pill" style="width:100px"></div>
        </div>
      </div>`);
  }
  grid.innerHTML = cards.join('');
  grid.style.display = 'grid';
}

async function loadResources() {
  const noResults = document.getElementById('noResults');
  try {
    showLoadingSkeleton(6);
    const res = await fetch('resources.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch resources.json: ${res.status}`);
    const data = await res.json();

    // Validate and report
    const { issues } = validateData(data);
    showSchemaIssues(issues);

    renderFilters(data);
    resources = flattenResources(data);
    filteredResources = [...resources];
    document.getElementById('totalResources').textContent = String(resources.length);

    const groupWrap = document.getElementById('groupByWrapper');
    if (hasSubgroups) {
      groupWrap.style.display = '';
    } else {
      groupWrap.style.display = 'none';
    }

    sortFiltered();
    renderResources();
  } catch (err) {
    console.error(err);
    noResults.style.display = 'block';
    noResults.textContent = 'Failed to load resources. If running locally, start a local server (see README) and reload.';
    document.getElementById('filteredCount').textContent = '0';
    document.getElementById('totalResources').textContent = '0';
    showSchemaIssues([String(err.message || err)]);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', filterResources);
  document.querySelector('.filter-btn[data-category="all"]').addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    filterResources();
  });
  document.getElementById('sortBy').addEventListener('change', () => { sortFiltered(); renderResources(); });
  document.getElementById('sortOrder').addEventListener('change', () => { sortFiltered(); renderResources(); });
  document.getElementById('groupBy').addEventListener('change', () => renderResources());

  function applyTheme(theme) {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('theme-dark');
      document.getElementById('themeToggle').textContent = '☀️';
    } else {
      body.classList.remove('theme-dark');
      document.getElementById('themeToggle').textContent = '🌙';
    }
  }
  function initTheme() {
    const saved = localStorage.getItem('ued-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }
  document.getElementById('themeToggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('theme-dark');
    localStorage.setItem('ued-theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
  });

  // Boot
  initTheme();
  loadResources();
});
