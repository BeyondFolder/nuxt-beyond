(function () {
  if (window.__nuxtbeyond_loaded) {
    console.warn('NuxtBeyond project already loaded');
    return;
  }

  function isValidHexColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  function sanitizePath(path) {
    if (!path || typeof path !== 'string') return null;
    const sanitized = path.replace(/[^\w\-\/\.]/g, '');
    if (sanitized.includes('..')) return null;
    return sanitized.startsWith('/') ? sanitized : '/' + sanitized;
  }

  const config = {
    ...{
      projectId: '',
      primaryColor: '#0d9488',
      position: 'bottom-right',
      logo: null,
    },
    ...(window.__nuxtbeyond_config || {}),
  };

  if (!config.projectId) {
    console.error('NuxtBeyond: projectId is required. Please use the loader.js script or set window.__nuxtbeyond_config.');
    return;
  }

  if (!isValidHexColor(config.primaryColor)) {
    console.warn('Invalid primaryColor provided. Using default.');
    config.primaryColor = '#0d9488';
  }

  if (config.logo) {
    config.logo = sanitizePath(config.logo);
    if (!config.logo) {
      console.warn('Invalid logo path provided. Ignoring.');
    }
  }

  const bubbleIcon = config.logo
    ? `<img src="https://nuxtbeyond.com${config.logo}" alt="Logo" style="width: 64px; height: 64px; object-fit: contain;" />`
    : `<img src="https://nuxtbeyond.com/images/logo.png" alt="Logo" style="width: 64px; height: 64px; object-fit: contain;" />`;

  const closeIconSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  const spinnerSVG = `
    <svg width="48" height="48" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <style>
        .spinner {
          animation: rotate 2s linear infinite;
          transform-origin: center center;
        }
        .path {
          stroke: ${config.primaryColor};
          stroke-linecap: round;
          animation: dash 1.5s ease-in-out infinite;
        }
        @keyframes rotate {
          100% { transform: rotate(360deg); }
        }
        @keyframes dash {
          0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
          50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
          100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
        }
      </style>
      <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
    </svg>
  `;

  const Z_INDEX = {
    button: 2147483645,
    container: 2147483646,
  };

  const button = document.createElement('button');
  button.id = 'nuxtbeyond-bubble-button';
  button.innerHTML = bubbleIcon;
  button.setAttribute('aria-label', 'Open chat project');
  button.style.cssText = `
    position: fixed;
    ${config.position.includes('bottom') ? 'bottom: 1rem;' : 'top: 1rem;'}
    ${config.position.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
    width: 55px;
    height: 55px;
    border-radius: 50%;
    border: none;
    background-color: ${config.primaryColor};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    z-index: ${Z_INDEX.button};
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  button.onmouseenter = () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
  };

  button.onmouseleave = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  };

  const container = document.createElement('div');
  container.id = 'nuxtbeyond-bubble-window';
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-label', 'Chat project');
  container.style.display = 'none';

  const updateContainerSize = () => {
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
    const currentDisplay = container.style.display;

    if (isMobile) {
      container.style.cssText = `
        position: fixed;
        top: 3vh;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        height: 85vh;
        border-radius: 1rem;
        display: ${currentDisplay};
        z-index: ${Z_INDEX.container};
        background-color: white;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      `;
    } else if (isTablet) {
      container.style.cssText = `
        position: fixed;
        ${config.position.includes('bottom') ? 'bottom: 85px;' : 'top: 85px;'}
        ${config.position.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
        width: 380px;
        height: 80vh;
        max-height: 600px;
        border-radius: 1rem;
        display: ${currentDisplay};
        z-index: ${Z_INDEX.container};
        background-color: white;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      `;
    } else {
      container.style.cssText = `
        position: fixed;
        ${config.position.includes('bottom') ? 'bottom: 85px;' : 'top: 85px;'}
        ${config.position.includes('right') ? 'right: 1rem;' : 'left: 1rem;'}
        width: 420px;
        height: 85vh;
        max-height: 700px;
        border-radius: 1.25rem;
        display: ${currentDisplay};
        z-index: ${Z_INDEX.container};
        background-color: white;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      `;
    }
  };

  updateContainerSize();
  window.addEventListener('resize', updateContainerSize);

  const loader = document.createElement('div');
  loader.className = 'nuxtbeyond-loader';
  loader.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: white;
  `;
  loader.innerHTML = spinnerSVG;

  const iframe = document.createElement('iframe');
  iframe.id = 'nuxtbeyond-iframe';
  iframe.title = 'NuxtBeyond Chat Project';
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
  `;

  container.appendChild(loader);
  container.appendChild(iframe);
  document.body.appendChild(button);
  document.body.appendChild(container);

  let isLoaded = false;
  let loadTimeout = null;

  button.onclick = () => {
    const isOpen = container.style.display !== 'none';

    if (isOpen) {
      container.style.display = 'none';
      button.innerHTML = bubbleIcon;
      button.setAttribute('aria-label', 'Open chat project');
      container.setAttribute('aria-hidden', 'true');
    } else {
      container.style.display = 'flex';
      button.innerHTML = closeIconSVG;
      button.setAttribute('aria-label', 'Close chat project');
      container.setAttribute('aria-hidden', 'false');

      if (!isLoaded) {
        button.disabled = true;
        loader.style.display = 'flex';
        iframe.style.visibility = 'hidden';

        loadTimeout = setTimeout(() => {
          loader.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
              <p style="margin-bottom: 10px;">Failed to load chat project</p>
              <button onclick="location.reload()" style="
                padding: 8px 16px;
                background: ${config.primaryColor};
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
              ">Retry</button>
            </div>
          `;
        }, 10000);

        iframe.src = `https://nuxtbeyond.com/embed?projectId=${config.projectId}`;

        iframe.onload = () => {
          clearTimeout(loadTimeout);
          loader.style.display = 'none';
          iframe.style.visibility = 'visible';
          isLoaded = true;
          button.disabled = false;
        };

        iframe.onerror = () => {
          clearTimeout(loadTimeout);
          loader.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
              <p style="margin-bottom: 8px; font-weight: 500;">Unable to load chat project</p>
              <p style="font-size: 12px; color: #999; margin-bottom: 12px;">
                This may be due to your site's Content Security Policy.
              </p>
              <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP" target="_blank" style="
                color: ${config.primaryColor};
                text-decoration: none;
                font-size: 12px;
              ">Learn more</a>
            </div>
          `;
          button.disabled = false;
        };
      }
    }
  };

  const oldQueue = window.nuxtbeyond && window.nuxtbeyond.q ? window.nuxtbeyond.q : [];

  window.nuxtbeyond = {
    open: () => {
      if (container.style.display === 'none') {
        button.click();
      }
    },
    close: () => {
      if (container.style.display !== 'none') {
        button.click();
      }
    },
    toggle: () => button.click(),
    getState: () => (isLoaded ? 'loaded' : 'loading'),
  };

  window.__nuxtbeyond_loaded = true;

  if (oldQueue.length > 0) {
    oldQueue.forEach((args) => {
      const [method, ...params] = args;
      if (typeof window.nuxtbeyond[method] === 'function') {
        window.nuxtbeyond[method](...params);
      }
    });
  }
})();
