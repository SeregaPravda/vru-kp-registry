(function(){
  /* ============================================================
     SUPABASE CONFIG
     Створи проєкт на https://supabase.com (безкоштовно), а тоді:
     1. У SQL Editor виконай запит зі схемою (див. SUPABASE.md поруч з цим файлом).
     2. Project Settings -> API -> скопіюй "Project URL" та "anon public" key.
     3. Встав їх сюди замість заглушок нижче.
     Поки тут заглушки — сайт працює в локальному демо-режимі (10 фіксованих справ).
  ============================================================ */
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
  const isSupabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;
  const supabaseClient = (isSupabaseConfigured && window.supabase)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

  const calculatorArticles = [
    {code:'5.10', title:'Хуліганство', term:15, fine:12000},
    {code:'5.13', title:'Незаконна зброя', term:30, fine:30000},
    {code:'10.6', title:'Привласнення повноважень', term:25, fine:18000},
    {code:'4.2', title:'Грабіж', term:20, fine:15000},
    {code:'4.4', title:'Шахрайство', term:18, fine:14000},
    {code:'8.7', title:'Одержання хабара', term:35, fine:45000}
  ];

  const articleCatalog = [
    {code:'1', title:'Завдання Кримінального кодексу Південної України'},
    {code:'2', title:'Підстава кримінальної відповідальності'},
    {code:'3', title:'Принципи кримінального права'},
    {code:'4', title:'Поняття злочину та класифікація злочинів'},
    {code:'5', title:'Обтяжуючі обставини'},
    {code:'6', title:'Пом’якшуючі обставини'},
    {code:'7', title:'Добровільна відмова від злочину'},
    {code:'1.1', title:'Вбивство'},
    {code:'1.2', title:'Вбивство при перевищенні меж необхідної оборони'},
    {code:'1.3', title:'Умисне заподіяння тяжкої шкоди здоров’ю'},
    {code:'1.4', title:'Погроза вбивством або тяжкою шкодою здоров’ю'},
    {code:'1.5', title:'Ненадання допомоги хворому'},
    {code:'1.6', title:'Перешкоджання наданню медичної допомоги'},
    {code:'1.7', title:'Залишення в небезпеці'},
    {code:'2.1', title:'Викрадення людини'},
    {code:'2.2', title:'Незаконне позбавлення волі'},
    {code:'2.3', title:'Наклеп'},
    {code:'2.4', title:'Порушення недоторканності приватного життя'},
    {code:'3.1', title:'Порушення рівності прав і свобод людини і громадянина'},
    {code:'3.2', title:'Порушення таємниці листування або телефонних переговорів'},
    {code:'3.3', title:'Порушення недоторканності житла'},
    {code:'3.4', title:'Відмова в наданні громадянину інформації'},
    {code:'4.1', title:'Крадіжка'},
    {code:'4.2', title:'Грабіж'},
    {code:'4.3', title:'Напад на інкасацію'},
    {code:'4.4', title:'Шахрайство'},
    {code:'4.5', title:'Вимагання'},
    {code:'4.6', title:'Умисне знищення або пошкодження майна'},
    {code:'4.7', title:'Крадіжка авто (незаконне заволодіння транспортним засобом)'},
    {code:'4.8', title:'Привласнення або розтрата майна'},
    {code:'4.9', title:'Розтрата бюджетних коштів'},
    {code:'4.10', title:'Порушення авторського права або суміжних прав'},
    {code:'4.11', title:'Контрабанда майна'},
    {code:'5.1', title:'Терористичний акт'},
    {code:'5.2', title:'Сприяння терористичній діяльності'},
    {code:'5.3', title:'Неповідомлення про злочин'},
    {code:'5.4', title:'Захоплення заручника'},
    {code:'5.5', title:'Завідомо неправдиве повідомлення про акт тероризму'},
    {code:'5.6', title:'Бандитизм'},
    {code:'5.7', title:'Організація злочинного співтовариства'},
    {code:'5.8', title:'Зайняття вищого становища у злочинній ієрархії'},
    {code:'5.9', title:'Масові заворушення'},
    {code:'5.10', title:'Хуліганство'},
    {code:'5.11', title:'Вандалізм'},
    {code:'5.12', title:'Незаконне проникнення на об’єкт, що охороняється'},
    {code:'5.13', title:'Незаконне придбання, передача, виготовлення зброї та боєприпасів'},
    {code:'5.14', title:'Незаконне використання або носіння зброї'},
    {code:'5.15', title:'Збройне насильство під час мітингу'},
    {code:'5.16', title:'Порушення правил порядку'},
    {code:'6.1', title:'Порушення правил дорожнього руху, що спричинило тяжку шкоду здоров’ю'},
    {code:'6.2', title:'Порушення правил дорожнього руху, що спричинило смерть'},
    {code:'6.3', title:'Створення ДТП'},
    {code:'6.4', title:'Умисне блокування транспортних комунікацій'},
    {code:'6.5', title:'Ненадання допомоги потерпілому у ДТП'},
    {code:'7.1', title:'Незаконне виготовлення, придбання, продаж, зберігання наркотичних засобів'},
    {code:'7.2', title:'Незаконне вживання наркотичних засобів'},
    {code:'7.3', title:'Схиляння до вживання наркотичних засобів'},
    {code:'7.4', title:'Організація або утримання місць для незаконного вживання наркотиків'},
    {code:'7.5', title:'Примушування до вживання наркотичних засобів'},
    {code:'7.6', title:'Незаконний обіг алкоголю'},
    {code:'7.7', title:'Продаж алкоголю неповнолітнім'},
    {code:'8.1', title:'Посягання на життя державного діяча'},
    {code:'8.2', title:'Збройний заколот'},
    {code:'8.3', title:'Публічні заклики до екстремістської діяльності'},
    {code:'8.4', title:'Перевищення посадових повноважень'},
    {code:'8.5', title:'Нецільове витрачання бюджетних коштів'},
    {code:'8.6', title:'Привласнення повноважень посадової особи'},
    {code:'8.7', title:'Одержання хабара'},
    {code:'8.8', title:'Давання хабара'},
    {code:'9.1', title:'Перешкоджання здійсненню правосуддя'},
    {code:'9.2', title:'Незаконне порушення кримінальної справи'},
    {code:'9.3', title:'Незаконне звільнення від кримінальної відповідальності'},
    {code:'9.4', title:'Незаконні затримання, взяття під варту, арешт'},
    {code:'9.5', title:'Завідомо неправдивий донос і неправдиві показання'},
    {code:'9.6', title:'Невиконання або неналежне виконання законного рішення'},
    {code:'9.6.1', title:'Невиконання вироку суду'},
    {code:'9.6.2', title:'Введення в оману суду'},
    {code:'9.7', title:'Підробка документів'},
    {code:'9.7.1', title:'Приховування злочинів'},
    {code:'9.8', title:'Втеча з місця позбавлення волі'},
    {code:'9.8.1', title:'Втеча від погоні'},
    {code:'9.9', title:'Несплата штрафів'},
    {code:'10.1', title:'Посягання на життя співробітника правоохоронного органу'},
    {code:'10.2', title:'Застосування насильства щодо представника влади'},
    {code:'10.3', title:'Образа представника державної організації'},
    {code:'10.4', title:'Провокація співробітника державної організації'},
    {code:'10.5', title:'Перешкода співробітникам правоохоронних органів'},
    {code:'10.6', title:'Самовільне привласнення повноважень представника влади'},
    {code:'10.7', title:'Перешкода транспортному засобу з проблисковими маячками'},
    {code:'10.8', title:'Здійснення нападу на колону'},
    {code:'10.9', title:'Непідкорення співробітнику правоохоронних органів'},
    {code:'10.10', title:'Непокора поліцейському під час надзвичайного стану'},
    {code:'10.11', title:'Втеча під час затримання'},
    {code:'11.1', title:'Невиконання військового наказу'},
    {code:'11.2', title:'Опір начальнику або примушування його до порушення обов’язків'},
    {code:'11.3', title:'Образа військовослужбовця'},
    {code:'11.4', title:'Самовільне залишення частини або місця служби'},
    {code:'11.5', title:'Дезертирство'},
    {code:'11.6', title:'Умисне знищення або пошкодження військового майна'},
    {code:'11.7', title:'Дії, що загрожують національній безпеці'},
    {code:'11.8', title:'Уникнення призову'}
  ];

  const seedCases = [
    {id:'KP-2026-0001',author:'Det. Pravda / ID 542',suspect:'Nick_Red / ID 311',article:'5.10 — Хуліганство',evidence:'https://example.com',summary:'Порушник вчинив напад та зірвав процесуальні дії співробітників.',status:'court',createdAt:'19.04.2026, 01:30:00'},
    {id:'KP-2026-0002',author:'SBU Oper / ID 618',suspect:'Gun_Dealer / ID 992',article:'5.13 — Незаконне придбання, передача, виготовлення зброї та боєприпасів',evidence:'https://example.com',summary:'На центральному ринку вилучено зброю та набої під час перевірки.',status:'opened',createdAt:'19.04.2026, 01:35:00'},
    {id:'KP-2026-0003',author:'Prosecutor / ID 119',suspect:'Fake_Officer / ID 221',article:'10.6 — Самовільне привласнення повноважень представника влади',evidence:'https://example.com',summary:'Підозрюваний незаконно представлявся працівником державного органу.',status:'rejected',createdAt:'19.04.2026, 01:42:00'},
    {id:'KP-2026-0004',author:'Det. Viter / ID 771',suspect:'Fraud_Master / ID 543',article:'4.4 — Шахрайство',evidence:'https://example.com',summary:'Громадянин отримав кошти та зник, не виконавши домовленості.',status:'closed',createdAt:'19.04.2026, 01:48:00'},
    {id:'KP-2026-0005',author:'Det. North / ID 188',suspect:'Street_Wolf / ID 410',article:'4.2 — Грабіж',evidence:'https://example.com',summary:'Пограбування громадянина біля банкомата.',status:'new',createdAt:'19.04.2026, 01:53:00'},
    {id:'KP-2026-0006',author:'SBU Delta / ID 250',suspect:'Corrupt_Man / ID 771',article:'8.7 — Одержання хабара',evidence:'https://example.com',summary:'Отримання неправомірної вигоди посадовою особою.',status:'court',createdAt:'19.04.2026, 01:57:00'},
    {id:'KP-2026-0007',author:'Det. River / ID 321',suspect:'Night_Racer / ID 991',article:'6.3 — Створення ДТП',evidence:'https://example.com',summary:'Порушення призвело до аварійної ситуації з потерпілими.',status:'opened',createdAt:'19.04.2026, 02:02:00'},
    {id:'KP-2026-0008',author:'Prosecutor / ID 531',suspect:'Fake_Doc / ID 147',article:'9.7 — Підробка документів',evidence:'https://example.com',summary:'Використання підроблених документів при перевірці.',status:'closed',createdAt:'19.04.2026, 02:08:00'},
    {id:'KP-2026-0009',author:'Det. West / ID 901',suspect:'Chaos_Boy / ID 654',article:'5.11 — Вандалізм',evidence:'https://example.com',summary:'Пошкодження державного майна в центрі міста.',status:'new',createdAt:'19.04.2026, 02:13:00'},
    {id:'KP-2026-0010',author:'SBU Oper / ID 222',suspect:'Dealer_One / ID 515',article:'7.1 — Незаконне виготовлення, придбання, продаж, зберігання наркотичних засобів',evidence:'https://example.com',summary:'Виявлено зберігання та збут заборонених речовин.',status:'opened',createdAt:'19.04.2026, 02:18:00'}
  ];

  const state = {
    cases: seedCases.slice(),
    audit: [{action:'Систему запущено', detail: isSupabaseConfigured ? 'Дані завантажуються зі спільної бази Supabase' : 'Локальний демо-режим: 10 фіксованих КП (Supabase не підключено)', time:'—'}]
  };

  const icons = {
    total:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4"/><path d="M9 3v6h6"/><path d="M21 3l-9 9"/><path d="M21 3h-6"/><path d="M21 3v6"/></svg>',
    active:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/></svg>',
    court:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3"/><path d="M4 10h16"/><path d="M6 10l-2 6h6l-2-6"/><path d="M18 10l-2 6h6l-2-6"/><path d="M4 21h16"/><path d="M9 21V13h6v8"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
    empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/><path d="M8 15h8"/><path d="M8 4h8l2 3H6z"/></svg>'
  };

  function badgeClass(status){
    return ({new:'badge-new',opened:'badge-opened',court:'badge-court',closed:'badge-closed',rejected:'badge-rejected'})[status] || 'badge-new';
  }

  function statusLabel(status){
    return ({new:'Нове',opened:'Відкрито',court:'В суді',closed:'Закрито',rejected:'Відхилено'})[status] || status;
  }

  function escapeHtml(value){
    return String(value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function renderEvidence(value){
    const safe = escapeHtml(value || 'Не вказано');
    const raw = String(value || '').trim();
    if(/^https?:\/\//i.test(raw)) return `<a href="${escapeHtml(raw)}" target="_blank" rel="noopener noreferrer">Матеріали справи</a>`;
    return `<span>${safe}</span>`;
  }

  const nextStepMap = {
    new:[{to:'opened',label:'Відкрити провадження',icon:'arrow'},{to:'rejected',label:'Відхилити',icon:'x',danger:true}],
    opened:[{to:'court',label:'Передати до суду',icon:'arrow'},{to:'rejected',label:'Відхилити',icon:'x',danger:true}],
    court:[{to:'closed',label:'Закрити справу',icon:'check'},{to:'rejected',label:'Відхилити',icon:'x',danger:true}]
  };

  function renderRecord(item, opts){
    opts = opts || {};
    const withActions = opts.withActions !== false;
    const steps = withActions ? (nextStepMap[item.status] || []) : [];
    const stepButtons = steps.map(step => `<button type="button" data-case-transition="${escapeHtml(item.id)}|${step.to}" class="${step.danger ? 'is-danger' : ''}">${icons[step.icon]}${step.label}</button>`).join('');
    return `
      <article class="record-card s-${item.status}">
        <div class="record-top">
          <strong>${escapeHtml(item.id)}</strong>
          <span class="record-badge ${badgeClass(item.status)}"><i></i>${statusLabel(item.status)}</span>
        </div>
        <div class="record-article">${escapeHtml(item.article)}</div>
        ${statusStepper(item.status)}
        <div class="record-meta"><span><b>Автор:</b> ${escapeHtml(item.author)}</span><span><b>Підозрюваний:</b> ${escapeHtml(item.suspect)}</span></div>
        <div class="record-meta"><span><b>Створено:</b> ${escapeHtml(item.createdAt)}</span><span><b>Матеріали:</b> ${renderEvidence(item.evidence)}</span></div>
        <p>${escapeHtml(item.summary)}</p>
        <div class="record-actions">
          <button type="button" data-copy-id="${escapeHtml(item.id)}">${icons.copy}Копіювати ID</button>
          ${stepButtons}
        </div>
      </article>`;
  }

  function emptyState(text){
    return `<div class="empty-state">${icons.empty}<span>${escapeHtml(text)}</span></div>`;
  }

  const stepOrder = ['new','opened','court','closed'];
  const stepTitles = {new:'Нове', opened:'Відкрито', court:'В суді', closed:'Закрито'};

  function statusStepper(status){
    if(status === 'rejected'){
      return `<div class="status-stepper is-rejected">${stepOrder.map(() => `<span class="step is-filled" title="Відхилено"></span>`).join('')}</div>`;
    }
    const idx = stepOrder.indexOf(status);
    return `<div class="status-stepper">${stepOrder.map((s,i) => `<span class="step ${i<=idx?'is-filled':''}" title="${stepTitles[s]}"></span>`).join('')}</div>`;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el, target){
    if(!el) return;
    const from = parseInt(el.textContent, 10) || 0;
    if(from === target || reduceMotion){ el.textContent = target; return; }
    const duration = 700;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function totals(){
    return {
      total: state.cases.length,
      active: state.cases.filter(c => ['new','opened','court'].includes(c.status)).length,
      archive: state.cases.filter(c => ['closed','rejected'].includes(c.status)).length,
      court: state.cases.filter(c => c.status === 'court').length
    };
  }

  function bindGlobalActions(root){
    root.addEventListener('click', async e => {
      const copyBtn = e.target.closest('[data-copy-id]');
      if(copyBtn){
        const id = copyBtn.dataset.copyId;
        try{
          await navigator.clipboard.writeText(id);
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = icons.check + 'Скопійовано';
          setTimeout(() => { copyBtn.innerHTML = original; }, 1400);
        }catch(err){ /* clipboard unavailable, ignore */ }
        return;
      }
      const transitionBtn = e.target.closest('[data-case-transition]');
      if(transitionBtn){
        const [id, to] = transitionBtn.dataset.caseTransition.split('|');
        await updateCaseStatus(id, to);
      }
    });
  }

  async function updateCaseStatus(id, newStatus){
    const item = state.cases.find(c => c.id === id);
    if(!item) return;
    item.status = newStatus;
    if(supabaseClient && item._rowId != null){
      await supabaseClient.from('cases').update({status:newStatus}).eq('id', item._rowId);
    }
    state.audit.unshift({action:`Статус змінено: ${id}`, detail:`Новий статус — «${statusLabel(newStatus)}»`, time:new Date().toLocaleString('uk-UA')});
    renderAll();
  }

  function renderHome(){
    const totalEl = document.getElementById('homeTotalStat');
    if(!totalEl) return;
    const stats = totals();
    animateCount(document.getElementById('homeTotalStat'), stats.total);
    animateCount(document.getElementById('homeActiveStat'), stats.active);
    animateCount(document.getElementById('homeArchiveStat'), stats.archive);
    animateCount(document.getElementById('homeCourtStat'), stats.court);
    animateCount(document.getElementById('homeTotalPreview'), stats.total);
    animateCount(document.getElementById('homeActivePreview'), stats.active);
    animateCount(document.getElementById('homeArchivePreview'), stats.archive);

    const donut = document.getElementById('homeDonut');
    if(donut && stats.total){
      const pct = Math.round((stats.active / stats.total) * 100);
      donut.style.setProperty('--p', pct);
    }

    const previewList = document.getElementById('homePreviewList');
    previewList.innerHTML = state.cases.slice(0,3).map(item => `<article><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.article.split(' — ')[0])}</span></article>`).join('');

    const sparkline = document.getElementById('homeSparkline');
    if(sparkline){
      const bucketCount = Math.min(8, state.cases.length) || 1;
      const size = Math.ceil(state.cases.length / bucketCount) || 1;
      const buckets = [];
      for(let i = 0; i < state.cases.length; i += size) buckets.push(state.cases.slice(i, i + size).length);
      const max = Math.max(1, ...buckets);
      sparkline.innerHTML = buckets.map(count => `<div class="bar" data-height="${Math.round((count / max) * 100)}"></div>`).join('');
      requestAnimationFrame(() => {
        sparkline.querySelectorAll('.bar').forEach(bar => { bar.style.height = bar.dataset.height + '%'; });
      });
    }
  }

  function renderArticlePicker(){
    const root = document.querySelector('[data-article-picker]');
    if(!root) return;
    const trigger = document.getElementById('articlePickerTrigger');
    const panel = document.getElementById('articlePickerPanel');
    const search = document.getElementById('articleSearch');
    const list = document.getElementById('articlePickerList');
    const hidden = document.getElementById('article');
    const label = trigger.querySelector('.article-picker-label');
    let activeIndex = 0;
    let filtered = articleCatalog.slice();

    function renderList(){
      if(!filtered.length){
        list.innerHTML = '<div class="article-picker-empty">Нічого не знайдено. Спробуй інший номер або назву.</div>';
        return;
      }
      list.innerHTML = filtered.map((item, index) => `
        <button type="button" class="article-option ${index === activeIndex ? 'is-active' : ''}" data-article-value="${escapeHtml(item.code + ' — ' + item.title)}">
          <strong>${escapeHtml(item.code)}</strong>
          <span>${escapeHtml(item.title)}</span>
        </button>
      `).join('');
    }

    function openPanel(){
      panel.hidden = false;
      trigger.setAttribute('aria-expanded','true');
      trigger.classList.add('is-open');
      search.focus();
      renderList();
    }

    function closePanel(){
      panel.hidden = true;
      trigger.setAttribute('aria-expanded','false');
      trigger.classList.remove('is-open');
    }

    function choose(value){
      hidden.value = value;
      label.textContent = value;
      label.classList.remove('is-placeholder');
      closePanel();
    }

    function filter(){
      const q = search.value.trim().toLowerCase();
      filtered = articleCatalog.filter(item => `${item.code} ${item.title}`.toLowerCase().includes(q));
      activeIndex = 0;
      renderList();
    }

    trigger.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
    search.addEventListener('input', filter);

    search.addEventListener('keydown', e => {
      if(!filtered.length) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); renderList(); }
      if(e.key === 'ArrowUp'){ e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderList(); }
      if(e.key === 'Enter'){ e.preventDefault(); const item = filtered[activeIndex]; if(item) choose(`${item.code} — ${item.title}`); }
      if(e.key === 'Escape'){ closePanel(); }
    });

    list.addEventListener('click', e => {
      const btn = e.target.closest('[data-article-value]');
      if(!btn) return;
      choose(btn.dataset.articleValue);
    });

    document.addEventListener('click', e => {
      if(!root.contains(e.target)) closePanel();
    });

    renderList();
  }

  function renderRegistry(){
    const list = document.getElementById('registryList');
    if(!list) return;
    const resultInfo = document.getElementById('resultInfo');
    const statTotal = document.getElementById('statTotal');
    const statNew = document.getElementById('statNew');
    const statCourt = document.getElementById('statCourt');
    const statArchive = document.getElementById('statArchive');
    let filter = document.querySelector('[data-registry-filter].active')?.dataset.registryFilter || 'all';

    function draw(){
      const active = state.cases.filter(c => ['new','opened','court'].includes(c.status));
      const shown = active.filter(c => filter === 'all' ? true : c.status === filter).slice().reverse();
      list.innerHTML = shown.length ? shown.map(item => renderRecord(item)).join('') : emptyState('Немає записів для цього фільтра.');
      resultInfo.textContent = `${shown.length} записів`;
      animateCount(statTotal, state.cases.length);
      animateCount(statNew, state.cases.filter(c => c.status === 'new').length);
      animateCount(statCourt, state.cases.filter(c => ['opened','court'].includes(c.status)).length);
      animateCount(statArchive, state.cases.filter(c => ['closed','rejected'].includes(c.status)).length);
    }

    draw();
    list._draw = draw;

    document.querySelectorAll('[data-registry-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-registry-filter]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.registryFilter;
        draw();
      });
    });

    const form = document.getElementById('caseForm');
    if(form){
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const payload = {
          author: document.getElementById('author').value.trim(),
          suspect: document.getElementById('suspect').value.trim(),
          article: document.getElementById('article').value.trim(),
          evidence: document.getElementById('evidence').value.trim(),
          summary: document.getElementById('summary').value.trim(),
          status: 'new'
        };
        if(!supabaseClient){
          alert('Supabase ще не підключено: дивись SUPABASE.md, щоб нові КП зберігались у спільній базі для всіх співробітників. Зараз запис додається лише тимчасово, у пам’яті цієї вкладки.');
          state.cases.push({...payload, id:`KP-LOCAL-${state.cases.length+1}`, createdAt:new Date().toLocaleString('uk-UA')});
          state.audit.unshift({action:'Нове КП (локально)', detail:`${payload.author} → ${payload.suspect}`, time:new Date().toLocaleString('uk-UA')});
          form.reset();
          document.querySelector('.article-picker-label').textContent = 'Оберіть статтю або скористайтесь пошуком';
          document.querySelector('.article-picker-label').classList.add('is-placeholder');
          renderAll();
          return;
        }
        submitBtn.disabled = true;
        const { data, error } = await supabaseClient.from('cases').insert(payload).select().single();
        submitBtn.disabled = false;
        if(error){ alert('Не вдалося зберегти КП у Supabase: ' + error.message); return; }
        form.reset();
        document.querySelector('.article-picker-label').textContent = 'Оберіть статтю або скористайтесь пошуком';
        document.querySelector('.article-picker-label').classList.add('is-placeholder');
        await loadFromSupabase();
        renderAll();
      });
    }
  }

  function renderAudit(){
    const log = document.getElementById('auditLog');
    if(!log) return;
    log.innerHTML = state.audit.length ? state.audit.slice(0,10).map(item => `<article class="audit-item"><strong>${escapeHtml(item.action)}</strong><div>${escapeHtml(item.detail)}</div><div>${escapeHtml(item.time)}</div></article>`).join('') : emptyState('Журнал поки порожній.');
  }

  function renderSearch(){
    const list = document.getElementById('searchResults');
    if(!list) return;
    const info = document.getElementById('searchResultInfo');
    const q = document.getElementById('searchQuery');
    const status = document.getElementById('searchStatus');
    const article = document.getElementById('searchArticle');
    const author = document.getElementById('searchAuthor');

    function draw(){
      const results = state.cases.filter(item => {
        const hay = `${item.id} ${item.author} ${item.suspect} ${item.article} ${item.summary}`.toLowerCase();
        if(q.value.trim() && !hay.includes(q.value.trim().toLowerCase())) return false;
        if(status.value !== 'all' && item.status !== status.value) return false;
        if(article.value.trim() && !item.article.toLowerCase().includes(article.value.trim().toLowerCase())) return false;
        if(author.value.trim() && !item.author.toLowerCase().includes(author.value.trim().toLowerCase())) return false;
        return true;
      }).slice().reverse();
      list.innerHTML = results.length ? results.map(item => renderRecord(item, {withActions:false})).join('') : emptyState('Нічого не знайдено за заданими параметрами.');
      info.textContent = `${results.length} записів`;
    }

    [q,status,article,author].forEach(el => el.addEventListener('input', draw));
    draw();
    list._draw = draw;
  }

  function renderArchive(){
    const list = document.getElementById('archiveList');
    if(!list) return;
    const info = document.getElementById('archiveInfo');
    let filter = document.querySelector('[data-archive-filter].active')?.dataset.archiveFilter || 'all';

    function draw(){
      const items = state.cases.filter(c => ['closed','rejected'].includes(c.status)).filter(c => filter === 'all' ? true : c.status === filter).slice().reverse();
      list.innerHTML = items.length ? items.map(item => renderRecord(item, {withActions:false})).join('') : emptyState('Архів порожній для цього фільтра.');
      info.textContent = `${items.length} записів`;
    }

    document.querySelectorAll('[data-archive-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-archive-filter]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        filter = btn.dataset.archiveFilter;
        draw();
      });
    });
    draw();
    list._draw = draw;
  }

  function markCurrentNav(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(a => {
      const href = a.getAttribute('href').replace('./','');
      if(href === path) a.classList.add('is-current');
    });
  }

  function setupScrollReveal(){
    const targets = document.querySelectorAll('.reveal');
    if(!targets.length) return;
    if(reduceMotion || !('IntersectionObserver' in window)){
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.15});
    targets.forEach(el => observer.observe(el));
  }

  function setupHeroTilt(){
    const card = document.querySelector('.hero-card');
    if(!card || reduceMotion) return;
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.classList.add('is-tilting');
      card.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  }

  function renderAll(){
    renderHome();
    renderRegistry();
    renderAudit();
    renderSearch();
    renderArchive();
  }

  async function loadFromSupabase(){
    if(!supabaseClient) return;
    const { data, error } = await supabaseClient.from('cases').select('*').order('id', {ascending:true});
    if(error){ console.error('Supabase load error:', error.message); return; }
    state.cases = (data || []).map(row => ({
      _rowId: row.id,
      id: `KP-${new Date(row.created_at).getFullYear()}-${String(row.id).padStart(4,'0')}`,
      author: row.author,
      suspect: row.suspect,
      article: row.article,
      evidence: row.evidence,
      summary: row.summary,
      status: row.status,
      createdAt: new Date(row.created_at).toLocaleString('uk-UA')
    }));
    state.audit.unshift({action:'Дані синхронізовано', detail:`Завантажено ${state.cases.length} КП зі спільної бази Supabase`, time:new Date().toLocaleString('uk-UA')});
  }

  async function init(){
    markCurrentNav();
    bindGlobalActions(document.body);
    if(supabaseClient){
      await loadFromSupabase();
      supabaseClient
        .channel('cases-changes')
        .on('postgres_changes', {event:'*', schema:'public', table:'cases'}, async () => {
          await loadFromSupabase();
          renderAll();
        })
        .subscribe();
    }
    renderAll();
    renderArticlePicker();
    setupScrollReveal();
    setupHeroTilt();
  }

  init();
})();
