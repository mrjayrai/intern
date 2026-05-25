const express = require('express');
const router = express.Router();
const ndaController = require('../controllers/ndaController');
const { uploadNda } = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authMiddleware);

router.post('/', authorize([ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), uploadNda, ndaController.createNda);
router.get('/', authorize([ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN, ROLES.CANDIDATE]), ndaController.listNdas);
router.get('/:id', authorize([ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN, ROLES.CANDIDATE]), ndaController.getNda);
router.put('/:id', authorize([ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), uploadNda, ndaController.updateNda);
router.delete('/:id', authorize([ROLES.SUPER_ADMIN]), ndaController.deleteNda);

router.post('/:id/sign', authorize([ROLES.CANDIDATE, ROLES.SUPER_ADMIN]), ndaController.signNda);
router.post('/:id/approve', authorize([ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), ndaController.approveNda);
router.post('/:id/reject', authorize([ROLES.HR, ROLES.COMPLIANCE, ROLES.SUPER_ADMIN]), ndaController.rejectNda);
router.post('/:id/archive', authorize([ROLES.HR, ROLES.SUPER_ADMIN]), ndaController.archiveNda);

module.exports = router;

