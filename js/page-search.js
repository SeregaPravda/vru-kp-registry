(function(){
  if(!document.querySelector('[data-page="search"]')) return;
  const { icon, toast, statusBadge, debounce } = window.KP.ui;
  const data = window.KP.data;
  let root;
  const params = new URLSearchParams(location.search);

  const state = {
    q: params.get('q') || '', status:'all', article:'', author:'', suspect:'', responsible:'',
    createdFrom:'', createdTo:''
  };

  function activeChips(){
    const chips = [];
    if(state.status !== 'all') chips.push({key:'status', label:`Статус: ${data.STATUS_LABEL[state.status]}`});
    if(state.article) chips.push({key:'article', label:`Стаття: ${state.article}`});
    if(state.author) chips.push({key:'author', label:`Автор: ${state.author}`});
    if(state.suspect) chips.push({key:'suspect', label:`Підозрюваний: ${state.suspect}`});
    if(state.responsible) chips.push({key:'responsible', label:`Відповідальний: ${state.responsible}`});
    if(state.createdFrom || state.createdTo) chips.push({key:'created', label:`Створено: ${state.createdFrom||'…'} — ${state.createdTo||'…'}`});
    return chips;
  }

  function results(){
    const q = state.q.trim().toLowerCase();
    return data.getCases().filter(c => {
      if(q && !`${c.id} ${c.author} ${c.suspect} ${c.article} ${c.shortDescription} ${c.responsible||''}`.toLowerCase().includes(q)) return false;
      if(state.status !== 'all' && c.status !== state.status) return false;
      if(state.article && !c.article.toLowerCase().includes(state.article.toLowerCase())) return false;
      if(state.author && !c.author.toLowerCase().includes(state.author.toLowerCase())) return false;
      if(state.suspect && !c.suspect.toLowerCase().includes(state.suspect.toLowerCase())) return false;
      if(state.responsible && !(c.responsible||'').toLowerCase().includes(state.responsible.toLowerCase())) return false;
      if(state.createdFrom && new Date(c.createdAt) < new Date(state.createdFrom)) return false;
      if(state.createdTo && new Date(c.createdAt) > new Date(state.createdTo + 'T23:59:59')) return false;
      return true;
    });
  }

  function render(){
    const rows = results();
    root.innerHTML = `
      <div><h1 style="font-size:22px">Розширений пошук</h1><p style="color:var(--muted);margin-top:4px">Пошук по всій базі — включно з архівними справами.</p></div>
      <div class="card card-pad" style="display:grid;gap:12px">
        <div class="toolbar">
          <div class="toolbar-search">${icon.search}<input type="text" id="sQuery" placeholder="КП-2026-0001, ім'я, стаття, опис..." value="${data.escapeHtml(state.q)}"></div>
          <select id="sStatus">
            <option value="all">Усі статуси</option>
            ${data.STATUS_ORDER.map(s => `<option value="${s}" ${state.status===s?'selected':''}>${data.STATUS_LABEL[s]}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" id="sClear" type="button">Очистити</button>
        </div>
        <div class="filters-row">
          <input type="text" id="sArticle" placeholder="Стаття" value="${data.escapeHtml(state.article)}">
          <input type="text" id="sAuthor" placeholder="Автор" value="${data.escapeHtml(state.author)}">
          <input type="text" id="sSuspect" placeholder="Підозрюваний" value="${data.escapeHtml(state.suspect)}">
          <input type="text" id="sResponsible" placeholder="Відповідальний" value="${data.escapeHtml(state.responsible)}">
          <input type="date" id="sCreatedFrom" value="${state.createdFrom}" aria-label="Створено від">
          <input type="date" id="sCreatedTo" value="${state.createdTo}" aria-label="Створено до">
        </div>
        <div class="chips-row" id="searchChips"></div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Результати</h2><span class="card-head-sub">${rows.length} записів</span></div>
        <div id="searchResults" style="display:grid"></div>
      </div>`;

    const list = root.querySelector('#searchResults');
    if(!rows.length){
      list.innerHTML = '';
      list.appendChild(window.KP.ui.emptyState({title:'За вибраними параметрами нічого не знайдено', actionLabel:'Скинути фільтри', iconName:'search', onAction: clearFilters}));
    } else {
      list.innerHTML = rows.map(c => `
        <div class="flex-between" style="padding:14px 18px;border-bottom:1px solid var(--border);cursor:pointer" data-row-id="${c.rowId}">
          <div style="min-width:0">
            <div class="td-title" style="font-family:var(--mono);font-size:12.5px;color:#C9C2FF">${c.id}</div>
            <div class="td-sub">${data.escapeHtml(c.article)} · ${data.escapeHtml(c.author)} → ${data.escapeHtml(c.suspect)}</div>
          </div>
          ${statusBadge(c.status)}
        </div>`).join('');
      list.querySelectorAll('[data-row-id]').forEach(row => row.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:open-case', {detail:{rowId:Number(row.dataset.rowId)}}))));
    }

    root.querySelector('#searchChips').innerHTML = activeChips().map(c => `<span class="chip is-active">${data.escapeHtml(c.label)}<button class="chip-remove" data-remove="${c.key}">${icon.x}</button></span>`).join('');
    root.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
      const k = btn.dataset.remove;
      if(k === 'created'){ state.createdFrom=''; state.createdTo=''; } else if(k==='status') state.status='all'; else state[k]='';
      render();
    }));

    root.querySelector('#sQuery').addEventListener('input', debounce(e => { state.q = e.target.value; render(); }, 250));
    root.querySelector('#sStatus').addEventListener('change', e => { state.status = e.target.value; render(); });
    root.querySelector('#sArticle').addEventListener('input', debounce(e => { state.article = e.target.value; render(); }, 250));
    root.querySelector('#sAuthor').addEventListener('input', debounce(e => { state.author = e.target.value; render(); }, 250));
    root.querySelector('#sSuspect').addEventListener('input', debounce(e => { state.suspect = e.target.value; render(); }, 250));
    root.querySelector('#sResponsible').addEventListener('input', debounce(e => { state.responsible = e.target.value; render(); }, 250));
    root.querySelector('#sCreatedFrom').addEventListener('change', e => { state.createdFrom = e.target.value; render(); });
    root.querySelector('#sCreatedTo').addEventListener('change', e => { state.createdTo = e.target.value; render(); });
    root.querySelector('#sClear').addEventListener('click', clearFilters);
  }

  function clearFilters(){
    Object.assign(state, {q:'', status:'all', article:'', author:'', suspect:'', responsible:'', createdFrom:'', createdTo:''});
    render();
  }

  function start(){
    root = document.getElementById('contentInner');
    data.onDataChange(render);
    render();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
