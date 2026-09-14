const express = require('express');
const authRoutes = require('./authRoutes');
const organizationRoutes = require('./organizationRoutes');
const memberRoutes = require('./memberRoutes');
const roleRoutes = require('./roleRoutes');
const departmentRoutes = require('./departmentRoutes');
const postRoutes = require('./postRoutes');
const invitationRoutes = require('./invitationRoutes');
const auditRoutes = require('./auditRoutes');
const invitationController = require('../controllers/invitationController');

const router = express.Router();

// Root health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication
router.use('/auth', authRoutes);

// Public invitation acceptance
router.post('/invitations/:token/accept', invitationController.acceptInvitation);

// Organization management
router.use('/organizations', organizationRoutes);

// Organization scoped resources
router.use('/organizations/:organizationId/members', memberRoutes);
router.use('/organizations/:organizationId/roles', roleRoutes);
router.use('/organizations/:organizationId/departments', departmentRoutes);
router.use('/organizations/:organizationId/posts', postRoutes);
router.use('/organizations/:organizationId/invitations', invitationRoutes);
router.use('/organizations/:organizationId/audit-logs', auditRoutes);

module.exports = router;
