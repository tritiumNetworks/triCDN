const PORT = process.env.triCDN || 8080
const PATH = require('path').resolve()

const cors = require('cors')
const mime = require('mime')
const multer = require('multer')
const express = require('express')
const randstr = require('crypto-random-string')
const { linkSync: link, readdirSync: readdir } = require('fs')
const { renderFile: render } = require('ejs')

const cooldown = []

const app = express()
const upl = multer({ dest: 'temp/', limits: { fileSize: '100MB' } })

app.use(cors())
app.use('/d', express.static(PATH + '/cdn'))
app.use('/src', express.static(PATH + '/src'))

app.get('/', (_, res) => res.redirect('/upload'))
app.get('/upload', (_, res) => render(PATH + '/page/index.ejs', { cdn: readdir(PATH + '/cdn').length, temp: readdir(PATH + '/temp').length }, (_, str) => res.send(str)))

app.post('/api', upl.single('file'), api)
app.listen(PORT, () => console.log('TriCDN is now on http://localhost:' + PORT))

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function api (req, res) {
  if (!req.file) return res.send('<script>alert(".css / .js 파일만 가능"); window.location.replace("/upload")</script>')
  if (cooldown.includes(req.ip)) return res.send('<script>alert("업로드 30초 제한"); window.location.replace("/upload")</script>')
  const index = cooldown.push(req.ip) - 1
  setTimeout(() => {
    cooldown.splice(index, 1)
  }, 30000)

  const newpath = randstr({ length: 10, type: 'url-safe' }) + '.' + mime.getExtension(req.file.mimetype)
  link(req.file.path, PATH + '/cdn/' + newpath)
  res.redirect('/d/' + newpath)
}
