import { maskSensitiveData } from './crypto-utils.js';

const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || 'NOT_CONFIGURED';
const BANK_ACCOUNT_ADDRESS = process.env.BANK_ACCOUNT_ADDRESS || 'NOT_CONFIGURED';
const BANK_BSB = process.env.BANK_BSB || '000000';
const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || '00000000';
const BANK_BIC_SWIFT = process.env.BANK_BIC_SWIFT || 'NOT_CONFIGURED';
const BANK_NAME = process.env.BANK_NAME || 'Commonwealth Bank of Australia';

export function getFullBankDetails() {
  return {
    accountName: BANK_ACCOUNT_NAME,
    accountAddress: BANK_ACCOUNT_ADDRESS,
    bsb: BANK_BSB,
    accountNumber: BANK_ACCOUNT_NUMBER,
    bicSwift: BANK_BIC_SWIFT,
    bank: BANK_NAME,
    currency: 'AUD'
  };
}

export function getMaskedBankDetails() {
  return {
    accountName: BANK_ACCOUNT_NAME,
    bsb: BANK_BSB,
    accountNumberMasked: maskSensitiveData(BANK_ACCOUNT_NUMBER, 4),
    bank: BANK_NAME,
    currency: 'AUD'
  };
}

export const BANK_DETAILS = getMaskedBankDetails();

export const PAYOUT_CONFIG = {
  note: "Internal bank transfer payment"
};

export const FEES = {
  paypal_percentage: 2.9,
  paypal_fixed: 0.30,
  platform_fee: 0.0
};

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

export function recordPayout(paymentData) {
  const payout = calculatePayout(paymentData.amount);
  const maskedDetails = getMaskedBankDetails();

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
    bankAccountMasked: maskedDetails.accountNumberMasked,
    bankBsb: maskedDetails.bsb
  };
}

export function generatePayoutReport(payouts) {
  const maskedDetails = getMaskedBankDetails();

  if (!payouts || payouts.length === 0) {
    return {
      period: new Date().toISOString(),
      count: 0,
      totalGross: 0,
      totalFees: 0,
      totalNet: 0,
      bankDetails: maskedDetails
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
    bankDetails: maskedDetails,
    payouts: payouts
  };
}
