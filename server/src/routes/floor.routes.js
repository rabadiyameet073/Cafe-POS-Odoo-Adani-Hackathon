
const express = require('express');
const router = express.Router();

const floorController = require('../controllers/floorController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleCheckMiddleware');
const { validateUUIDParam } = require('../middleware/validationMiddleware');

router.get('/', verifyToken, floorController.getAllFloors);


router.get('/:id', verifyToken, validateUUIDParam('id'), floorController.getFloorById);


router.post('/', verifyToken, requireRoles('admin'), floorController.createFloor);

router.put('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), floorController.updateFloor);

router.delete('/:id', verifyToken, validateUUIDParam('id'), requireRoles('admin'), floorController.deleteFloor);

module.exports = router;
