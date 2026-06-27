// routes/index.js – Main router: mounts all sub-routes

const express  = require('express');
const router   = express.Router();

// Mount sub-routers
router.use('/', require('./auth'));
router.use('/', require('./tickets'));
router.use('/', require('./admin'));
router.use('/', require('./features'));

module.exports = router;