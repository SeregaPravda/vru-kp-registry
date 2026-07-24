/* Shared UI helpers: icons, toasts, confirm dialog, empty/skeleton states, status badge. */
window.KP = window.KP || {};

(function(){
  const icon = {
    dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    registry:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M9 3v6h6"/><path d="M21 3l-9 9"/><path d="M21 3h-6"/><path d="M21 3v6"/></svg>',
    create:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>',
    guide:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
    dots:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
    alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>',
    info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.6 20.6 0 0 1 5.06-5.94M9.9 4.24A10.7 10.7 0 0 1 12 4c7 0 11 7 11 7a20.5 20.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>',
    logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
    login:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>',
    empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M8 15h8"/><path d="M8 4h8l2 3H6z"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    open:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>',
    chevronDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
  };

  function el(html){ const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

  /* ---------------- Toasts ---------------- */
  let toastStack;
  function ensureToastStack(){
    if(!toastStack){ toastStack = el('<div class="toast-stack" aria-live="polite"></div>'); document.body.appendChild(toastStack); }
    return toastStack;
  }
  function toast(message, type){
    type = type || 'info';
    const iconMap = {success:icon.check, error:icon.alert, info:icon.info};
    const node = el(`<div class="toast t-${type}" role="status">${iconMap[type] || icon.info}<span>${KP.data.escapeHtml(message)}</span></div>`);
    ensureToastStack().appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-shown'));
    setTimeout(() => {
      node.classList.remove('is-shown');
      setTimeout(() => node.remove(), 250);
    }, 3800);
  }

  /* ---------------- Confirm dialog ---------------- */
  function confirmDialog(opts){
    return new Promise(resolve => {
      const overlay = el(`
        <div class="overlay" role="alertdialog" aria-modal="true">
          <div class="modal" style="width:min(400px,calc(100% - 32px))">
            <button class="modal-close" type="button" aria-label="Закрити">${icon.x}</button>
            <h3>${KP.data.escapeHtml(opts.title || 'Підтвердження')}</h3>
            <p class="modal-sub">${KP.data.escapeHtml(opts.message || '')}</p>
            <div class="confirm-actions">
              <button class="btn btn-secondary" data-act="cancel">Скасувати</button>
              <button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm">${KP.data.escapeHtml(opts.confirmLabel || 'Підтвердити')}</button>
            </div>
          </div>
        </div>`);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      function close(result){
        overlay.classList.remove('is-open');
        setTimeout(() => overlay.remove(), 200);
        document.removeEventListener('keydown', onKey);
        resolve(result);
      }
      function onKey(e){ if(e.key === 'Escape') close(false); }
      document.addEventListener('keydown', onKey);
      overlay.addEventListener('click', e => {
        if(e.target === overlay || e.target.closest('.modal-close') || e.target.dataset.act === 'cancel') close(false);
        if(e.target.dataset.act === 'confirm') close(true);
      });
      overlay.querySelector('[data-act="confirm"]').focus();
    });
  }

  /* ---------------- Empty / error / loading states ---------------- */
  function emptyState({title, message, actionLabel, onAction, iconName}){
    const wrap = el(`
      <div class="state-block">
        ${icon[iconName] || icon.empty}
        <h3>${KP.data.escapeHtml(title)}</h3>
        ${message ? `<p>${KP.data.escapeHtml(message)}</p>` : ''}
        ${actionLabel ? `<button class="btn btn-primary btn-sm" type="button">${icon.create}${KP.data.escapeHtml(actionLabel)}</button>` : ''}
      </div>`);
    if(actionLabel && onAction) wrap.querySelector('button').addEventListener('click', onAction);
    return wrap;
  }

  function skeletonRows(n){
    return Array.from({length:n || 5}).map(() => '<div class="skeleton skeleton-row"></div>').join('');
  }

  /* ---------------- Status badge ---------------- */
  const statusIcon = {
    new:icon.info, review:icon.eye, opened:icon.open, court:icon.registry, closed:icon.check, rejected:icon.x
  };
  function statusBadge(status){
    const label = KP.data.STATUS_LABEL[status] || status;
    return `<span class="status-badge s-${status}" data-tooltip="${KP.data.escapeHtml(label)}">${statusIcon[status] || ''}${KP.data.escapeHtml(label)}</span>`;
  }

  /* ---------------- Kebab dropdown ---------------- */
  function attachKebab(root){
    root.addEventListener('click', e => {
      const trigger = e.target.closest('[data-kebab-trigger]');
      document.querySelectorAll('.kebab-menu.is-open').forEach(m => { if(!trigger || m !== trigger.nextElementSibling) m.classList.remove('is-open'); });
      if(trigger){
        e.stopPropagation();
        const menu = trigger.nextElementSibling;
        if(menu) menu.classList.toggle('is-open');
      }
    });
    document.addEventListener('click', () => document.querySelectorAll('.kebab-menu.is-open').forEach(m => m.classList.remove('is-open')));
  }

  function debounce(fn, wait){
    let t; return function(...args){ clearTimeout(t); t = setTimeout(() => fn.apply(this,args), wait || 250); };
  }

  /* Basic focus trap: keeps Tab/Shift+Tab cycling within `container` while active(container) is true. */
  function trapFocus(container, isActive){
    container.addEventListener('keydown', e => {
      if(e.key !== 'Tab' || !isActive()) return;
      const focusables = container.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
      if(!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });
  }

  window.KP.ui = { icon, el, toast, confirmDialog, emptyState, skeletonRows, statusBadge, attachKebab, debounce, trapFocus };
})();
