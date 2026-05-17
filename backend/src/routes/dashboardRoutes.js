const express = require('express');
const router = express.Router();
const { getActivity, getDashboard, getFunnel, getMonthlyTrends } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getDashboard);
router.get('/activity', getActivity);
router.get('/funnel', getFunnel);
router.get('/trends', getMonthlyTrends);

module.exports = router;
