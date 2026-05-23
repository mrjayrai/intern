const express = require('express');
const router = express.Router();
const nonWorkerCtrl = require('../controllers/nonWorkerIdController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

router.post('/', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.create);
router.get('/', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.list);
router.get('/:id', authorize([ROLES.CANDIDATE, ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.get);
router.put('/:id', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.update);
router.post('/:id/approve', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.approve);
router.post('/:id/reject', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.reject);
router.post('/:id/complete', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), nonWorkerCtrl.complete);

module.exports = router;
