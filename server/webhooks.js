import express from 'express';
const router = express.Router();

router.post('/server/webhooks/paypal', async (req, res) => {
  console.warn('PayPal webhook endpoint called but integration is disabled');
  return res.status(410).json({
    error: 'PayPal integration has been removed',
    message: 'This endpoint is no longer active'
  });
});

router.get('/server/admin/webhooks', (req, res) => {
  return res.status(410).json({
    error: 'PayPal webhooks disabled',
    message: 'PayPal integration has been removed'
  });
});

export default router;
