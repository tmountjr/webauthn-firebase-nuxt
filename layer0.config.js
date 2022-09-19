'use strict'
module.exports = {
  connector: '@layer0/nuxt',
  includeFiles: {
    './server-middleware/**/*': true,
    './content/**/*': true
  },
  includeNodeModules: true
}
