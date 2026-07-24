(function(){
  if(!document.querySelector('[data-page="archive"]')) return;
  const { icon, statusBadge, debounce } = window.KP.ui;
  const data = window.KP.data;
  let root;
  const params = new URLSearchParams(location.search);

  const ARCHIVE_STATUSES = ['closed','rejected'];
  const state = { q:'', status: params.get('status') && ARCHIVE_STATUSES.includes(params.get('status')) ? params.get('status') : 'all', sortKey:'closedAt', sortDir:'desc' };

  function rows(){
    const q = state.q.trim().toLowerCase();
    let list = data.getCases().filter(c => ARCHIVE_STATUSES.includes(c.status));
    if(state.status !== 'all') list = list.filter(c => c.status === state.status);
    if(q) list = list.filter(c => `${c.id} ${c.author} ${c.suspect} ${c.article}`.toLowerCase().includes(q));
    list.sort((a,b) => new Date(b.closedAt || b.updatedAt) - new Date(a.closedAt || a.updatedAt));
    return list;
  }

  function render(){
    const list = rows();
    root.innerHTML = `
      <div><h1 style="font-size:22px">Архів справ</h1><p style="color:var(--muted);margin-top:4px">Завершені та відхилені провадження. Відновлення вимагає підтвердження та прав адміністратора.</p></div>
      <div class="card card-pad">
        <div class="toolbar">
          <div class="toolbar-search">${icon.search}<input type="text" id="aQuery" placeholder="Пошук по архіву..." value="${data.escapeHtml(state.q)}"></div>
          <div class="chips-row">
            <button class="chip ${state.status==='all'?'is-active':''}" data-status="all">Усі архівні</button>
            <button class="chip ${state.status==='closed'?'is-active':''}" data-status="closed">Закрито</button>
            <button class="chip ${state.status==='rejected'?'is-active':''}" data-status="rejected">Відхилено</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Архівний реєстр</h2><span class="card-head-sub">${list.length} записів</span></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Підозрюваний</th><th>Стаття</th><th>Статус</th><th>Рішення</th><th>Закрив(ла)</th><th>Дата завершення</th></tr></thead>
            <tbody id="archiveBody"></tbody>
          </table>
        </div>
        <div class="case-cards" id="archiveCards"></div>
      </div>`;

    const tbody = root.querySelector('#archiveBody');
    const cards = root.querySelector('#archiveCards');
    if(!list.length){
      tbody.innerHTML = `<tr><td colspan="7"><div class="state-block">${icon.archive}<h3>Архів порожній для цього фільтра</h3></div></td></tr>`;
      cards.innerHTML = '';
    } else {
      tbody.innerHTML = list.map(c => `
        <tr data-row-id="${c.rowId}">
          <td class="mono">${c.id}</td>
          <td class="td-title">${data.escapeHtml(c.suspect)}</td>
          <td>${data.escapeHtml(c.article)}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${data.escapeHtml(c.decision || '—')}</td>
          <td>${data.escapeHtml(c.closedBy || '—')}</td>
          <td>${data.formatDate(c.closedAt)}</td>
        </tr>`).join('');
      cards.innerHTML = list.map(c => `
        <article class="case-card" data-row-id="${c.rowId}">
          <div class="case-card-top"><span class="case-card-id">${c.id}</span>${statusBadge(c.status)}</div>
          <div class="case-card-title">${data.escapeHtml(c.article)}</div>
          <div class="case-card-meta">Закрито: ${data.formatDate(c.closedAt)}</div>
        </article>`).join('');
      root.querySelectorAll('[data-row-id]').forEach(row => row.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:open-case', {detail:{rowId:Number(row.dataset.rowId)}}))));
    }

    root.querySelector('#aQuery').addEventListener('input', debounce(e => { state.q = e.target.value; render(); }, 250));
    root.querySelectorAll('[data-status]').forEach(btn => btn.addEventListener('click', () => { state.status = btn.dataset.status; render(); }));
  }

  function start(){
    root = document.getElementById('contentInner');
    data.onDataChange(render);
    render();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
