// Commonwealth Bank Account Configuration
// For receiving payments from PayPal payouts

export const BANK_DETAILS = {
  accountName: "SAMRATH SINGH",
  accountAddress: "2 ZUCCOTTI CRES, POINT COOK VIC 3030",
  bsb: "062948",
  accountNumber: "4760 6522",
  bicSwift: "CTBAAU2S",
  bank: "Commonwealth Bank of Australia",
  currency: "AUD"
};

// PayPal Payout Configuration
export const PAYOUT_CONFIG = {
  recipientEmail: process.env.PAYPAL_PAYOUT_EMAIL || "samrath@example.com",
  currency: "AUD",
  note: "Payment for plan subscription"
};

// Fee Configuration (PayPal standard rates)
export const FEES = {
  paypal_percentage: 2.9,  // 2.9% PayPal transaction fee
  paypal_fixed: 0.30,      // $0.30 fixed fee per transaction
  platform_fee: 0.0        // No additional platform fee
};

// Calculate amounts with PayPal standard fees
export function calculatePayout(amount) {
  const amountNum = parseFloat(amount);
  const paypalPercentageFee = (amountNum * FEES.paypal_percentage) / 100;
  const paypalFixedFee = FEES.paypal_fixed;
  const totalFees = paypalPercentageFee + paypalFixedFee;
  const payoutAmount = amountNum - totalFees;
  
  return {
    originalAmount: parseFloat(amountNum.toFixed(2)),
    paypalPercentageFee: parseFloat(paypalPercentageFee.toFixed(2)),
    paypalFixedFee: paypalFixedFee,
    totalFees: parseFloat(totalFees.toFixed(2)),
    payoutAmount: parseFloat(payoutAmount.toFixed(2))
  };
}

// Track payout for record keeping
export function recordPayout(paymentData) {
  const payout = calculatePayout(paymentData.amount);
  
  return {
    id: 'PO-' + Date.now(),
    paymentId: paymentData.orderId,
    customerEmail: paymentData.email,
    plan: paymentData.plan,
    date: new Date().toISOString(),
    gross: payout.originalAmount,
    fees: payout.totalFees,
    net: payout.payoutAmount,
    status: 'pending_transfer',
    bankAccount: BANK_DETAILS.accountNumber,
    bankBsb: BANK_DETAILS.bsb
  };
}

// Generate payout summary for your records
export function generatePayoutReport(payouts) {
  if (!payouts || payouts.length === 0) {
    return {
      period: new Date().toISOString(),
      count: 0,
      totalGross: 0,
      totalFees: 0,
      totalNet: 0,
      bankDetails: BANK_DETAILS
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
    bankDetails: BANK_DETAILS,
    payouts: payouts
  };
}
