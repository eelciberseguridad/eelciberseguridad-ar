(() => {
  'use strict';

  const body = document.body;
  const scene = document.getElementById('arScene');
  const target = document.getElementById('eelTarget');
  const errorBox = document.getElementById('errorBox');
  const revealIds = ['titleGroup', 'coreGroup'];
  let system = null;
  let started = false;
  let revealed = false;

  const showError = (message) => {
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.textContent = message;
  };

  const hideError = () => {
    if (!errorBox) return;
    errorBox.hidden = true;
    errorBox.textContent = '';
  };

  const sceneLoaded = () => new Promise((resolve, reject) => {
    if (scene.hasLoaded) return resolve();
    const timeout = setTimeout(() => reject(new Error('A-Frame no cargó.')), 12000);
    scene.addEventListener('loaded', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });

  const hasTarget = async () => {
    try {
      const response = await fetch('assets/target.mind', { cache: 'no-store' });
      if (!response.ok) return false;
      const blob = await response.blob();
      return blob.size > 100;
    } catch (_) {
      return false;
    }
  };

  const setReveal = (visible) => {
    revealIds.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (visible) {
        el.setAttribute('animation__reveal', {
          property: 'scale',
          from: '0.001 0.001 0.001',
          to: '1 1 1',
          dur: 520 + i * 120,
          easing: 'easeOutCubic'
        });
      } else {
        el.removeAttribute('animation__reveal');
        el.setAttribute('scale', '0.001 0.001 0.001');
      }
    });
    revealed = visible;
  };

  const startAR = async () => {
    if (started) return;
    started = true;
    hideError();

    if (!window.isSecureContext) {
      showError('No se pudo iniciar la cámara. Abrí la página en HTTPS.');
      return;
    }

    if (!await hasTarget()) {
      showError('Falta assets/target.mind');
      return;
    }

    try {
      await sceneLoaded();
      system = scene.systems['mindar-image-system'];
      if (!system) throw new Error('MindAR no cargó.');
      await system.start();
    } catch (err) {
      showError('No se pudo iniciar la cámara.');
      console.error(err);
    }
  };

  scene.addEventListener('arReady', () => {
    hideError();
  });

  scene.addEventListener('arError', () => {
    showError('No se pudo iniciar la cámara.');
  });

  target.addEventListener('targetFound', () => {
    body.classList.add('found');
    if (!revealed) setReveal(true);
  });

  target.addEventListener('targetLost', () => {
    body.classList.remove('found');
    setReveal(false);
  });

  window.addEventListener('pagehide', async () => {
    try {
      if (system) await system.stop();
    } catch (_) {
      // noop
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAR, { once: true });
  } else {
    startAR();
  }
})();
