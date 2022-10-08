// This file was added by layer0 init.
// You should commit this file to source control.

import { generateRegistrationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server'
const { Router } = require('@layer0/core/router')
const { nuxtRoutes } = require('@layer0/nuxt')
const { default: base64url } = require('base64url')

const NO_CACHE = {
  browser: {
    maxAgeSeconds: 0,
    serviceWorkerSeconds: 0
  },
  edge: {
    maxAgeSeconds: 0,
    staleWhileRevalidateSeconds: 0
  }
}

const { RP_ID } = process.env
const rpID = RP_ID
const expectedOrigin = rpID === 'localhost'
  ? 'http://localhost:3000'
  : `https://${rpID}`
const rpName = 'Webauthn / Firebase / Nuxt Demo'

module.exports = new Router()
  // Prevent search engines from indexing permalink URLs
  .noIndexPermalink()
  .match('/service-worker.js', ({ serviceWorker }) => {
    serviceWorker('.nuxt/dist/client/service-worker.js')
  })

  .post('/auth/generate-registration-options', ({ cache, compute }) => {
    cache(NO_CACHE)
    compute(async (req, res) => {
      const body = JSON.parse(req.body)
      const { user, devices } = body
      const opts = {
        rpName,
        rpID,
        userID: user.uid,
        userName: user.email,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: devices.map(dev => ({
          id: dev.credentialID,
          type: 'public-key',
          transports: dev.transports
        })),
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'required'
        },
        supportedAlgorithmIDs: [-7, -257]
      }

      res.setHeader('content-type', 'application/json')
      try {
        const options = generateRegistrationOptions(opts)
        res.statusCode = 200
        res.body = JSON.stringify(options)
      } catch (e) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: e.message })
      }
      // `options` has the challenge embedded in it; the client will need to take
      // the challenge and push it to firebase
      return res
    })
  })

  // TODO: check if this is the right method or not - it's acting like the authenticator
  // has already been registered and verified.
  .post('/auth/verify-registration', ({ compute }) => {
    compute(async (req, res) => {
      res.setHeader('content-type', 'application/json')

      const { credential, devices, expectedChallenge } = JSON.parse(req.body)
      devices.forEach((device) => {
        for (const prop in device) {
          if (
            typeof device[prop] === 'object' &&
            'type' in device[prop] &&
            device[prop].type === 'Buffer'
          ) {
            device[prop] = Buffer.from(device[prop].data)
          }
        }
      })

      let dbAuthenticator
      const bodyCredIDBuffer = base64url.toBuffer(credential.rawId)
      for (const dev of devices) {
        if (dev.credentialID.equals(bodyCredIDBuffer)) {
          dbAuthenticator = dev
          break
        }
      }

      if (!dbAuthenticator) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: 'Authenticator is not registered with this site. ' })
        return res
      }

      let verification
      try {
        const opts = {
          credential,
          expectedChallenge,
          expectedOrigin,
          expectedRPID: rpID,
          authenticator: dbAuthenticator,
          requireUserVerification: true
        }
        verification = await verifyAuthenticationResponse(opts)
      } catch (error) {
        console.log(error)
        res.statusCode = 400
        res.body = JSON.stringify({ error: error.message })
        return res
      }

      const { verified, authenticationInfo } = verification
      if (verified) {
        dbAuthenticator.counter = authenticationInfo.newCounter
      }

      res.body = JSON.stringify({
        verified,
        counter: dbAuthenticator.counter
      })
      return res
    })
  })

  .match('/schwarber', ({ cache }) => {
    cache({
      browser: {
        maxAgeSeconds: 0,
        serviceWorkerSeconds: 60 * 60 * 24
      },
      edge: {
        maxAgeSeconds: 60 * 60 * 24,
        staleWhileRevalidateSeconds: 60 * 60
      }
    })
  })
  .use(nuxtRoutes)
