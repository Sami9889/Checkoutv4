import { getABN, maskABN } from './abn-config.js';

// Simple environment-based configuration
const ABN = process.env.ABN || '00000000000';
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Sami-S';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@sami-s.dev';

export const PAYOUT_CONFIG = {
  note: 'Internal bank transfer payment'
};

export const FEES = {
  transaction_percentage: 2.9,
  transaction_fixed: 0.30,
  platform_fee: 0.0
};

/**
 * Get basic business configuration
 */
export async function getBusinessConfig() {
  return {
    businessName: BUSINESS_NAME,
    abn: ABN,
    adminEmail: ADMIN_EMAIL
  };
}

/**
 * Get masked business configuration (safe for display)
 */
export async function getMaskedBusinessConfig() {
  return {
    businessName: BUSINESS_NAME,
    abnMasked: maskABN(),
    adminEmail: ADMIN_EMAIL
  };
}

/**
 * Calculate payout amounts
 */
export function calculatePayout(amount) {
  const amountNum = parseFloat(amount);
  const transactionPercentageFee = (amountNum * FEES.transaction_percentage) / 100;
  const transactionFixedFee = FEES.transaction_fixed;
  const totalFees = transactionPercentageFee + transactionFixedFee;
  const payoutAmount = amountNum - totalFees;

  return {
    originalAmount: parseFloat(amountNum.toFixed(2)),
    transactionPercentageFee: parseFloat(transactionPercentageFee.toFixed(2)),
    transactionFixedFee: transactionFixedFee,
    totalFees: parseFloat(totalFees.toFixed(2)),
    payoutAmount: parseFloat(payoutAmount.toFixed(2))
  };
}

/**
 * Record a payout
 */
export async function recordPayout(paymentData) {
  const payout = calculatePayout(paymentData.amount);

  const record = {
    id: 'PO-' + Date.now(),
    paymentId: paymentData.orderId,
    customerEmail: paymentData.email,
    plan: paymentData.plan,
    date: new Date().toISOString(),
    gross: payout.originalAmount,
    fees: payout.totalFees,
    net: payout.payoutAmount,
    status: 'pending_transfer'
  };

  return record;
}

/**
 * Generate payout report
 */
export async function generatePayoutReport(payouts) {
  if (!payouts || payouts.length === 0) {
    return {
      period: new Date().toISOString(),
      count: 0,
      totalGross: 0,
      totalFees: 0,
      totalNet: 0
    };
  }

  const totalGross = payouts.reduce((sum, p) => sum + (p.gross || 0), 0);
  const totalFees = payouts.reduce((sum, p) => sum + (p.fees || 0), 0);
  const totalNet = payouts.reduce((sum, p) => sum + (p.net || 0), 0);

  return {
    period: new Date().toISOString(),
    count: payouts.length,
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalNet: parseFloat(totalNet.toFixed(2)),
    payouts: payouts
  };
}

export default {
  getBusinessConfig,
  getMaskedBusinessConfig,
  calculatePayout,
  recordPayout,
  generatePayoutReport,
  FEES,
  PAYOUT_CONFIG
};
