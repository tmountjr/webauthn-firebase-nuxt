import Url from 'url-parse'

const redirects = [
  { from: '/reports', to: '/' },
  { from: '/integrations', to: '/' }
]

export default function (req, res, next) {
  const url = new Url(req.url)

  const redirect = redirects.find(r => r.from === url.pathname)
  if (redirect) {
    res.writeHead(301, { location: redirect.to })
    res.end()
  }

  next()
}
