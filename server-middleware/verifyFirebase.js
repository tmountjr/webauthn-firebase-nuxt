import Url from 'url-parse'
import admin from 'firebase-admin'
import Cookies from 'universal-cookie'

/** Exclude some paths from processing */
const include = [
  '/',
  '/credential-manager',
  '/profile',
  '/settings'
]

const ADMIN_APP_NAME = 'firebase-admin-app'

export default async function (req, res, next) {
  const reqUrl = new Url(req.url)
  const pass = !include.includes(reqUrl.pathname)
  if (pass) {
    return next()
  }

  let adminApp
  try {
    adminApp = admin.app(ADMIN_APP_NAME)
  } catch (e) {
    const creds = JSON.parse(process.env.GAPP_CREDENTIALS)
    creds.private_key = creds.private_key.replace(/\\n/gm, '\n')
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(creds),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    }, ADMIN_APP_NAME)
  }

  const auth = adminApp.auth()

  // Check the cookies. We can't really use express's middleware.
  const cookies = new Cookies(req.headers.cookie)
  const idToken = cookies.get('fbId')
  if (!idToken) {
    // Cookie not found, so send to login page.
    let location = '/login'
    if (reqUrl !== '/login') {
      location = `/login?redirectTo=${encodeURIComponent(reqUrl)}`
    }
    res.writeHead(307, { location })
    return res.end()
  }

  let decodedToken
  try {
    // eslint-disable-next-line no-unused-vars
    decodedToken = await auth.verifyIdToken(idToken)
  } catch (e) {
    // Cookie is invalid, issue a 403.
    res.writeHead(403)
    return res.end()
  }

  return next()
}
