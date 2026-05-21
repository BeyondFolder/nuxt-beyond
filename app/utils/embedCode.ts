export function generateLoaderCode(config: {
  projectId: string;
  primaryColor?: string;
  position?: string;
  logo?: string | null;
}): string {
  const configJson = JSON.stringify(config);

  const script = `(function () {
  if (!window.nuxtbeyond || !window.__nuxtbeyond_loaded) {
    window.nuxtbeyond = (...arguments) => {
      if (!window.nuxtbeyond.q) {
        window.nuxtbeyond.q = [];
      }
      window.nuxtbeyond.q.push(arguments);
    };

    window.nuxtbeyond = new Proxy(window.nuxtbeyond, {
      get(target, prop) {
        if (prop === 'q') {
          return target.q;
        }
        return (...args) => target(prop, ...args);
      },
    });
  }

  var config = ${configJson};

  var onLoad = function () {
    window.__nuxtbeyond_config = config;

    var embedScript = document.createElement('script');
    embedScript.src = 'https://nuxtbeyond.com/embed.js';

    embedScript.onerror = () => {
      console.error('NuxtBeyond: Failed to load embed script');
    };

    document.body.appendChild(embedScript);
  };

  if (document.readyState === 'complete') {
    onLoad();
  } else {
    window.addEventListener('load', onLoad);
  }
})();`;

  const minified = script
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,():])\s*/g, '$1')
    .replace(/\s*=\s*/g, '=')
    .trim();

  return `<script>${minified}<` + `/script>`;
}

export function generateIframeCode(projectId: string): string {
  return `<iframe
  src="https://nuxtbeyond.com/embed?projectId=${projectId}"
  width="100%"
  style="height: 100%; min-height: 700px"
  frameborder="0"
></iframe>`;
}
