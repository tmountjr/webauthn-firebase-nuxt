'use strict'
module.exports = {
  connector: '@layer0/nuxt',
  includeFiles: {
    './layer0/getNodeModules': true,
    './server-middleware/**/*': true,
    './content/**/*': true
  }
}
