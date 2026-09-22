// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@nuxt/scripts',
    '@nuxtjs/turnstile',
    '@nuxtjs/mdc',
    '@unlok-co/nuxt-stripe',
    '@nuxtjs/seo',
    '@nuxt/fonts',
    '@polar-sh/nuxt',
  ],

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android-chrome-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/android-chrome-512x512.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  site: {
    name: 'NuxtBeyond - The AI-First Nuxt 4 Boilerplate',
  },

  content: {
    preview: {
      api: 'https://api.nuxt.studio',
      gitInfo: {
        name: 'nuxtbeyond-app',
        owner: 'BeyondFolder',
        url: 'https://github.com/BeyondFolder/nuxtbeyond-app',
      },
    },
  },

  mdc: {
    headings: {
      anchorLinks: false,
    },
    highlight: {
      // noApiRoute: true
      shikiEngine: 'javascript',
    },
  },

  ui: {},

  runtimeConfig: {
    session: {
      password: '', // overriden by NUXT_SESSION_PASSWORD
      maxAge: 60 * 60 * 24 * 30,
    },
    turnstile: {
      secretKey: '', // overriden by NUXT_TURNSTILE_SECRET_KEY
    },
    stripe: {
      key: '', // overriden by NUXT_STRIPE_KEY
    },
    polar: {
      mode: process.env.POLAR_MODE,
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
    },
    public: {
      siteUrl: '', // overriden by NUXT_PUBLIC_SITE_URL
      paymentProvider: process.env.PAYMENT_PROVIDER || 'stripe', // 'stripe' | 'polar'
      stripe: {
        key: '', // overriden by NUXT_PUBLIC_STRIPE_KEY
        manualClientLoad: true,
      },
      turnstile: {
        siteKey: '', // overriden by NUXT_PUBLIC_TURNSTILE_SITE_KEY
      },
    },
  },

  experimental: {
    inlineRouteRules: true,
    asyncContext: true,
  },

  compatibilityDate: '2025-12-14',

  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
    routeRules: {
      '/_nuxt/**': {
        headers: {
          ...(process.env.NODE_ENV === 'production' && {
            'Cache-Control': 'public, max-age=31536000, immutable',
          }),
        },
      },
      // We could set these rules on all routes for better security IF we don't need the widget functionality embedded in 3rd party sites
      '/': {
        headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': [
            "default-src 'self'",
            "frame-src 'self' https:",
            "script-src 'self' 'unsafe-inline' https:",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https:",
            "font-src 'self' https: data:",
            "object-src 'none'",
          ].join('; '),
        },
      },
    },
    experimental: {
      asyncContext: true,
    },
  },

  hub: {
    db: {
      dialect: 'sqlite',
      driver: 'd1',
    },
    blob: {
      driver: 'cloudflare-r2',
      binding: 'BLOB',
    },
    kv: {
      driver: 'cloudflare-kv-binding',
    },
  },

  vite: {
    server: {
      allowedHosts: true,
    },
    optimizeDeps: {
      include: [
        '@ai-sdk/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'ai',
        'date-fns',
        'shiki',
        'shiki-stream/vue',
        'shiki/engine-javascript.mjs',
      ],
    },
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          // App-side typed $fetch routes pull in server files; @unlok-co/nuxt-stripe only maps this alias for the server tsconfig
          '#stripe/server': ['../node_modules/@unlok-co/nuxt-stripe/dist/runtime/server/services'],
        },
      },
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs',
      },
    },
  },

  ogImage: {
    zeroRuntime: true,
    runtimeCacheStorage: false,
  },

  sitemap: {
    zeroRuntime: true,
  },
});
