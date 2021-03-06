const path = require('path')
const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const config = require('config-lite')(__dirname)
const routes = require('./routes')
const pkg = require('./package')
const winston = require('winston')
const expressWinston = require('express-winston')

const app = express()

// 设置模板目录及引擎
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'public')))
// sessionk中间件
app.use(
  session({
    name: config.session.key,
    secret: config.session.secret,
    saveUninitialized: false,
    cookie: {
      maxAge: config.session.maxAge
    },
    store: new MongoStore({
      url: config.mongodb
    }),
    resave: true
  })
)
// flashk中间件
app.use(flash())
// 处理表单及文件上传的中间件
app.use(
  require('express-formidable')({
    uploadDir: path.join(__dirname, 'public/img'),
    keepExtensions: true
  })
)

// 设置模板全局常量
app.locals.blog = {
  title: pkg.name,
  description: pkg.description
}
// 添加模板必需的三个变量
app.use(function(req, res, next) {
  res.locals.user = req.session.user
  res.locals.success = req.flash('success').toString()
  res.locals.error = req.flash('error').toString()
  next()
})
// 路由
app.use(
  expressWinston.logger({
    winstonInstance: winston.createLogger({
      transports: [
        new winston.transports.Console({
          json: true,
          colorize: true
        }),
        new winston.transports.File({
          filename: 'logs/success.log'
        })
      ]
    }),
    exceptionToMeta: function(err) {
      return err
    }
  })
)
routes(app)
app.use(
  expressWinston.errorLogger({
    winstonInstance: winston.createLogger({
      transports: [
        new winston.transports.Console({
          json: true,
          colorize: true
        }),
        new winston.transports.File({
          filename: 'logs/error.log'
        })
      ]
    }),
    exceptionToMeta: function(err) {
      return err
    }
  })
)

app.use(function(err, req, res, next) {
  console.error(err)
  req.flash('error', err.message)
  res.redirect('/posts')
})

// 监听
if (module.parent) {
  module.exports = app
} else {
  app.listen(config.port, function() {
    console.log(`${pkg.name} listening on port ${config.port}`)
  })
}
