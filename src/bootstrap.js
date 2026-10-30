// Keep this entry free of static dependencies: failures must reach the error UI.
export async function startApplication({document:doc=globalThis.document,loadMain=()=>import('./main.js'),reportError=console.error}={}) {
  const loading=doc.getElementById('appLoading');
  const banner=doc.getElementById('appError');
  const workspace=doc.getElementById('appWorkspace');
  doc.documentElement.dataset.appReady='loading';
  workspace.inert=true;
  workspace.setAttribute('aria-busy','true');
  loading.hidden=false;
  banner.hidden=true;
  try {
    const main=await loadMain();
    main.start();
    doc.documentElement.dataset.appReady='true';
    workspace.inert=false;
    workspace.setAttribute('aria-busy','false');
    loading.hidden=true;
    return true;
  } catch(error) {
    doc.documentElement.dataset.appReady='error';
    doc.getElementById('appErrorMessage').textContent='图谱加载或初始化失败，当前结果不可用。请检查本地连接后刷新重试。';
    loading.hidden=true;
    banner.hidden=false;
    reportError(error);
    return false;
  }
}
