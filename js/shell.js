/* App Shell: sidebar, topbar, mobile drawer, login modal. Mounts page-specific markup into content-inner. */
(function(){
  const { icon, el, toast } = window.KP.ui;
  const data = window.KP.data;

  const NAV_ITEMS = [
    {href:'./index.html', match:['index.html',''], label:'Огляд', iconName:'dashboard'},
    {href:'./registry.html', match:['registry.html'], label:'Пошук КП', iconName:'search'},
    {action:'create-case', label:'Створити КП', iconName:'create', cta:true},
    {href:'./archive.html', match:['archive.html'], label:'Архів', iconName:'archive'},
    {href:'./guide.html', match:['guide.html'], label:'Регламент', iconName:'guide'}
  ];

  const PAGE_META = {
    'index.html': {title:'Огляд', crumbs:['Огляд']},
    '': {title:'Огляд', crumbs:['Огляд']},
    'registry.html': {title:'Пошук КП', crumbs:['Пошук КП']},
    'archive.html': {title:'Архів', crumbs:['Архів']},
    'guide.html': {title:'Регламент', crumbs:['Регламент']}
  };

  const currentFile = location.pathname.split('/').pop();
  const meta = PAGE_META[currentFile] || {title:'КП ВРУ', crumbs:[]};

  function buildSidebar(){
    const navHtml = NAV_ITEMS.map(item => {
      const isActive = item.match && item.match.includes(currentFile);
      if(item.action === 'create-case'){
        return `<button type="button" class="sidebar-link ${item.cta ? 'is-cta' : ''}" data-action="open-create-case">${icon[item.iconName]}<span>${item.label}</span></button>`;
      }
      return `<a href="${item.href}" class="sidebar-link ${isActive ? 'is-active' : ''}">${icon[item.iconName]}<span>${item.label}</span></a>`;
    }).join('');

    return el(`
      <aside class="app-sidebar">
        <a class="sidebar-brand" href="./index.html">
          <span class="sidebar-brand-mark">КП</span>
          <span><strong>КП ВРУ</strong><small>Реєстр проваджень</small></span>
        </a>
        <nav class="sidebar-nav">${navHtml}</nav>
        <div class="sidebar-foot">
          <div class="sidebar-status"><i></i><span>Система активна</span></div>
          <div class="sidebar-version">v2.0 · Ukraine GTA</div>
          <div id="sidebarAuthSlot"></div>
        </div>
      </aside>`);
  }

  function buildTopbar(){
    return el(`
      <header class="app-topbar">
        <button class="topbar-menu-btn" type="button" aria-label="Відкрити меню">${icon.menu}</button>
        <div class="topbar-titles">
          <div class="topbar-title">${data.escapeHtml(meta.title)}</div>
          <nav class="breadcrumbs" aria-label="breadcrumbs">${meta.crumbs.map((c,i) => `<span>${i>0 ? '/' : ''} ${data.escapeHtml(c)}</span>`).join(' ')}</nav>
        </div>
        <form class="topbar-search" role="search" id="globalSearchForm">
          ${icon.search}
          <input type="search" placeholder="Глобальний пошук за ID, автором, статтею..." aria-label="Глобальний пошук" id="globalSearchInput">
        </form>
        <div class="topbar-actions">
          <button class="btn btn-primary btn-sm" type="button" data-action="open-create-case">${icon.create}<span>Створити КП</span></button>
          <button class="icon-btn" type="button" aria-label="Сповіщення" id="notifBtn">${icon.bell}</button>
          <span class="role-pill" id="rolePill"></span>
          <div id="topbarAuthSlot"></div>
        </div>
      </header>`);
  }

  function renderAuthSlots(user){
    const sidebarSlot = document.getElementById('sidebarAuthSlot');
    const topbarSlot = document.getElementById('topbarAuthSlot');
    const rolePill = document.getElementById('rolePill');
    if(!sidebarSlot) return;

    if(user){
      const initials = (user.displayName || '?').trim().slice(0,2).toUpperCase();
      sidebarSlot.innerHTML = `
        <div class="sidebar-user">
          <span class="sidebar-user-avatar">${initials}</span>
          <span class="sidebar-user-meta"><span class="sidebar-user-name">${data.escapeHtml(user.displayName)}</span></span>
          <button class="sidebar-logout" type="button" data-action="logout" aria-label="Вийти" data-tooltip="Вийти">${icon.logout}</button>
        </div>`;
      topbarSlot.innerHTML = `<button class="icon-btn" type="button" data-action="logout" aria-label="Вийти" data-tooltip="Вийти">${icon.logout}</button>`;
      rolePill.textContent = user.displayName;
      rolePill.classList.add('is-visible');
    } else {
      sidebarSlot.innerHTML = `<button class="sidebar-login-btn" type="button" data-action="open-login">${icon.login}<span>Увійти в систему</span></button>`;
      topbarSlot.innerHTML = `<button class="btn btn-secondary btn-sm" type="button" data-action="open-login">${icon.login}<span>Увійти</span></button>`;
      rolePill.classList.remove('is-visible');
      rolePill.textContent = '';
    }
  }

  /* ---------------- Login modal ---------------- */
  function buildLoginModal(){
    const overlay = el(`
      <div class="overlay" id="loginOverlay" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
        <div class="modal">
          <button class="modal-close" type="button" aria-label="Закрити">${icon.x}</button>
          <div class="modal-head">
            <span class="modal-logo">КП</span>
            <h3 id="loginTitle">Вхід до системи</h3>
          </div>
          <p class="modal-sub">Введи персональний код доступу, виданий адміністрацією, щоб отримати роль слідчого, прокурора, судді чи адміністратора.</p>
          <form id="loginForm">
            <label class="field">
              <span class="field-label">Код доступу</span>
              <div class="code-input-wrap">
                <input type="password" id="loginCodeInput" autocomplete="off" placeholder="Наприклад: XXXX-0000" required>
                <button type="button" class="code-toggle" id="codeToggleBtn" aria-label="Показати код">${icon.eye}</button>
              </div>
            </label>
            <p class="field-error" id="loginError" hidden>${icon.alert}<span></span></p>
            <button class="btn btn-primary" type="submit" style="width:100%;margin-top:14px" id="loginSubmitBtn">Увійти</button>
          </form>
        </div>
      </div>`);
    document.body.appendChild(overlay);

    const codeInput = overlay.querySelector('#loginCodeInput');
    const toggleBtn = overlay.querySelector('#codeToggleBtn');
    const errorEl = overlay.querySelector('#loginError');
    const form = overlay.querySelector('#loginForm');
    const submitBtn = overlay.querySelector('#loginSubmitBtn');

    toggleBtn.addEventListener('click', () => {
      const showing = codeInput.type === 'text';
      codeInput.type = showing ? 'password' : 'text';
      toggleBtn.innerHTML = showing ? icon.eye : icon.eyeOff;
      toggleBtn.setAttribute('aria-label', showing ? 'Показати код' : 'Приховати код');
    });

    function close(){
      overlay.classList.remove('is-open');
      codeInput.value = '';
      errorEl.hidden = true;
    }
    overlay.addEventListener('click', e => { if(e.target === overlay || e.target.closest('.modal-close')) close(); });
    document.addEventListener('keydown', e => { if(e.key === 'Escape' && overlay.classList.contains('is-open')) close(); });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Перевірка...';
      try{
        const user = await data.login(codeInput.value.trim());
        toast(`Вітаємо, ${user.displayName}!`, 'success');
        close();
      }catch(err){
        errorEl.hidden = false;
        errorEl.querySelector('span').textContent = err.message || 'Невірний код доступу';
      }finally{
        submitBtn.disabled = false;
        submitBtn.textContent = 'Увійти';
      }
    });

    window.KP.ui.trapFocus(overlay, () => overlay.classList.contains('is-open'));

    return {
      open(){ overlay.classList.add('is-open'); setTimeout(() => codeInput.focus(), 50); },
      close
    };
  }

  /* ---------------- Mount shell ---------------- */
  function mount(){
    const pageContent = document.querySelector('.page-content');
    const shell = el('<div class="app-shell"></div>');
    const backdrop = el('<div class="sidebar-backdrop"></div>');
    const sidebar = buildSidebar();
    const main = el('<div class="app-main"></div>');
    const topbar = buildTopbar();
    const content = el('<main class="app-content"><div class="content-inner" id="contentInner"></div></main>');

    main.appendChild(topbar);
    main.appendChild(content);
    shell.appendChild(backdrop);
    shell.appendChild(sidebar);
    shell.appendChild(main);

    if(pageContent){
      content.querySelector('#contentInner').append(...pageContent.childNodes);
      pageContent.remove();
    }
    document.body.prepend(shell);

    const loginModal = buildLoginModal();
    window.KP.shell = { openLogin: loginModal.open };

    /* mobile drawer */
    const menuBtn = topbar.querySelector('.topbar-menu-btn');
    menuBtn.addEventListener('click', () => { sidebar.classList.add('is-open'); backdrop.classList.add('is-open'); });
    backdrop.addEventListener('click', () => { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-open'); });

    /* global search */
    topbar.querySelector('#globalSearchForm').addEventListener('submit', e => {
      e.preventDefault();
      const q = topbar.querySelector('#globalSearchInput').value.trim();
      location.href = './registry.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });

    /* delegated actions */
    document.addEventListener('click', e => {
      const actionEl = e.target.closest('[data-action]');
      if(!actionEl) return;
      const action = actionEl.dataset.action;
      if(action === 'open-login') loginModal.open();
      if(action === 'logout'){ data.logout(); toast('Ви вийшли з системи', 'info'); }
      if(action === 'open-create-case') document.dispatchEvent(new CustomEvent('app:open-create-case'));
    });

    data.onAuthChange(renderAuthSlots);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
