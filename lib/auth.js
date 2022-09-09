// Current this is expecting to run in a browser context. There are probably some
// changes necessary if this gets moved to an edge function.
import base64url from 'base64url'
import * as fido2 from '@simplewebauthn/server'

let challenge

const getOrigin = (userAgent) => {
  let origin = window.location.origin

  const appRe = /^[a-z0-9_.]+/i
  const match = userAgent.match(appRe)
  if (match) {
    // Check if UserAgent comes from a supported Android app.
    if (process.env.ANDROID_PACKAGENAME && process.env.ANDROID_SHA256HASH) {
      const packageNames = process.env.ANDROID_PACKAGENAME.split(',').map(name => name.trim())
      const hashes = process.env.ANDROID_SHA256HASH.split(',').map(hash => hash.trim())
      const appName = match[0]
      for (let i = 0; i < packageNames.length; i++) {
        if (appName === packageNames[i]) {
          // We recognize this app, so use the corresponding hash.
          const octArray = hashes[i].split(':').map(h =>
            parseInt(h, 16)
          )
          const androidHash = base64url.encode(octArray)
          origin = `android:apk-key-hash:${androidHash}`
          break
        }
      }
    }
  }

  return origin
}

export const registerCredential = ({ user, credentials }) => {
  const opts = {
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: false
    }
  }

  // Start backend registerRequest() route.
  const excludeCredentials = []
  for (const cred of credentials) {
    excludeCredentials.push({
      id: base64url.toBuffer(cred.credId),
      type: 'public-key',
      transports: ['internal']
    })
  }
  const pubKeyCredParams = []
  const params = [-7, -257]
  for (const param of params) {
    pubKeyCredParams.push({ type: 'public-key', alg: param })
  }

  const as = {} // authenticatorSelection
  const aa = opts.authenticatorSelection.authenticatorAttachment
  const rr = opts.authenticatorSelection.requireResidentKey
  const uv = opts.authenticatorSelection.userVerification
  const cp = opts.attestation // attestationConveyancePreference
  let asFlag = false
  let authenticatorSelection
  let attestation = 'none'

  if (aa && (aa === 'platform' || aa === 'cross-platform')) {
    asFlag = true
    as.authenticatorAttachment = aa
  }
  if (rr && typeof rr === 'boolean') {
    asFlag = true
    as.requireResidentKey = rr
  }
  if (uv && (uv === 'required' || uv === 'preferred' || uv === 'discouraged')) {
    asFlag = true
    as.userVerification = uv
  }
  if (asFlag) {
    authenticatorSelection = as
  }
  if (cp && (cp === 'none' || cp === 'indirect' || cp === 'direct')) {
    attestation = cp
  }

  const options = fido2.generateRegistrationOptions({
    rpName: 'Webauth / Firebase / Nuxt Demo',
    rpID: window.location.hostname,
    userID: user.uid,
    userName: user.email,
    timeout: 1000 * 60 * 30, // 30 minutes
    attestationType: attestation,
    excludeCredentials,
    authenticatorSelection
  })

  challenge = options.challenge

  options.pubKeyCredParams = []
  for (const param of params) {
    options.pubKeyCredParams.push({ type: 'public-key', alg: param })
  }

  options.user.id = base64url.toBuffer(options.user.id)
  options.challenge = base64url.toBuffer(options.challenge)

  if (options.excludeCredentials) {
    for (const cred of options.excludeCredentials) {
      cred.id = base64url.toBuffer(cred.id)
    }
  }

  // Send options back to the client for credential creation.
  return options
}

export const registerResponse = async ({ user, rawCredential, credentialName }) => {
  // We have to massage rawCredential a bit.
  const credential = {
    id: rawCredential.id,
    rawId: base64url.encode(rawCredential.rawId),
    type: rawCredential.type
  }
  if (rawCredential.response) {
    const clientDataJSON = base64url.encode(rawCredential.response.clientDataJSON)
    const attestationObject = base64url.encode(rawCredential.response.attestationObject)
    credential.response = { clientDataJSON, attestationObject }
  }

  const expectedChallenge = challenge
  const expectedOrigin = getOrigin(window.navigator.userAgent)
  const expectedRPID = window.location.hostname

  try {
    const verification = await fido2.verifyRegistrationResponse({
      credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID
    })
    const { verified, registrationInfo } = verification

    if (!verified) {
      throw new Error('User verification failed.')
    }

    const { credentialPublicKey, credentialID, counter } = registrationInfo
    const base64PublicKey = base64url.encode(credentialPublicKey)
    const base64CredentialID = base64url.encode(credentialID)
    const existingCred = user.credentials.find(cred => cred.credId === base64CredentialID)
    if (!existingCred) {
      user.credentials.push({
        publicKey: base64PublicKey,
        credId: base64CredentialID,
        prevCounter: counter,
        credentialName
      })
    }

    return user
  } catch (e) {
    console.error(e)
  }
}

export const signinRequest = ({ user, credId }) => {
  try {
    const allowCredentials = []
    for (const cred of user.credentials) {
      if (credId === cred.credId) {
        allowCredentials.push({
          id: base64url.toBuffer(cred.credId),
          type: 'public-key',
          transports: ['internal']
        })
      }
    }

    const options = fido2.generateAuthenticationOptions({
      timeout: 1000 * 60 * 30, // 30 minutes,
      rpID: window.location.hostname,
      allowCredentials,
      userVerification: 'required'
    })
    challenge = options.challenge

    return options
  } catch (e) {
    console.log(e)
  }
}

export const signinResponse = async ({ user, credentialObject }) => {
  const expectedChallenge = challenge
  const expectedOrigin = getOrigin(window.navigator.userAgent)
  const expectedRPID = window.location.hostname
  const credential = user.credentials.find(cred => cred.credId === credentialObject.id)
  credential.credentialPublicKey = base64url.toBuffer(credential.publicKey)
  credential.credentialID = base64url.toBuffer(credential.credId)
  credential.counter = credential.prevCounter

  try {
    if (!credential) {
      throw new Error('Authenticating credential not found.')
    }

    const verification = await fido2.verifyAuthenticationResponse({
      credential: credentialObject,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
      authenticator: credential
    })
    const { verified, authenticationInfo } = verification
    if (!verified) {
      throw new Error('User verification failed.')
    }
    credential.prevCounter = authenticationInfo.newCounter
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}
