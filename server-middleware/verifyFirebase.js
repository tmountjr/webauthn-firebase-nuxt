import Url from 'url-parse'
import admin from 'firebase-admin'
import Cookies from 'universal-cookie'

/** Exclude some paths from processing */
const include = [
  '/',
  '/reauth'
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
    const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    }, ADMIN_APP_NAME)
  }

  const auth = adminApp.auth()

  // Check the cookies. We can't really use express's middleware.
  const cookies = new Cookies(req.headers.cookie)
  console.log(cookies)
  const idToken = cookies.get('fbId')
  if (!idToken) {
    // Cookie not found, so send to login page.
    res.writeHead(301, { location: '/login' })
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
