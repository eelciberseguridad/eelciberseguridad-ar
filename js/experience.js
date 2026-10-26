/* EEL CIBERSEGURIDAD AR V2 | MindAR 1.2.5 + A-Frame 1.5.0 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const scene = $('arScene');
  const target = $('eelTarget');
  const start = $('startBtn');
  const intro = $('startup');
  const chrome = $('arChrome');
  const status = $('statusText');
  const light = $('statusLight');
  const warning = $('setupWarning');
  let active = false;
  let timers = [];
  let system = null;
  let starting = false;
  const notices = { scanning:'BUSCANDO MARCADOR...', found:'LOGO RECONOCIDO • SISTEMA ACTIVO', error:'NO SE PUDO ABRIR LA CÁMARA' };

  const setStatus = (message, found=false) => {
    status.textContent = message;
    light.classList.toggle('found', found);
  };
  const later = (fn, ms) => { const timer = setTimeout(fn, ms); timers.push(timer); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers=[]; };
  const resetIntro = () => {
    clearTimers();
    document.querySelectorAll('[data-intro]').forEach(el => {
      el.removeAttribute('animation__intro');
      el.setAttribute('scale','0.01 0.01 0.01');
    });
  };
  const reveal = () => {
    resetIntro();
    const ids = ['coreIntro','titleIntro','p1','p2','p3','p4'];
    ids.forEach((id,i)=>later(()=>{
      const el=$(id);
      if(!active || !el) return;
      el.setAttribute('animation__intro', {
        property:'scale',from:'0.01 0.01 0.01',to:'1 1 1',dur:540,
        easing:'easeOutBack',startEvents:'arReintroduce'
      });
      el.emit('arReintroduce');
    }, 180+i*255));
  };
  target.addEventListener('targetFound',()=>{ if(!active)return;setStatus(notices.found,true);reveal(); });
  target.addEventListener('targetLost',()=>{ if(!active)return;setStatus(notices.scanning,false);resetIntro(); });
  scene.addEventListener('arReady',()=>{if(active)setStatus(notices.scanning);});
  scene.addEventListener('arError',()=>{
    active=false;starting=false;
    if(system) { try { system.stop(); } catch(_) {} }
    setStatus(notices.error);
    start.disabled=false;
    intro.hidden=false;
    chrome.hidden=true;
    warning.hidden=false;
    warning.querySelector('span').textContent='No se pudo iniciar la cámara. Verificá HTTPS, permisos, navegador y el archivo target.mind.';
  });

  const hasTarget = async() => {
    try {
      const response=await fetch('assets/target.mind',{cache:'no-store'});
      if(!response.ok)return false;
      const blob=await response.blob();
      return blob.size>100; // no aceptar un archivo de texto de prueba
    } catch(_) {return false;}
  };
  const sceneLoaded = () => new Promise((resolve,reject)=>{
    if(scene.hasLoaded)return resolve();
    const timeout=setTimeout(()=>reject(new Error('A-Frame no cargó. Revisá conexión a Internet.')),12000);
    scene.addEventListener('loaded',()=>{clearTimeout(timeout);resolve();},{once:true});
  });
  start.addEventListener('click',async()=>{
    if (starting || active) return;
    starting=true;
    start.disabled=true;warning.hidden=true;
    if(!window.isSecureContext){
      warning.hidden=false;
      warning.querySelector('span').textContent='La cámara necesita HTTPS o localhost. Abrí el proyecto desde GitHub Pages o un servidor local.';
      start.disabled=false;starting=false;return;
    }
    if(!await hasTarget()){
      warning.hidden=false;start.disabled=false;starting=false;return;
    }
    try {
      await sceneLoaded();
      system=scene.systems['mindar-image-system'];
      if(!system)throw new Error('Motor MindAR no cargado.');
      chrome.hidden=false;
      intro.hidden=true;
      active=true;
      setStatus('INICIALIZANDO CÁMARA...');
      await system.start();
      starting=false;
      if(!active && system) await system.stop();
    }catch(err){
      starting=false;
      try { if(system) await system.stop(); } catch(_) {}
      active=false;intro.hidden=false;chrome.hidden=true;start.disabled=false;
      warning.hidden=false;
      warning.querySelector('span').textContent='Error: '+(err.message||String(err));
    }
  });
  $('exitBtn').addEventListener('click',async()=>{
    active=false;clearTimers();
    try{if(system)await system.stop();}catch(_){/* recuperar vista igualmente */}
    intro.hidden=false;chrome.hidden=true;start.disabled=false;
    resetIntro();
  });
  window.addEventListener('pagehide',()=>{
    active=false;clearTimers();
    if (system) { try { system.stop(); } catch(_) {} }
  });
})();
