/* Bootstraps auth session + realtime sync on every page. Load last, after page-specific scripts. */
(function(){
  const data = window.KP.data;

  async function boot(){
    if(data.isConfigured){
      await data.ensureAnonymousSession();
      await data.restoreRole();
      data.subscribeRealtime(() => { data.loadCases(); });
    }
    await data.loadCases();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
