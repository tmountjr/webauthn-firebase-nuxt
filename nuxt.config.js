const config = {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'webauthn-firebase-nuxt',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    ['@edgio/nuxt/module', {
      layer0SourceMaps: true
    }],

    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    'cookie-universal-nuxt'
  ],

  bootstrapVue: {
    icons: true
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/firebase'
  ],

  firebase: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    },
    services: {
      auth: {
        initialize: {
          onAuthStateChangedAction: 'onAuthStateChanged'
        },
        ssr: true
      },
      database: true
    }
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/'
  },

  serverMiddleware: [
    '@/server-middleware/redirects.js',
    '@/server-middleware/verifyFirebase.js',
    { path: '/schwarber', handler: '@server-middleware/schwarber.js' }
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    babel: {
      compact: process.env.NODE_ENV !== 'development',
      sourceRoot: __dirname
    },
    extend (config, { isClient, isServer }) {
      if (process.env.NODE_ENV !== 'development') {
        config.devtool = isClient ? 'source-map' : 'inline-source-map'
      }

      if (isClient) {
        config.output.globalObject = 'this'
      }

      if (isServer) {
        const nodeExternals = require('webpack-node-externals')
        config.target = 'node'
        config.externals = [nodeExternals({
          allowlist: [/^(?!firebase-admin).+/]
        })]
      }
    }
  }
}

// if ('LOCALHOST_HTTPS_CERT' in process.env && 'LOCALHOST_HTTPS_KEY' in process.env) {
//   const fs = require('fs')
//   const path = require('path')
//   config.server = {
//     https: {
//       key: fs.readFileSync(path.resolve(__dirname, process.env.LOCALHOST_HTTPS_KEY)),
//       cert: fs.readFileSync(path.resolve(__dirname, process.env.LOCALHOST_HTTPS_CERT))
//     }
//   }
// }

export default config
