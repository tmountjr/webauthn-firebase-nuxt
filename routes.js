// This file was added by layer0 init.
// You should commit this file to source control.

import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
import base64url from 'base64url'

const { Router } = require('@layer0/core/router')
const { nuxtRoutes } = require('@layer0/nuxt')

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
    compute((req, res) => {
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

  .post('/auth/verify-registration', ({ compute }) => {
    compute(async (req, res) => {
      res.setHeader('content-type', 'application/json')

      const body = JSON.parse(req.body)
      const { credential, devices, expectedChallenge } = body
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

      let verification
      try {
        const opts = {
          credential,
          expectedChallenge,
          expectedOrigin,
          expectedRPID: rpID,
          requireUserVerification: true
        }
        verification = await verifyRegistrationResponse(opts)
      } catch (error) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: error.message })
        return res
      }

      const { verified, registrationInfo } = verification
      const returnValue = { verified }
      if (verified && registrationInfo) {
        const { credentialPublicKey, credentialID, counter } = registrationInfo
        const existingDevice = devices.find(device => device.credentialID.equals(credentialID))
        if (!existingDevice) {
          const newDevice = {
            credentialPublicKey,
            credentialID,
            counter,
            transports: credential.transports
          }
          newDevice.credentialIdSerialized = base64url.encode(credentialID)
          returnValue.newDevice = newDevice
        }
      }

      res.body = JSON.stringify(returnValue)
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
