import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server'
import base64url from 'base64url'
import firebaseAdmin from 'firebase-admin'

const { Router } = require('@layer0/core/router')
const { nuxtRoutes } = require('@layer0/nuxt')
const axios = require('axios')

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

const { FIREBASE_DATABASE_URL, RP_ID } = process.env
const rpID = RP_ID
const expectedOrigin = rpID === 'localhost'
  ? 'http://localhost:3000'
  : `https://${rpID}`
const rpName = 'Webauthn / Firebase / Nuxt Demo'

/**
 * Get a list of available credentials for a given Firebase UID
 * @param {string} fbUid The Firebase UID of the user to fetch
 * @returns {Promise<any[]>} A list of available credentials for the user
 */
const userDevices = async (fbUid) => {
  const resp = await axios.get(`${FIREBASE_DATABASE_URL}/users/${fbUid}/credentials.json`)
  const devices = convertFirebaseDevices(resp.data)
  return devices
}

/**
 * Processes a list of Firebase devices by converting pseudo-buffers to actual buffers.
 * @param {any[]} devices The list of devices to process
 * @returns {any[]} The same list, processed.
 */
const convertFirebaseDevices = (devices) => {
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
  return devices
}

module.exports = new Router()
  // Prevent search engines from indexing permalink URLs
  .noIndexPermalink()

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
      const bodyCredIdBuffer = base64url.toBuffer(body.rawId)
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
          credential: body,
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
          let adminApp
          try {
            adminApp = firebaseAdmin.app('firebase-admin-app')
          } catch (e) {
            const creds = JSON.parse(process.env.GAPP_CREDENTIALS)
            creds.private_key = creds.private_key.replace(/\\n/gm, '\n')
            adminApp = firebaseAdmin.initializeApp({
              credential: firebaseAdmin.credential.cert(creds),
              databaseURL: FIREBASE_DATABASE_URL
            }, 'firebase-admin-app')
          }
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
        const passkey = {
          credentialDeviceType: registrationInfo.credentialDeviceType,
          credentialBackedUp: registrationInfo.credentialBackedUp
        }
        // eslint-disable-next-line no-console
        console.log(passkey)
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
