let resources = [];
let filteredResources = [];
const categoryLabels = {};
let hasSubgroups = false;
let rawData = null; // keep original data for label lookups

// i18n
const i18n = {
  en: {
    title: 'The United Effort Resource Directory',
    subtitle: 'Find the support services you need',
    totalResources: 'Total Resources',
    currentlyShowing: 'Currently Showing',
    searchPlaceholder: 'Search for benefits, housing, employment, or other services...',
    allServices: 'All Services',
    sortBy: 'Sort by:',
    order: 'Order:',
    group: 'Group:',
    sortOptions: { title: 'Title', difficulty: 'Difficulty', provider: 'Provider' },
    orderOptions: { asc: 'Ascending', desc: 'Descending' },
    groupOptions: { none: 'None', subgroup: 'Subgroup' },
    labels: { provider: 'Provider', difficulty: 'Difficulty', who: 'Who can help', location: 'Location' },
    noResults: 'No resources found matching your search criteria.',
    dataIssues: 'Data issues detected:',
    common: { otherGroup: 'Other' }
  },
  es: {
    title: 'Directorio de Recursos de United Effort',
    subtitle: 'Encuentra los servicios de apoyo que necesitas',
    totalResources: 'Recursos Totales',
    currentlyShowing: 'Mostrando',
    searchPlaceholder: 'Busca beneficios, vivienda, empleo u otros servicios...',
    allServices: 'Todos los Servicios',
    sortBy: 'Ordenar por:',
    order: 'Orden:',
    group: 'Agrupar:',
    sortOptions: { title: 'Título', difficulty: 'Dificultad', provider: 'Proveedor' },
    orderOptions: { asc: 'Ascendente', desc: 'Descendente' },
    groupOptions: { none: 'Ninguno', subgroup: 'Subgrupo' },
    labels: { provider: 'Proveedor', difficulty: 'Dificultad', who: 'Quién puede ayudar', location: 'Ubicación' },
    noResults: 'No se encontraron recursos que coincidan con tu búsqueda.',
    dataIssues: 'Problemas de datos detectados:',
    common: { otherGroup: 'Otros' }
  },
  zh: {
    title: '联合努力资源目录',
    subtitle: '查找您需要的支持服务',
    totalResources: '资源总数',
    currentlyShowing: '当前显示',
    searchPlaceholder: '搜索福利、住房、就业或其他服务……',
    allServices: '所有服务',
    sortBy: '排序方式：',
    order: '顺序：',
    group: '分组：',
    sortOptions: { title: '标题', difficulty: '难度', provider: '提供方' },
    orderOptions: { asc: '升序', desc: '降序' },
    groupOptions: { none: '无', subgroup: '子组' },
    labels: { provider: '提供方', difficulty: '难度', who: '可协助人员', location: '地点' },
    noResults: '未找到与搜索条件匹配的资源。',
    dataIssues: '检测到数据问题：',
    common: { otherGroup: '其他' }
  }
};
let currentLang = localStorage.getItem('ued-lang') || 'en';

function t(path) {
  const parts = path.split('.');
  let obj = i18n[currentLang] || i18n.en;
  for (const p of parts) obj = obj?.[p];
  return obj ?? path;
}

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
          // use groupKey as canonical id (default to the base label)
          const groupKey = group.label || '';
          arr.push({ ...item, category: cat.key, groupKey });
        });
      });
    }
  });
  return arr;
}

function getCategoryLabelFromObj(cat) {
  if (!cat) return '';
  const loc = cat[`label_${currentLang}`];
  return loc || cat.label || capitalizeCategory(cat.key || '');
}

function getCategoryLabel(catKey) {
  if (!rawData) return capitalizeCategory(catKey);
  const cat = (rawData.categories || []).find(c => c.key === catKey);
  return getCategoryLabelFromObj(cat) || capitalizeCategory(catKey);
}

function getItemField(item, field) {
  if (!item) return '';
  const locKey = `${field}_${currentLang}`;
  return (item[locKey] ?? item[field] ?? '').toString();
}

function getGroupLabel(catKey, groupKey) {
  if (!groupKey) return t('common.otherGroup');
  const cat = rawData?.categories?.find(c => c.key === catKey);
  const grp = cat?.groups?.find(g => g.label === groupKey || g[`label_${currentLang}`] === groupKey);
  if (!grp) return groupKey;
  return grp[`label_${currentLang}`] || grp.label || groupKey;
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
    btn.textContent = getCategoryLabelFromObj(cat);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterResources();
    });
    filtersEl.appendChild(btn);
  });

  // Set the "All Services" button label
  const allBtn = document.getElementById('filterAllBtn');
  if (allBtn) allBtn.textContent = t('allServices');
}

