const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const connectDB = require('./config/db');

require('dotenv').config();

const app = express();

// Necesario para obtener el protocolo correcto (http/https) cuando estamos detrás de ngrok u otro proxy
app.set('trust proxy', true);

// ==============================
// Conexión a la base de datos
// ==============================
connectDB();

// ==============================
// Handlebars + Helpers
// ==============================
app.engine(
  'hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
      ifEq(a, b, options) {
        return a === b ? options.fn(this) : options.inverse(this);
      },
      json(context) {
        return JSON.stringify(context);
      }
    }
  })
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ==============================
// Middlewares
// ==============================
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// Sesión
// ==============================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
  })
);

// ==============================
// Rutas
// ==============================
const router = require('./routes');
app.use('/', router);

module.exports = app;
