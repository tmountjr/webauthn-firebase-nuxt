import firebaseAdmin from 'firebase-admin'

const { FIREBASE_DATABASE_URL, GAPP_CREDENTIALS } = process.env
const adminAppName = 'firebase-admin-app'

/**
 * Get an instance of the Firebase admin SDK.
 * @returns {firebaseAdmin.app.App}
 */
export const fbAdminApp = () => {
  let adminApp
  try {
    // Try to get the existing app.
    adminApp = firebaseAdmin.app(adminAppName)
  } catch (e) {
    const creds = JSON.parse(GAPP_CREDENTIALS)
    creds.private_key = creds.private_key.replace(/\\n/gm, '\n')
    adminApp = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(creds),
      databaseURL: FIREBASE_DATABASE_URL
    }, adminAppName)
  }
  return adminApp
}

/**
 * Get a list of available credentials for a given Firebase UID
 * @param {string} fbUid The Firebase UID of the user to fetch
 * @returns {Promise<any[]>} A list of available credentials for the user
 */
export const userDevices = async (fbUid) => {
  const adminApp = fbAdminApp()
  const db = adminApp.database()
  const ref = db.ref(`/users/${fbUid}/credentials`)
  const snapshot = await ref.once('value')
  const devices = convertFirebaseDevices(snapshot.val())
  return devices
}

/**
 * Processes a list of Firebase devices by converting pseudo-buffers to actual buffers.
 * @param {any[]} devices The list of devices to process
 * @returns {any[]} The same list, processed.
 */
export const convertFirebaseDevices = (devices) => {
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