function renderResources() {
  const grid = document.getElementById('resourcesGrid');
  const noResults = document.getElementById('noResults');

  if (filteredResources.length === 0) {
    grid.style.display = 'none';
    noResults.style.display = 'block';
    document.getElementById('filteredCount').textContent = '0';
    noResults.textContent = t('noResults');
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
      const key = r.groupKey || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    const parts = [];
    groups.forEach((items, key) => {
      const header = key === 'Other' ? t('common.otherGroup') : getGroupLabel(activeCategory, key);
      parts.push(`<div class="group-header">${header}</div>`);
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
      <div class="resource-category" style="background:${catColor}">${getCategoryLabel(resource.category)}</div>
      <h3 class="resource-title">${getItemField(resource, 'title')}</h3>
      <p class="resource-description">${getItemField(resource, 'description')}</p>
      <div class="resource-details">
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span>${t('labels.provider')}: ${getItemField(resource, 'provider')}</span>
        </div>
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span>${t('labels.difficulty')}: <span class="badge ${diffClass}">${resource.difficulty}</span></span>
        </div>
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h10v14z"/></svg>
          <span>${t('labels.who')}: ${getItemField(resource, 'canDo')}</span>
        </div>
        <div class="detail-item">
          <svg class="detail-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span>${t('labels.location')}: <span class="chip">${getItemField(resource, 'location')}</span></span>
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
      getItemField(resource, 'title').toLowerCase().includes(searchTerm) ||
      getItemField(resource, 'description').toLowerCase().includes(searchTerm) ||
      getItemField(resource, 'provider').toLowerCase().includes(searchTerm);

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
        av = getItemField(a, 'provider').toLowerCase();
        bv = getItemField(b, 'provider').toLowerCase();
        break;
      case 'title':
      default:
        av = getItemField(a, 'title').toLowerCase();
        bv = getItemField(b, 'title').toLowerCase();
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
  box.innerHTML = `<h4>${t('dataIssues')}</h4><ul>` + issues.map(i => `<li>${i}</li>`).join('') + `</ul>`;
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
  rawData = data; // keep original for future lookups

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
  // Apply i18n to static UI elements
  function applyStaticTranslations() {
    const titleEl = document.getElementById('titleText');
    const subEl = document.getElementById('subtitleText');
    const totalLabel = document.getElementById('totalResourcesLabel');
    const showingLabel = document.getElementById('currentlyShowingLabel');
    const searchInput = document.getElementById('searchInput');
    const sortByLabel = document.getElementById('sortByLabel');
    const orderLabel = document.getElementById('orderLabel');
    const groupLabel = document.getElementById('groupLabel');
    const sortBy = document.getElementById('sortBy');
    const sortOrder = document.getElementById('sortOrder');
    const groupBy = document.getElementById('groupBy');

    if (titleEl) titleEl.textContent = t('title');
    if (subEl) subEl.textContent = t('subtitle');
    if (totalLabel) totalLabel.textContent = t('totalResources');
    if (showingLabel) showingLabel.textContent = t('currentlyShowing');
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');
    if (sortByLabel) sortByLabel.childNodes[0].nodeValue = t('sortBy') + ' ';
    if (orderLabel) orderLabel.childNodes[0].nodeValue = t('order') + ' ';
    if (groupLabel) groupLabel.textContent = t('group');
    if (sortBy) {
      sortBy.options[0].text = t('sortOptions.title');
      sortBy.options[1].text = t('sortOptions.difficulty');
      sortBy.options[2].text = t('sortOptions.provider');
    }
    if (sortOrder) {
      sortOrder.options[0].text = t('orderOptions.asc');
      sortOrder.options[1].text = t('orderOptions.desc');
    }
    if (groupBy) {
      groupBy.options[0].text = t('groupOptions.none');
      groupBy.options[1].text = t('groupOptions.subgroup');
    }
  }

  document.getElementById('searchInput').addEventListener('input', filterResources);
  document.querySelector('.filter-btn[data-category="all"]').addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    filterResources();
  });
  document.getElementById('sortBy').addEventListener('change', () => { sortFiltered(); renderResources(); });
  document.getElementById('sortOrder').addEventListener('change', () => { sortFiltered(); renderResources(); });
  document.getElementById('groupBy').addEventListener('change', () => renderResources());

  // Language switch
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', () => {
      currentLang = langSelect.value;
      localStorage.setItem('ued-lang', currentLang);
      applyStaticTranslations();
      // Re-render filters to update category labels, keep active category
      const activeCat = document.querySelector('.filter-btn.active')?.dataset.category || 'all';
      if (rawData) {
        renderFilters(rawData);
        // restore active
        const toActivate = document.querySelector(`.filter-btn[data-category="${activeCat}"]`) || document.getElementById('filterAllBtn');
        if (toActivate) {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          toActivate.classList.add('active');
        }
      }
      // Re-filter and render cards for translated fields
      filterResources();
    });
  }

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
  applyStaticTranslations();
  loadResources();
});
