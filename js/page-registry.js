(function(){
  if(!document.querySelector('[data-page="registry"]')) return;
  const { icon, toast, emptyState, statusBadge, attachKebab, debounce } = window.KP.ui;
  const data = window.KP.data;

  const SORT_LABEL = {createdAt:'Дата створення', updatedAt:'Остання зміна', status:'Статус', article:'Стаття', author:'Автор', suspect:'Підозрюваний'};

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    status: params.get('status') || 'all',
    article: '',
    author: '',
    suspect: '',
    responsible: '',
    dateFrom: '',
    dateTo: '',
    sortKey: 'createdAt',
    sortDir: 'desc',
    page: 1,
    pageSize: 10
  };

  let root;

  function filteredSorted(){
    const q = state.q.trim().toLowerCase();
    let rows = data.getCases().slice();
    if(state.status !== 'all') rows = rows.filter(c => c.status === state.status);
    if(q) rows = rows.filter(c => `${c.id} ${c.author} ${c.suspect} ${c.article} ${c.shortDescription} ${c.responsible||''}`.toLowerCase().includes(q));
    if(state.article.trim()) rows = rows.filter(c => c.article.toLowerCase().includes(state.article.trim().toLowerCase()));
    if(state.author.trim()) rows = rows.filter(c => c.author.toLowerCase().includes(state.author.trim().toLowerCase()));
    if(state.suspect.trim()) rows = rows.filter(c => c.suspect.toLowerCase().includes(state.suspect.trim().toLowerCase()));
    if(state.responsible.trim()) rows = rows.filter(c => (c.responsible||'').toLowerCase().includes(state.responsible.trim().toLowerCase()));
    if(state.dateFrom) rows = rows.filter(c => new Date(c.createdAt) >= new Date(state.dateFrom));
    if(state.dateTo) rows = rows.filter(c => new Date(c.createdAt) <= new Date(state.dateTo + 'T23:59:59'));

    rows.sort((a,b) => {
      let av = a[state.sortKey], bv = b[state.sortKey];
      if(state.sortKey === 'createdAt' || state.sortKey === 'updatedAt'){ av = new Date(av||0).getTime(); bv = new Date(bv||0).getTime(); }
      else { av = (av||'').toString().toLowerCase(); bv = (bv||'').toString().toLowerCase(); }
      if(av < bv) return state.sortDir === 'asc' ? -1 : 1;
      if(av > bv) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function activeFilterChips(){
    const chips = [];
    if(state.status !== 'all') chips.push({key:'status', label:`Статус: ${data.STATUS_LABEL[state.status]}`});
    if(state.article) chips.push({key:'article', label:`Стаття: ${state.article}`});
    if(state.author) chips.push({key:'author', label:`Автор: ${state.author}`});
    if(state.suspect) chips.push({key:'suspect', label:`Підозрюваний: ${state.suspect}`});
    if(state.responsible) chips.push({key:'responsible', label:`Відповідальний: ${state.responsible}`});
    if(state.dateFrom || state.dateTo) chips.push({key:'date', label:`Період: ${state.dateFrom||'…'} — ${state.dateTo||'…'}`});
    return chips;
  }

  function render(){
    const all = filteredSorted();
    const totalPages = Math.max(1, Math.ceil(all.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const pageRows = all.slice((state.page-1)*state.pageSize, state.page*state.pageSize);

    root.innerHTML = `
      <div class="flex-between" style="flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:22px">Пошук КП</h1>
          <p style="color:var(--muted);margin-top:4px">Єдиний реєстр і пошук по всіх справах — фільтруй, сортуй і відкривай для роботи.</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="open-create-case">${icon.create}<span>Створити КП</span></button>
      </div>

      <div class="card card-pad" style="display:grid;gap:12px">
        <div class="toolbar">
          <div class="toolbar-search">${icon.search}<input type="text" id="fQuery" placeholder="Пошук за ID, автором, підозрюваним, статтею, описом..." value="${data.escapeHtml(state.q)}"></div>
          <select id="fStatus">
            <option value="all">Усі статуси</option>
            ${data.STATUS_ORDER.map(s => `<option value="${s}" ${state.status===s?'selected':''}>${data.STATUS_LABEL[s]}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" id="btnReset" type="button">Скинути фільтри</button>
        </div>
        <div class="filters-row">
          <input type="text" id="fArticle" placeholder="Стаття ККУ" value="${data.escapeHtml(state.article)}">
          <input type="text" id="fAuthor" placeholder="Автор" value="${data.escapeHtml(state.author)}">
          <input type="text" id="fSuspect" placeholder="Підозрюваний" value="${data.escapeHtml(state.suspect)}">
          <input type="text" id="fResponsible" placeholder="Відповідальний" value="${data.escapeHtml(state.responsible)}">
          <input type="date" id="fDateFrom" value="${state.dateFrom}" aria-label="Дата від">
          <input type="date" id="fDateTo" value="${state.dateTo}" aria-label="Дата до">
        </div>
        <div class="chips-row" id="filterChips"></div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Список справ</h2><span class="card-head-sub" id="resultCount"></span></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th class="checkbox-cell"><input type="checkbox" class="row-checkbox" id="checkAll" aria-label="Вибрати всі"></th>
              <th class="sortable" data-key="createdAt">ID <span class="sort-arrow">↕</span></th>
              <th class="sortable" data-key="suspect">Підозрюваний <span class="sort-arrow">↕</span></th>
              <th class="sortable" data-key="article">Стаття ККУ <span class="sort-arrow">↕</span></th>
              <th class="sortable" data-key="author">Автор <span class="sort-arrow">↕</span></th>
              <th>Відповідальний</th>
              <th class="sortable" data-key="createdAt">Створено <span class="sort-arrow">↕</span></th>
              <th class="sortable" data-key="updatedAt">Змінено <span class="sort-arrow">↕</span></th>
              <th class="sortable" data-key="status">Статус <span class="sort-arrow">↕</span></th>
              <th></th>
            </tr></thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
        <div class="case-cards" id="cardList"></div>
        <div class="pagination-bar">
          <div class="pagination-info" id="pageInfo"></div>
          <div class="pagination-controls" id="pageControls"></div>
          <select class="page-size-select" id="pageSizeSelect">
            <option value="10">10 / стор.</option>
            <option value="25">25 / стор.</option>
            <option value="50">50 / стор.</option>
          </select>
        </div>
      </div>`;

    root.querySelector('#pageSizeSelect').value = String(state.pageSize);
    document.querySelectorAll('.sortable').forEach(th => {
      if(th.dataset.key === state.sortKey) th.classList.add('is-sorted');
    });

    const tbody = root.querySelector('#tableBody');
    const cardList = root.querySelector('#cardList');
    if(!pageRows.length){
      const isFiltered = q_active();
      tbody.innerHTML = `<tr><td colspan="10"><div class="state-block">${icon.empty}<h3>${isFiltered ? 'За вибраними параметрами нічого не знайдено' : 'Справ у системі поки немає'}</h3><p>${isFiltered ? '' : 'Зареєструй перше кримінальне провадження.'}</p><button class="btn btn-primary btn-sm" id="emptyAction">${isFiltered ? 'Скинути фільтри' : 'Створити перше КП'}</button></div></td></tr>`;
      cardList.innerHTML = '';
      root.querySelector('#emptyAction').addEventListener('click', () => {
        if(isFiltered) resetFilters(); else document.dispatchEvent(new CustomEvent('app:open-create-case'));
      });
    } else {
      tbody.innerHTML = pageRows.map(rowHtml).join('');
      cardList.innerHTML = pageRows.map(cardHtml).join('');
    }

    root.querySelector('#resultCount').textContent = `${all.length} записів`;
    root.querySelector('#pageInfo').textContent = all.length ? `${(state.page-1)*state.pageSize+1}–${Math.min(state.page*state.pageSize, all.length)} з ${all.length}` : '0 з 0';
    renderPagination(totalPages);
    renderChips();
    bindEvents();
  }

  function q_active(){
    return !!(state.q || state.status !== 'all' || state.article || state.author || state.responsible || state.dateFrom || state.dateTo);
  }

  function rowHtml(c){
    return `<tr data-row-id="${c.rowId}">
      <td class="checkbox-cell" onclick="event.stopPropagation()"><input type="checkbox" class="row-checkbox"></td>
      <td class="mono">${c.id}</td>
      <td class="td-title">${data.escapeHtml(c.suspect)}</td>
      <td>${data.escapeHtml(c.article)}</td>
      <td>${data.escapeHtml(c.author)}</td>
      <td>${data.escapeHtml(c.responsible || '—')}</td>
      <td>${data.formatDate(c.createdAt)}</td>
      <td>${data.formatDate(c.updatedAt)}</td>
      <td>${statusBadge(c.status)}</td>
      <td onclick="event.stopPropagation()">
        <div class="kebab-wrap">
          <button class="kebab-btn" type="button" data-kebab-trigger aria-label="Дії" aria-haspopup="true">${icon.dots}</button>
          <div class="kebab-menu">
            <button data-open="${c.rowId}">${icon.open}Відкрити картку</button>
            <button data-copy="${c.id}">${icon.copy}Копіювати ID</button>
          </div>
        </div>
      </td>
    </tr>`;
  }

  function cardHtml(c){
    return `<article class="case-card" data-row-id="${c.rowId}">
      <div class="case-card-top"><span class="case-card-id">${c.id}</span>${statusBadge(c.status)}</div>
      <div class="case-card-title">${data.escapeHtml(c.article)}</div>
      <div class="case-card-meta">${data.escapeHtml(c.author)} → ${data.escapeHtml(c.suspect)}</div>
    </article>`;
  }

  function renderPagination(totalPages){
    const wrap = root.querySelector('#pageControls');
    let html = `<button class="page-btn" data-page="${state.page-1}" ${state.page<=1?'disabled':''} aria-label="Попередня сторінка">‹</button>`;
    for(let p=1;p<=totalPages;p++){
      if(p===1 || p===totalPages || Math.abs(p-state.page)<=1){
        html += `<button class="page-btn ${p===state.page?'is-active':''}" data-page="${p}">${p}</button>`;
      } else if(Math.abs(p-state.page)===2){
        html += `<span style="color:var(--muted-dim);padding:0 4px">…</span>`;
      }
    }
    html += `<button class="page-btn" data-page="${state.page+1}" ${state.page>=totalPages?'disabled':''} aria-label="Наступна сторінка">›</button>`;
    wrap.innerHTML = html;
    wrap.querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => { state.page = Number(btn.dataset.page); render(); }));
  }

  function renderChips(){
    const wrap = root.querySelector('#filterChips');
    const chips = activeFilterChips();
    wrap.innerHTML = chips.map(c => `<span class="chip is-active">${data.escapeHtml(c.label)}<button class="chip-remove" data-remove-chip="${c.key}">${icon.x}</button></span>`).join('');
    wrap.querySelectorAll('[data-remove-chip]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.removeChip;
      if(key === 'date'){ state.dateFrom=''; state.dateTo=''; }
      else if(key === 'status') state.status = 'all';
      else state[key] = '';
      state.page = 1; render();
    }));
  }

  function resetFilters(){
    Object.assign(state, {q:'', status:'all', article:'', author:'', suspect:'', responsible:'', dateFrom:'', dateTo:'', page:1});
    render();
  }

  function bindEvents(){
    root.querySelector('#fQuery').addEventListener('input', debounce(e => { state.q = e.target.value; state.page=1; render(); }, 300));
    root.querySelector('#fStatus').addEventListener('change', e => { state.status = e.target.value; state.page=1; render(); });
    root.querySelector('#fArticle').addEventListener('input', debounce(e => { state.article = e.target.value; state.page=1; render(); }, 300));
    root.querySelector('#fAuthor').addEventListener('input', debounce(e => { state.author = e.target.value; state.page=1; render(); }, 300));
    root.querySelector('#fSuspect').addEventListener('input', debounce(e => { state.suspect = e.target.value; state.page=1; render(); }, 300));
    root.querySelector('#fResponsible').addEventListener('input', debounce(e => { state.responsible = e.target.value; state.page=1; render(); }, 300));
    root.querySelector('#fDateFrom').addEventListener('change', e => { state.dateFrom = e.target.value; state.page=1; render(); });
    root.querySelector('#fDateTo').addEventListener('change', e => { state.dateTo = e.target.value; state.page=1; render(); });
    root.querySelector('#btnReset').addEventListener('click', resetFilters);
    root.querySelector('#pageSizeSelect').addEventListener('change', e => { state.pageSize = Number(e.target.value); state.page=1; render(); });

    root.querySelectorAll('.sortable').forEach(th => th.addEventListener('click', () => {
      if(state.sortKey === th.dataset.key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = th.dataset.key; state.sortDir = 'desc'; }
      render();
    }));

    root.querySelectorAll('tr[data-row-id], .case-card[data-row-id]').forEach(row => {
      row.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:open-case', {detail:{rowId:Number(row.dataset.rowId)}})));
    });
    root.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:open-case', {detail:{rowId:Number(btn.dataset.open)}}))));
    root.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
      try{ await navigator.clipboard.writeText(btn.dataset.copy); toast('ID скопійовано', 'success'); }catch(e){}
    }));
    attachKebab(root);
  }

  function start(){
    root = document.getElementById('contentInner');
    data.onDataChange(render);
    render();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
