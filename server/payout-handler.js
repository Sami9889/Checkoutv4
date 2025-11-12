import fetch from 'node-fetch';

// Your bank account configuration
const BANK_DETAILS = {
  accountName: 'SAMRATH SINGH',
  accountNumber: '4760 6522',
  bsb: '062948',
  bicSwift: 'CTBAAU2S',
  bank: 'Commonwealth Bank',
  accountAddress: '2 ZUCCOTTI CRES, POINT COOK VIC 3030'
};

// Payment processing and payout handler
export async function processPayment(paymentData) {
  const { orderId, amount, currency, email, plan } = paymentData;
  
  // Calculate fees (2.9% + $0.30 for PayPal)
  const feePercent = 0.029;
  const feeFix = 0.30;
  const totalFee = (amount * feePercent) + feeFix;
  const netAmount = amount - totalFee;
  
  return {
    paymentId: orderId,
    amount: parseFloat(amount),
    currency: currency || 'AUD',
    gross: parseFloat(amount),
    fee: parseFloat(totalFee.toFixed(2)),
    net: parseFloat(netAmount.toFixed(2)),
    email: email,
    plan: plan,
    bankDetails: BANK_DETAILS,
    status: 'ready_for_payout',
    createdAt: new Date().toISOString()
  };
}

// Calculate payout amount (net after fees)
export function calculatePayout(amount) {
  const feePercent = 0.029;
  const feeFix = 0.30;
  const totalFee = (amount * feePercent) + feeFix;
  const netAmount = amount - totalFee;
  
  return {
    gross: parseFloat(amount).toFixed(2),
    fee: parseFloat(totalFee.toFixed(2)),
    net: parseFloat(netAmount.toFixed(2))
  };
}

// Get bank details for payout
export function getBankDetails() {
  return BANK_DETAILS;
}

// Format payout record
export function formatPayoutRecord(payment) {
  return {
    date: new Date().toISOString().split('T')[0],
    orderId: payment.paymentId,
    plan: payment.plan,
    customer: payment.email,
    amount: `$${payment.amount.toFixed(2)}`,
    fee: `$${payment.fee.toFixed(2)}`,
    payout: `$${payment.net.toFixed(2)}`,
    currency: payment.currency,
    status: 'processed'
  };
}

// Generate payout summary for your records
export function generatePayoutSummary(payments) {
  if (!Array.isArray(payments) || payments.length === 0) {
    return {
      period: new Date().toISOString().split('T')[0],
      transactions: 0,
      totalGross: 0,
      totalFees: 0,
      totalPayout: 0
    };
  }
  
  const totalGross = payments.reduce((sum, p) => sum + p.gross, 0);
  const totalFees = payments.reduce((sum, p) => sum + p.fee, 0);
  const totalPayout = payments.reduce((sum, p) => sum + p.net, 0);
  
  return {
    period: new Date().toISOString().split('T')[0],
    transactions: payments.length,
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    totalPayout: parseFloat(totalPayout.toFixed(2)),
    bankDetails: BANK_DETAILS
  };
}
