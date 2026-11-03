// Keep this entry free of static dependencies: failures must reach the error UI.
const starts=new WeakMap();
const clock=()=>globalThis.performance?.now?.()??Date.now();
const round=value=>Math.round(Math.max(0,value)*100)/100;

export function startApplication({document:doc=globalThis.document,loadMain=()=>import('./main.js'),reportError=console.error,
  now=clock,setTimer=globalThis.setTimeout,clearTimer=globalThis.clearTimeout,
  reload=()=>doc.defaultView?.location.reload(),performance=globalThis.performance}={}) {
  if(starts.has(doc))return starts.get(doc);
  const task=Promise.resolve().then(()=>initialize({doc,loadMain,reportError,now,setTimer,clearTimer,reload,performance}));
  starts.set(doc,task);
  return task;
}

async function initialize({doc,loadMain,reportError,now,setTimer,clearTimer,reload,performance}) {
  const loading=doc.getElementById('appLoading');
  const banner=doc.getElementById('appError');
  const workspace=doc.getElementById('appWorkspace');
  const dataset=doc.documentElement.dataset;
  const started=now();
  let imported=null,reloadButton=null;
  const mark=name=>{try{performance?.mark?.(name);}catch{/* Diagnostics must not prevent startup. */}};
  const recordTiming=()=>{
    const finished=now();
    dataset.appStartupMs=String(round(finished-started));
    if(imported!==null){dataset.appImportMs=String(round(imported-started));dataset.appInitMs=String(round(finished-imported));}
    if(dataset.appReady==='true'&&now===clock&&Number.isFinite(performance?.timeOrigin))dataset.appNavigationReadyMs=String(round(finished));
  };
  doc.documentElement.dataset.appReady='loading';
  dataset.appStage='loading-main';
  delete dataset.appFailedStage;delete dataset.appStartupMs;delete dataset.appImportMs;delete dataset.appInitMs;delete dataset.appNavigationReadyMs;
  workspace.inert=true;
  workspace.setAttribute('aria-busy','true');
  loading.textContent='正在加载图谱与来源数据…';
  loading.hidden=false;
  banner.hidden=true;
  mark('yb171:startup-start');
  const timers=[
    setTimer(()=>{if(dataset.appReady==='loading')loading.textContent='仍在加载图谱与来源数据，请稍候…';},5000),
    setTimer(()=>{
      if(dataset.appReady!=='loading'||typeof doc.createElement!=='function'||typeof loading.append!=='function')return;
      reloadButton=doc.createElement('button');reloadButton.type='button';reloadButton.className='startup-reload';
      reloadButton.textContent='重新加载';reloadButton.addEventListener('click',reload);
      loading.append(' ',reloadButton);
    },15000)
  ];
  try {
    const main=await loadMain();
    imported=now();dataset.appStage='initializing';mark('yb171:main-imported');
    await main.start();
    doc.documentElement.dataset.appReady='true';
    dataset.appStage='ready';
    workspace.inert=false;
    workspace.setAttribute('aria-busy','false');
    loading.hidden=true;
    recordTiming();mark('yb171:ready');
    try{performance?.measure?.('yb171:startup','yb171:startup-start','yb171:ready');}catch{/* Optional performance entry only. */}
    return true;
  } catch(error) {
    dataset.appFailedStage=dataset.appStage;dataset.appStage='error';
    doc.documentElement.dataset.appReady='error';
    doc.getElementById('appErrorMessage').textContent='图谱加载或初始化失败，当前结果不可用。请检查本地连接后刷新重试。';
    loading.hidden=true;
    banner.hidden=false;
    recordTiming();mark('yb171:startup-error');
    reportError(error);
    return false;
  } finally {
    timers.forEach(timer=>clearTimer(timer));
    reloadButton?.remove();
    if(dataset.appReady!=='true')starts.delete(doc);
  }
}
