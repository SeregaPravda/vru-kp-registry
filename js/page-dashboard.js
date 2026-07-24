(function(){
  if(!document.querySelector('[data-page="dashboard"]')) return;
  const { icon, toast, emptyState, statusBadge } = window.KP.ui;
  const data = window.KP.data;

  const STAT_DEFS = [
    {key:'all', label:'Усього КП', iconName:'registry', acc:'acc-grey', href:'./registry.html'},
    {key:'court', label:'У суді', iconName:'registry', acc:'acc-orange', href:'./registry.html?status=court'},
    {key:'closed', label:'Закриті', iconName:'check', acc:'acc-green', href:'./archive.html?status=closed'},
    {key:'rejected', label:'Відхилені', iconName:'x', acc:'acc-red', href:'./archive.html?status=rejected'}
  ];

  function countFor(cases, key){
    if(key === 'all') return cases.length;
    return cases.filter(c => c.status === key).length;
  }

  let renderToken = 0;

  async function render(){
    const token = ++renderToken;
    const grid = document.getElementById('dashStatGrid');

    // Note: intentionally NOT calling data.loadCases() here. loadCases() always
    // calls notifyDataChange(), which re-invokes every onDataChange listener -
    // including this render function. Calling it from inside render() creates
    // an infinite render -> load -> notify -> render loop. boot.js and the
    // realtime subscription are responsible for keeping data.getCases() fresh;
    // this function only reads the already-loaded cache.
    const cases = data.getCases();

    grid.innerHTML = STAT_DEFS.map(def => `
      <a class="stat-card ${def.acc}" href="${def.href}">
        <span class="stat-icon">${icon[def.iconName]}</span>
        <b>${countFor(cases, def.key)}</b>
        <span>${def.label}</span>
      </a>`).join('');

    const recentWrap = document.getElementById('dashRecentCases');
    const recent = cases.slice(0,7);
    if(!recent.length){
      recentWrap.innerHTML = '';
      recentWrap.appendChild(emptyState({title:'Активних проваджень поки немає', message:'Зареєструй перше кримінальне провадження, щоб побачити його тут.', actionLabel:'Створити перше КП', iconName:'empty', onAction: () => document.dispatchEvent(new CustomEvent('app:open-create-case'))}));
    } else {
      recentWrap.innerHTML = `<div style="display:grid">${recent.map(c => `
        <div class="flex-between" style="padding:12px 18px;border-bottom:1px solid var(--border);cursor:pointer" data-open-case="${c.rowId}">
          <div style="min-width:0">
            <div class="td-title" style="font-family:var(--mono);font-size:12.5px;color:#C9C2FF">${c.id}</div>
            <div class="td-sub">${data.escapeHtml(c.article)}</div>
          </div>
          ${statusBadge(c.status)}
        </div>`).join('')}</div>`;
      recentWrap.querySelectorAll('[data-open-case]').forEach(row => {
        row.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:open-case', {detail:{rowId: Number(row.dataset.openCase)}})));
      });
    }

    const activityWrap = document.getElementById('dashActivity');
    const entries = await data.loadAudit(null);
    if(token !== renderToken) return;
    if(!entries.length){
      activityWrap.innerHTML = '';
      activityWrap.appendChild(emptyState({title:'Журнал дій порожній', message:'Тут з’являться зміни статусів справ.', iconName:'info'}));
    } else {
      activityWrap.innerHTML = entries.slice(0,8).map(e => {
        const c = cases.find(x => x.rowId === e.case_id);
        const label = e.action === 'case_created'
          ? `КП ${c ? c.id : '#' + e.case_id} зареєстровано`
          : `${data.escapeHtml(e.actor || 'Система')} змінив статус ${c ? c.id : '#' + e.case_id}: «${data.STATUS_LABEL[e.from_status] || e.from_status}» → «${data.STATUS_LABEL[e.to_status] || e.to_status}»`;
        return `<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:12.5px">
          <div>${label}</div>
          <div style="color:var(--muted-dim);margin-top:3px">${data.timeAgo(e.created_at)}</div>
        </div>`;
      }).join('');
    }
  }

  data.onDataChange(render);
  render();

  const strip = document.getElementById('dashProcessStrip');
  const steps = [
    {label:'Реєстрація', color:'#3B82F6'},
    {label:'Перевірка', color:'#F59E0B'},
    {label:'Відкриття', color:'#6D5DFB'},
    {label:'Суд', color:'#F97316'},
    {label:'Рішення', color:'#22C55E'},
    {label:'Архів', color:'#94A3B8'}
  ];
  strip.innerHTML = steps.map((s,i) => `<div class="process-step"><span class="dot" style="background:${s.color};box-shadow:0 0 0 3px ${s.color}22"></span><span>${s.label}</span></div>${i < steps.length-1 ? '<div class="process-line"></div>' : ''}`).join('');
})();
