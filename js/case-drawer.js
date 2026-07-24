/* Shared case-detail drawer: header, role-gated actions, tabs (Огляд/Матеріали/Історія/Учасники/Рішення). */
(function(){
  const { icon, el, toast, statusBadge, confirmDialog } = window.KP.ui;
  const data = window.KP.data;

  const overlay = el(`
    <div class="drawer-overlay" id="caseDrawerOverlay">
      <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="caseDrawerTitle">
        <div class="drawer-head">
          <div style="min-width:0">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <h3 id="caseDrawerTitle" style="font-family:var(--mono);font-size:15px"></h3>
              <span id="caseDrawerStatus"></span>
            </div>
            <p class="modal-sub" id="caseDrawerArticle" style="margin:6px 0 0"></p>
          </div>
          <button class="modal-close" type="button" id="caseDrawerClose" aria-label="Закрити" style="position:static">${icon.x}</button>
        </div>
        <div class="drawer-body">
          <div style="padding:16px 22px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12.5px;color:var(--muted);border-bottom:1px solid var(--border)" id="caseDrawerMeta"></div>
          <div style="padding:14px 22px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border)" id="caseDrawerActions"></div>
          <div class="tabs" id="caseDrawerTabs">
            <button class="tab-btn is-active" data-tab="overview">Огляд</button>
            <button class="tab-btn" data-tab="materials">Матеріали</button>
            <button class="tab-btn" data-tab="history">Історія</button>
            <button class="tab-btn" data-tab="participants">Учасники</button>
            <button class="tab-btn" data-tab="decision">Рішення</button>
          </div>
          <div class="tab-panel is-active" data-panel="overview" id="panelOverview"></div>
          <div class="tab-panel" data-panel="materials" id="panelMaterials"></div>
          <div class="tab-panel" data-panel="history" id="panelHistory"></div>
          <div class="tab-panel" data-panel="participants" id="panelParticipants"></div>
          <div class="tab-panel" data-panel="decision" id="panelDecision"></div>
        </div>
      </div>
    </div>`);
  document.body.appendChild(overlay);
  const drawer = overlay.querySelector('.drawer');

  overlay.querySelector('#caseDrawerTabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if(!btn) return;
    overlay.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
    overlay.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    overlay.querySelector(`[data-panel="${btn.dataset.tab}"]`).classList.add('is-active');
  });

  function close(){
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
  }
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  overlay.querySelector('#caseDrawerClose').addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('is-open')) close(); });

  const NEXT_STEPS = {
    new:[{to:'review', perm:'review', label:'Взяти на перевірку'}],
    review:[{to:'opened', perm:'review', label:'Відкрити провадження'}, {to:'rejected', perm:'review', label:'Відхилити', danger:true}],
    opened:[{to:'court', perm:'court', label:'Передати до суду'}, {to:'rejected', perm:'review', label:'Відхилити', danger:true}],
    court:[{to:'closed', perm:'decide', label:'Закрити справу'}, {to:'rejected', perm:'decide', label:'Відхилити', danger:true}]
  };

  let activeCase = null;

  function findCase(rowId){ return data.getCases().find(c => c.rowId === rowId); }

  async function refresh(rowId){
    await data.loadCases();
    activeCase = findCase(rowId);
    if(!activeCase){ close(); return; }
    render();
  }

  function render(){
    const c = activeCase;
    overlay.querySelector('#caseDrawerTitle').textContent = c.id;
    overlay.querySelector('#caseDrawerStatus').innerHTML = statusBadge(c.status);
    overlay.querySelector('#caseDrawerArticle').textContent = c.article;

    overlay.querySelector('#caseDrawerMeta').innerHTML = `
      <div><b style="color:var(--text)">Автор:</b> ${data.escapeHtml(c.author)}</div>
      <div><b style="color:var(--text)">Підозрюваний:</b> ${data.escapeHtml(c.suspect)}</div>
      <div><b style="color:var(--text)">Створено:</b> ${data.formatDate(c.createdAt)}</div>
      <div><b style="color:var(--text)">Востаннє змінено:</b> ${data.formatDate(c.updatedAt)}</div>
      <div><b style="color:var(--text)">Відповідальний:</b> ${data.escapeHtml(c.responsible || 'не призначено')}</div>
    `;

    /* actions */
    const steps = NEXT_STEPS[c.status] || [];
    const actionButtons = steps.filter(s => data.hasPermission(s.perm)).map(s =>
      `<button class="btn ${s.danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-transition="${s.to}">${s.label}</button>`
    ).join('');
    const assignBtn = data.hasPermission('assign') ? `<button class="btn btn-secondary btn-sm" id="assignBtn">${icon.user}<span>Призначити відповідального</span></button>` : '';
    const restoreBtn = ['closed','rejected'].includes(c.status) && data.hasPermission('archive_restore')
      ? `<button class="btn btn-secondary btn-sm" id="restoreBtn">Відновити провадження</button>` : '';
    const noAccessNote = (!actionButtons && !assignBtn && !restoreBtn)
      ? `<p style="font-size:12.5px;color:var(--muted-dim)">${data.getCurrentUser() ? 'Дій, доступних вашій ролі для цього статусу, немає.' : 'Увійдіть в систему, щоб керувати статусом справи.'}</p>` : '';
    overlay.querySelector('#caseDrawerActions').innerHTML = actionButtons + assignBtn + restoreBtn + noAccessNote;

    overlay.querySelectorAll('[data-transition]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const to = btn.dataset.transition;
        if(btn.classList.contains('btn-danger')){
          const ok = await confirmDialog({title:'Відхилити справу?', message:`КП ${c.id} буде позначено як відхилене.`, confirmLabel:'Відхилити', danger:true});
          if(!ok) return;
        }
        try{
          await data.updateCaseStatus(c.rowId, to);
          toast(`Статус змінено на «${data.STATUS_LABEL[to]}»`, 'success');
          await refresh(c.rowId);
        }catch(err){ toast(err.message, 'error'); }
      });
    });

    const assignBtnEl = overlay.querySelector('#assignBtn');
    if(assignBtnEl) assignBtnEl.addEventListener('click', async () => {
      const name = prompt('Ім’я відповідального:', c.responsible || '');
      if(name == null) return;
      try{ await data.assignResponsible(c.rowId, name.trim()); toast('Відповідального призначено', 'success'); await refresh(c.rowId); }
      catch(err){ toast(err.message, 'error'); }
    });
    const restoreBtnEl = overlay.querySelector('#restoreBtn');
    if(restoreBtnEl) restoreBtnEl.addEventListener('click', async () => {
      const ok = await confirmDialog({title:'Відновити провадження?', message:`КП ${c.id} повернеться на перевірку.`, confirmLabel:'Відновити'});
      if(!ok) return;
      try{ await data.updateCaseStatus(c.rowId, 'review'); toast('Провадження відновлено', 'success'); await refresh(c.rowId); }
      catch(err){ toast(err.message, 'error'); }
    });

    renderOverview(c);
    renderParticipants(c);
    renderDecision(c);
    renderMaterials(c);
    renderHistory(c);
  }

  function renderOverview(c){
    overlay.querySelector('#panelOverview').innerHTML = `
      <div style="display:grid;gap:14px">
        <div><div class="field-label" style="margin-bottom:6px">Короткий опис</div><p>${data.escapeHtml(c.shortDescription)}</p></div>
        ${c.fullDescription ? `<div><div class="field-label" style="margin-bottom:6px">Повний опис</div><p>${data.escapeHtml(c.fullDescription)}</p></div>` : ''}
        ${c.notes ? `<div><div class="field-label" style="margin-bottom:6px">Примітки</div><p>${data.escapeHtml(c.notes)}</p></div>` : ''}
        ${c.evidence ? `<div><div class="field-label" style="margin-bottom:6px">Матеріали / посилання</div><p>${/^https?:\/\//i.test(c.evidence) ? `<a href="${data.escapeHtml(c.evidence)}" target="_blank" rel="noopener noreferrer" style="color:#93C5FD">${data.escapeHtml(c.evidence)}</a>` : data.escapeHtml(c.evidence)}</p></div>` : ''}
      </div>`;
  }

  function renderParticipants(c){
    overlay.querySelector('#panelParticipants').innerHTML = `
      <div style="display:grid;gap:10px">
        <div class="card card-pad" style="display:flex;justify-content:space-between"><span>Автор КП</span><b>${data.escapeHtml(c.author)}</b></div>
        <div class="card card-pad" style="display:flex;justify-content:space-between"><span>Підозрюваний</span><b>${data.escapeHtml(c.suspect)}</b></div>
        <div class="card card-pad" style="display:flex;justify-content:space-between"><span>Відповідальний</span><b>${data.escapeHtml(c.responsible || 'не призначено')}</b></div>
      </div>`;
  }

  function renderDecision(c){
    const canDecide = data.hasPermission('decide') && ['court','closed','rejected'].includes(c.status);
    overlay.querySelector('#panelDecision').innerHTML = `
      <div style="display:grid;gap:12px">
        ${c.closedAt ? `<div style="font-size:12.5px;color:var(--muted)">Закрито: <b style="color:var(--text)">${data.escapeHtml(c.closedBy || '—')}</b> · ${data.formatDate(c.closedAt)}</div>` : ''}
        <label class="field">
          <span class="field-label">Текст рішення</span>
          <textarea id="decisionText" ${canDecide ? '' : 'disabled'} placeholder="${canDecide ? 'Опиши рішення по справі' : 'Недоступно для вашої ролі або поточного статусу'}">${data.escapeHtml(c.decision || '')}</textarea>
        </label>
        ${canDecide ? '<button class="btn btn-primary btn-sm" id="saveDecisionBtn" style="justify-self:start">Зберегти рішення</button>' : ''}
      </div>`;
    const saveBtn = overlay.querySelector('#saveDecisionBtn');
    if(saveBtn) saveBtn.addEventListener('click', async () => {
      try{ await data.setDecision(c.rowId, overlay.querySelector('#decisionText').value.trim()); toast('Рішення збережено', 'success'); await refresh(c.rowId); }
      catch(err){ toast(err.message, 'error'); }
    });
  }

  async function renderMaterials(c){
    const panel = overlay.querySelector('#panelMaterials');
    panel.innerHTML = window.KP.ui.skeletonRows(2);
    const materials = await data.loadMaterials(c.rowId);
    const canAdd = data.hasPermission('register') || data.hasPermission('edit');
    const listHtml = materials.length ? materials.map(m => `
      <div class="card card-pad" style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <div><div class="td-title">${data.escapeHtml(m.title)}</div><div class="td-sub">${data.escapeHtml(m.kind)} · ${data.escapeHtml(m.added_by)} · ${data.formatDate(m.created_at)}</div></div>
        <a href="${data.escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">${icon.open}</a>
      </div>`).join('') : `<p style="font-size:13px;color:var(--muted)">Матеріалів ще не додано.</p>`;

    panel.innerHTML = `
      <div style="display:grid;gap:10px">${listHtml}</div>
      ${canAdd ? `
      <form id="addMaterialForm" style="display:grid;grid-template-columns:1.2fr .8fr 1.4fr auto;gap:8px;margin-top:14px">
        <input type="text" name="title" placeholder="Назва" required>
        <select name="kind"><option value="link">Посилання</option><option value="screenshot">Скріншот</option><option value="video">Відео</option><option value="document">Документ</option><option value="other">Інше</option></select>
        <input type="url" name="url" placeholder="https://..." required>
        <button class="btn btn-secondary btn-sm" type="submit">${icon.create}</button>
      </form>` : ''}`;

    const materialForm = panel.querySelector('#addMaterialForm');
    if(materialForm) materialForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(materialForm);
      try{
        await data.addMaterial(c.rowId, {title:fd.get('title'), kind:fd.get('kind'), url:fd.get('url')});
        toast('Матеріал додано', 'success');
        renderMaterials(c);
        materialForm.reset();
      }catch(err){ toast(err.message, 'error'); }
    });
  }

  async function renderHistory(c){
    const panel = overlay.querySelector('#panelHistory');
    panel.innerHTML = window.KP.ui.skeletonRows(3);
    const entries = await data.loadAudit(c.rowId);
    if(!entries.length){ panel.innerHTML = '<p style="font-size:13px;color:var(--muted)">Історія дій поки порожня.</p>'; return; }
    panel.innerHTML = `<div class="timeline">${entries.map(e => `
      <div class="timeline-item">
        <div class="timeline-title">${e.action === 'case_created' ? 'КП створено' : `Статус змінено${e.actor ? ' · ' + data.escapeHtml(e.actor) : ''}`}</div>
        ${e.from_status ? `<div class="timeline-detail">«${data.STATUS_LABEL[e.from_status] || e.from_status}» → «${data.STATUS_LABEL[e.to_status] || e.to_status}»</div>` : ''}
        <div class="timeline-meta">${data.formatDate(e.created_at)} · ${data.timeAgo(e.created_at)}</div>
      </div>`).join('')}</div>`;
  }

  window.KP.ui.trapFocus(drawer, () => drawer.classList.contains('is-open'));

  document.addEventListener('app:open-case', async e => {
    const rowId = e.detail.rowId;
    activeCase = findCase(rowId);
    if(!activeCase){ toast('Справу не знайдено', 'error'); return; }
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    overlay.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('is-active', i===0));
    overlay.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('is-active', i===0));
    render();
  });
})();
