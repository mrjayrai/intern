const express = require('express');
const router = express.Router();
const { listNDAs, submitNDA } = require('../controllers/ndaController');

router.get('/', listNDAs);
router.post('/', submitNDA);

module.exports = router;
