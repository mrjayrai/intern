const express = require('express');
const router = express.Router();
const accessCtrl = require('../controllers/accessProvisionController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

router.post('/', authorize([ROLES.HR, ROLES.IT, ROLES.SUPER_ADMIN]), accessCtrl.create);
router.get('/', authorize([ROLES.HR, ROLES.IT, ROLES.SUPER_ADMIN]), accessCtrl.list);
router.get('/:id', authorize([ROLES.HR, ROLES.IT, ROLES.SUPER_ADMIN, ROLES.CANDIDATE]), accessCtrl.get);
router.put('/:id', authorize([ROLES.IT, ROLES.HR, ROLES.SUPER_ADMIN]), accessCtrl.update);
router.post('/:id/start', authorize([ROLES.IT, ROLES.SUPER_ADMIN]), accessCtrl.start);
router.post('/:id/complete', authorize([ROLES.IT, ROLES.SUPER_ADMIN]), accessCtrl.complete);

module.exports = router;
