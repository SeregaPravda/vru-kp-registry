/* Data layer: Supabase client, auth, and CRUD for cases/materials/audit. */
window.KP = window.KP || {};

(function(){
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
  const isConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;
  const supabase = (isConfigured && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  const STATUS_ORDER = ['new','review','opened','court','closed','rejected'];
  const STATUS_LABEL = {new:'Нове', review:'На перевірці', opened:'Відкрито', court:'У суді', closed:'Закрито', rejected:'Відхилено'};
  const STATUS_ACCENT = {new:'blue', review:'amber', opened:'purple', court:'orange', closed:'green', rejected:'red'};

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
    {code:'2.1', title:'Викрадення людини'},
    {code:'2.2', title:'Незаконне позбавлення волі'},
    {code:'3.3', title:'Порушення недоторканності житла'},
    {code:'4.1', title:'Крадіжка'},
    {code:'4.2', title:'Грабіж'},
    {code:'4.3', title:'Напад на інкасацію'},
    {code:'4.4', title:'Шахрайство'},
    {code:'4.5', title:'Вимагання'},
    {code:'4.6', title:'Умисне знищення або пошкодження майна'},
    {code:'4.7', title:'Крадіжка авто (незаконне заволодіння транспортним засобом)'},
    {code:'5.1', title:'Терористичний акт'},
    {code:'5.6', title:'Бандитизм'},
    {code:'5.9', title:'Масові заворушення'},
    {code:'5.10', title:'Хуліганство'},
    {code:'5.11', title:'Вандалізм'},
    {code:'5.13', title:'Незаконне придбання, передача, виготовлення зброї та боєприпасів'},
    {code:'5.14', title:'Незаконне використання або носіння зброї'},
    {code:'6.1', title:'Порушення правил дорожнього руху, що спричинило тяжку шкоду здоров’ю'},
    {code:'6.3', title:'Створення ДТП'},
    {code:'7.1', title:'Незаконне виготовлення, придбання, продаж, зберігання наркотичних засобів'},
    {code:'7.6', title:'Незаконний обіг алкоголю'},
    {code:'8.4', title:'Перевищення посадових повноважень'},
    {code:'8.7', title:'Одержання хабара'},
    {code:'8.8', title:'Давання хабара'},
    {code:'9.1', title:'Перешкоджання здійсненню правосуддя'},
    {code:'9.7', title:'Підробка документів'},
    {code:'9.8', title:'Втеча з місця позбавлення волі'},
    {code:'10.1', title:'Посягання на життя співробітника правоохоронного органу'},
    {code:'10.6', title:'Самовільне привласнення повноважень представника влади'},
    {code:'10.9', title:'Непідкорення співробітнику правоохоронних органів'},
    {code:'11.4', title:'Самовільне залишення частини або місця служби'},
    {code:'11.5', title:'Дезертирство'}
  ];

  const quickArticles = [
    {code:'5.10', title:'Хуліганство'},
    {code:'4.2', title:'Грабіж'},
    {code:'8.7', title:'Одержання хабара'},
    {code:'5.13', title:'Незаконна зброя'}
  ];

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function formatDate(iso){
    if(!iso) return '—';
    try{ return new Date(iso).toLocaleString('uk-UA', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'}); }
    catch(e){ return iso; }
  }

  function timeAgo(iso){
    if(!iso) return '';
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.round(diffMs / 60000);
    if(min < 1) return 'щойно';
    if(min < 60) return `${min} хв тому`;
    const hrs = Math.round(min / 60);
    if(hrs < 24) return `${hrs} год тому`;
    const days = Math.round(hrs / 24);
    return `${days} дн тому`;
  }

  function caseCode(row){
    const year = row.created_at ? new Date(row.created_at).getFullYear() : new Date().getFullYear();
    return `КП-${year}-${String(row.id).padStart(4,'0')}`;
  }

  /* ---------------- Auth ---------------- */
  let currentUser = null; // {role, displayName, permissions}
  const authListeners = [];

  function notifyAuthChange(){ authListeners.forEach(fn => fn(currentUser)); }

  function onAuthChange(fn){ authListeners.push(fn); if(currentUser !== undefined) fn(currentUser); }

  async function ensureAnonymousSession(){
    if(!supabase) return null;
    const { data } = await supabase.auth.getSession();
    if(data && data.session) return data.session;
    const { data: signInData, error } = await supabase.auth.signInAnonymously();
    if(error){ console.error('Anonymous sign-in failed:', error.message); return null; }
    return signInData.session;
  }

  async function restoreRole(){
    if(!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData && userData.user ? userData.user.id : null;
    if(!uid) return;
    const { data, error } = await supabase.from('user_roles').select('role,display_name,permissions').eq('user_id', uid).maybeSingle();
    if(error || !data) return;
    currentUser = { role: data.role, displayName: data.display_name, permissions: data.permissions || [] };
    notifyAuthChange();
  }

  async function login(code){
    if(!supabase) throw new Error('Supabase не підключено. Дивись SUPABASE.md.');
    await ensureAnonymousSession();
    const { data, error } = await supabase.rpc('redeem_access_code', { p_code: code });
    if(error){ throw new Error(error.message.includes('invalid_code') ? 'Невірний код доступу' : error.message); }
    currentUser = { role: data.role, displayName: data.displayName, permissions: data.permissions || [] };
    notifyAuthChange();
    return currentUser;
  }

  function logout(){
    currentUser = null;
    notifyAuthChange();
  }

  function hasPermission(p){
    return !!(currentUser && currentUser.permissions && currentUser.permissions.includes(p));
  }

  /* ---------------- Cases ---------------- */
  let cases = [];
  let materialsByCase = {};
  let auditLog = [];
  const dataListeners = [];
  function onDataChange(fn){ dataListeners.push(fn); }
  function notifyDataChange(){ dataListeners.forEach(fn => fn()); }

  function mapCaseRow(row){
    return {
      rowId: row.id,
      id: caseCode(row),
      author: row.author,
      suspect: row.suspect,
      article: row.article,
      shortDescription: row.short_description || row.summary || '',
      fullDescription: row.full_description || '',
      evidence: row.evidence,
      notes: row.notes,
      responsible: row.responsible,
      status: row.status,
      decision: row.decision,
      closedBy: row.closed_by,
      closedAt: row.closed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async function loadCases(){
    if(!supabase){ cases = []; notifyDataChange(); return; }
    const { data, error } = await supabase.from('cases').select('*').order('id', {ascending:false});
    if(error){ console.error('loadCases error:', error.message); return; }
    cases = (data || []).map(mapCaseRow);
    notifyDataChange();
  }

  async function loadAudit(caseRowId){
    if(!supabase) return [];
    let query = supabase.from('audit_log').select('*').order('created_at', {ascending:false}).limit(50);
    if(caseRowId != null) query = query.eq('case_id', caseRowId);
    const { data, error } = await query;
    if(error){ console.error('loadAudit error:', error.message); return []; }
    return data || [];
  }

  async function loadMaterials(caseRowId){
    if(!supabase) return [];
    const { data, error } = await supabase.from('case_materials').select('*').eq('case_id', caseRowId).order('created_at', {ascending:false});
    if(error){ console.error('loadMaterials error:', error.message); return []; }
    return data || [];
  }

  async function loadComments(caseRowId){
    if(!supabase) return [];
    const { data, error } = await supabase.from('case_comments').select('*').eq('case_id', caseRowId).order('created_at', {ascending:true});
    if(error){ console.error('loadComments error:', error.message); return []; }
    return data || [];
  }

  async function addComment(rowId, body){
    if(!supabase) throw new Error('Supabase не підключено.');
    if(!currentUser) throw new Error('Потрібно увійти в систему, щоб залишити коментар.');
    const { error } = await supabase.from('case_comments').insert({
      case_id: rowId, author: currentUser.displayName, body
    });
    if(error) throw new Error(error.message);
  }

  async function createCase(payload){
    if(!supabase) throw new Error('Supabase не підключено. Дивись SUPABASE.md.');
    const { data, error } = await supabase.from('cases').insert({
      author: payload.author, suspect: payload.suspect, article: payload.article,
      short_description: payload.shortDescription, full_description: payload.fullDescription || null,
      evidence: payload.evidence || null, notes: payload.notes || null, status: 'new'
    }).select().single();
    if(error) throw new Error(error.message);
    await loadCases();
    return mapCaseRow(data);
  }

  async function updateCaseStatus(rowId, newStatus){
    if(!supabase) throw new Error('Supabase не підключено.');
    const patch = { status: newStatus };
    if(['closed','rejected'].includes(newStatus)){
      patch.closed_by = currentUser ? currentUser.displayName : null;
      patch.closed_at = new Date().toISOString();
    }
    const { error } = await supabase.from('cases').update(patch).eq('id', rowId);
    if(error) throw new Error(error.message);
    await loadCases();
  }

  async function assignResponsible(rowId, name){
    if(!supabase) throw new Error('Supabase не підключено.');
    const { error } = await supabase.from('cases').update({ responsible: name }).eq('id', rowId);
    if(error) throw new Error(error.message);
    await loadCases();
  }

  async function setDecision(rowId, decision){
    if(!supabase) throw new Error('Supabase не підключено.');
    const { error } = await supabase.from('cases').update({ decision }).eq('id', rowId);
    if(error) throw new Error(error.message);
    await loadCases();
  }

  async function addMaterial(rowId, material){
    if(!supabase) throw new Error('Supabase не підключено.');
    const { error } = await supabase.from('case_materials').insert({
      case_id: rowId, title: material.title, kind: material.kind, url: material.url,
      added_by: currentUser ? currentUser.displayName : 'Гість'
    });
    if(error) throw new Error(error.message);
  }

  function subscribeRealtime(onChange){
    if(!supabase) return () => {};
    const channel = supabase.channel('kp-live-changes')
      .on('postgres_changes', {event:'*', schema:'public', table:'cases'}, onChange)
      .on('postgres_changes', {event:'*', schema:'public', table:'case_materials'}, onChange)
      .on('postgres_changes', {event:'*', schema:'public', table:'audit_log'}, onChange)
      .on('postgres_changes', {event:'*', schema:'public', table:'case_comments'}, onChange)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }

  window.KP.data = {
    isConfigured, supabase,
    STATUS_ORDER, STATUS_LABEL, STATUS_ACCENT,
    articleCatalog, quickArticles,
    escapeHtml, formatDate, timeAgo, caseCode,
    onAuthChange, ensureAnonymousSession, restoreRole, login, logout, hasPermission,
    getCurrentUser: () => currentUser,
    getCases: () => cases,
    onDataChange, loadCases, loadAudit, loadMaterials, loadComments,
    createCase, updateCaseStatus, assignResponsible, setDecision, addMaterial, addComment,
    subscribeRealtime
  };
})();
