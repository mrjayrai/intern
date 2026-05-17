const express = require('express');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateMiddleware');
const { validateRegister, validateLogin, validateRefreshToken } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', validateRequest(validateRegister), authController.register);
router.post('/login', validateRequest(validateLogin), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', validateRequest(validateRefreshToken), authController.refreshToken);

module.exports = router;
