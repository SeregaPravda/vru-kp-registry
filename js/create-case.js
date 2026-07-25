/* Shared "Створити КП" drawer, available from sidebar / topbar / dashboard buttons. */
(function(){
  const { icon, el, toast } = window.KP.ui;
  const data = window.KP.data;
  let dirty = false;

  const datalistOptions = data.articleCatalog.map(a => `<option value="${data.escapeHtml(a.code + ' — ' + a.title)}">`).join('');
  const quickChips = data.quickArticles.map(a => `<button type="button" class="chip" data-quick-article="${data.escapeHtml(a.code + ' — ' + a.title)}">${data.escapeHtml(a.code)} — ${data.escapeHtml(a.title.toUpperCase())}</button>`).join('');

  const overlay = el(`
    <div class="drawer-overlay" id="createCaseOverlay">
      <div class="drawer" role="dialog" aria-modal="true" aria-labelledby="createCaseTitle">
        <div class="drawer-head">
          <div>
            <h3 id="createCaseTitle">Створити провадження</h3>
            <p class="modal-sub" style="margin:4px 0 0">Заповни основні дані — деталі можна додати пізніше через картку справи.</p>
          </div>
          <button class="modal-close" type="button" id="createCaseClose" aria-label="Закрити" style="position:static">${icon.x}</button>
        </div>
        <div class="drawer-body">
          <form id="createCaseForm" style="display:grid;gap:16px;padding:20px 22px">
            <label class="field">
              <span class="field-label">Автор КП <span class="req">*</span></span>
              <input type="text" name="author" placeholder="Det. Pravda / ID 542" required>
            </label>
            <label class="field">
              <span class="field-label">Підозрюваний <span class="req">*</span></span>
              <input type="text" name="suspect" placeholder="Nick_Name / ID 311" required>
            </label>
            <label class="field">
              <span class="field-label">Стаття ККУ <span class="req">*</span></span>
              <input type="text" name="article" list="articleDatalist" placeholder="Почни вводити номер або назву статті" required>
              <datalist id="articleDatalist">${datalistOptions}</datalist>
            </label>
            <div>
              <span class="field-label" style="display:block;margin-bottom:8px">Популярні статті</span>
              <div class="chips-row">${quickChips}</div>
            </div>
            <label class="field">
              <span class="field-label">Короткий опис <span class="req">*</span></span>
              <textarea name="shortDescription" placeholder="Що сталося, де, коли і хто був присутній" required style="min-height:80px"></textarea>
            </label>
            <label class="field">
              <span class="field-label">Повний опис</span>
              <textarea name="fullDescription" placeholder="Розширені деталі справи (необов'язково)"></textarea>
            </label>
            <label class="field">
              <span class="field-label">Матеріали справи / посилання</span>
              <input type="text" name="evidence" placeholder="Discord #evidence, bodycam 01:42, посилання на докази">
            </label>
            <label class="field">
              <span class="field-label">Додаткові примітки</span>
              <textarea name="notes" placeholder="Необов'язково" style="min-height:64px"></textarea>
            </label>
            <p class="field-error" id="createCaseError" hidden>${icon.alert}<span></span></p>
          </form>
        </div>
        <div class="drawer-foot">
          <button class="btn btn-secondary" type="button" id="createCaseCancel">Скасувати</button>
          <button class="btn btn-primary" type="submit" form="createCaseForm" id="createCaseSubmit">${icon.check}<span>Зареєструвати КП</span></button>
        </div>
      </div>
    </div>`);
  document.body.appendChild(overlay);

  const drawer = overlay.querySelector('.drawer');
  const form = overlay.querySelector('#createCaseForm');
  const errorEl = overlay.querySelector('#createCaseError');
  const submitBtn = overlay.querySelector('#createCaseSubmit');

  function open(){
    const user = data.getCurrentUser();
    if(!user){
      toast('Для реєстрації КП потрібно увійти в систему', 'error');
      if(window.KP.shell) window.KP.shell.openLogin();
      return;
    }
    if(user.role === 'judge'){
      toast('Суддя не реєструє нові КП', 'error');
      return;
    }
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    setTimeout(() => form.querySelector('[name="author"]').focus(), 80);
  }

  function close(force){
    if(dirty && !force){
      window.KP.ui.confirmDialog({
        title:'Закрити без збереження?',
        message:'Введені дані буде втрачено.',
        confirmLabel:'Закрити',
        danger:true
      }).then(ok => { if(ok) close(true); });
      return;
    }
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    form.reset();
    errorEl.hidden = true;
    dirty = false;
  }

  form.addEventListener('input', () => { dirty = true; });
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
  overlay.querySelector('#createCaseClose').addEventListener('click', () => close());
  overlay.querySelector('#createCaseCancel').addEventListener('click', () => close());
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('is-open')) close(); });

  overlay.querySelectorAll('[data-quick-article]').forEach(btn => {
    btn.addEventListener('click', () => {
      form.querySelector('[name="article"]').value = btn.dataset.quickArticle;
      dirty = true;
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.hidden = true;
    const fd = new FormData(form);
    const payload = {
      author: fd.get('author').trim(), suspect: fd.get('suspect').trim(), article: fd.get('article').trim(),
      shortDescription: fd.get('shortDescription').trim(), fullDescription: fd.get('fullDescription').trim(),
      evidence: fd.get('evidence').trim(), notes: fd.get('notes').trim()
    };
    if(!payload.author || !payload.suspect || !payload.article || !payload.shortDescription){
      errorEl.hidden = false; errorEl.querySelector('span').textContent = 'Заповни всі обов’язкові поля.';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Реєстрація...';
    try{
      const created = await data.createCase(payload);
      toast(`КП ${created.id} зареєстровано`, 'success');
      dirty = false;
      close(true);
    }catch(err){
      errorEl.hidden = false; errorEl.querySelector('span').textContent = err.message;
    }finally{
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Зареєструвати КП';
    }
  });

  window.KP.ui.trapFocus(drawer, () => drawer.classList.contains('is-open'));

  document.addEventListener('app:open-create-case', open);
})();
