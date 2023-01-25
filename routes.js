import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server'
import base64url from 'base64url'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { fbAdminApp, userDevices, convertFirebaseDevices } from './fbAdminApp.js'

const { Router } = require('@edgio/core/router')
const { nuxtRoutes } = require('@edgio/nuxt')

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

module.exports = new Router({
  indexPermalink: false
})
  .match('/service-worker.js', ({ serviceWorker }) => {
    serviceWorker('.nuxt/dist/client/service-worker.js')
  })

  .get('/auth/generate-authentication-options', ({ cache, compute }) => {
    cache(NO_CACHE)

    compute((_req, res) => {
      const opts = {
        timeout: 60000,
        allowCredentials: [],
        userVerification: 'preferred',
        rpID
      }
      res.setHeader('content-type', 'application/json')
      try {
        const options = generateAuthenticationOptions(opts)
        res.statusCode = 200
        res.body = JSON.stringify(options)
      } catch (e) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: e.message })
      }
      return res
    })
  })

  .post('/auth/generate-authentication-options', ({ cache, compute }) => {
    cache(NO_CACHE)

    compute(async (req, res) => {
      const jsonBody = JSON.parse(req.body)
      let { devices } = jsonBody
      const { fbUid } = jsonBody
      if (devices) {
        devices = convertFirebaseDevices(devices)
      } else {
        devices = await userDevices(fbUid)
      }

      const opts = {
        timeout: 60000,
        allowCredentials: devices.map(dev => ({
          id: dev.credentialID,
          type: 'public-key',
          transports: dev.transports
        })),
        userVerification: 'preferred',
        rpID
      }

      res.setHeader('content-type', 'application/json')
      try {
        const options = generateAuthenticationOptions(opts)
        res.statusCode = 200
        res.body = JSON.stringify(options)
      } catch (e) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: e.message })
      }
      return res
    })
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
          userVerification: 'preferred',
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

  .post('/auth/verify-authentication', ({ compute }) => {
    compute(async (req, res) => {
      res.setHeader('content-type', 'application/json')

      const jsonBody = JSON.parse(req.body)
      const { fbUid, currentChallenge, body, withToken = false } = jsonBody
      let { devices } = jsonBody
      if (devices) {
        devices = convertFirebaseDevices(devices)
      } else {
        devices = await userDevices(fbUid)
      }

      const expectedChallenge = currentChallenge
      let dbAuthenticator
      const bodyCredIdBuffer = isoBase64URL.toBuffer(body.rawId)
      for (const dev of devices) {
        if (dev.credentialID.equals(bodyCredIdBuffer)) {
          dbAuthenticator = dev
          break
        }
      }

      if (!dbAuthenticator) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: 'Authenticator is not registered with this site.' })
        return res
      }

      let verification
      try {
        const opts = {
          response: body,
          expectedChallenge: `${expectedChallenge}`,
          expectedOrigin,
          expectedRPID: rpID,
          authenticator: dbAuthenticator,
          requireUserVerification: true
        }
        verification = await verifyAuthenticationResponse(opts)
      } catch (e) {
        res.statusCode = 400
        res.body = JSON.stringify({ error: e.message })
        return res
      }

      const { verified, authenticationInfo } = verification
      const returnValue = { verified }
      if (verified) {
        dbAuthenticator.counter = authenticationInfo.newCounter
        returnValue.authenticator = dbAuthenticator

        if (withToken) {
          const adminApp = fbAdminApp()
          const auth = adminApp.auth()
          const token = await auth.createCustomToken(fbUid)
          returnValue.loginToken = token
        }
      }

      res.body = JSON.stringify(returnValue)
    })
  })

  .post('/auth/verify-registration', ({ compute }) => {
    compute(async (req, res) => {
      res.setHeader('content-type', 'application/json')

      const body = JSON.parse(req.body)
      const { credential, expectedChallenge } = body
      let { devices } = body
      devices = convertFirebaseDevices(devices)

      let verification
      try {
        const opts = {
          response: credential,
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
        const { credentialPublicKey, counter } = registrationInfo
        const credentialID = Buffer.from(registrationInfo.credentialID)
        const existingDevice = devices.find(device => Buffer.from(device.credentialID).equals(credentialID))
        if (!existingDevice) {
          const newDevice = {
            credentialPublicKey,
            credentialID,
            counter,
            transports: credential.transports
          }
          newDevice.credentialIdSerialized = base64url.encode(registrationInfo.credentialID)
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
