const express = require('express')
const router = express.Router()

const checkLogin = require('../middlewares/check').checkLogin

// GET /signout
router.get('/', checkLogin, function(req, res, next) {
  res.send('登出')
})

module.exports = router