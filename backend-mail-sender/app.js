const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

require('dotenv').config();
require('./config/db')();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const emailRouter = require('./routes/emailRoutes');
const emailConfigRouter = require('./routes/emailConfigRoutes');
const templateRouter = require('./routes/templateRoutes');
const authRoutes = require('./routes/authRoutes.js');
const resumeRoutes = require("./routes/resumeRoutes.js");
const app = express();

const cors = require('cors');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));

// app.use(cors({
//   origin: 'http://localhost:3001',
//   credentials: true
// }));

app.use(cors({
  origin: "*"
}))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/email', emailRouter);
app.use('/api/email/config/v1', emailConfigRouter);
app.use('/api/email/templates/v1', templateRouter);
app.use("/api/auth/v1", authRoutes);
app.use("/api/resume/v1", resumeRoutes);


// catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// global error handler (API + UI safe)
app.use(function(err, req, res, next) {
  console.error(err.stack);

  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }

  // UI error
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
