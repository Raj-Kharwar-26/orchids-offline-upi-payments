export interface UpiQrData {
  payeeVpa: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  merchantCode?: string;
  currency?: string;
}

export function parseUpiQr(data: string): UpiQrData | null {
  if (!data.startsWith('upi://pay')) {
    return null;
  }

  try {
    const url = new URL(data);
    const params = url.searchParams;

    const payeeVpa = params.get('pa');
    const payeeName = params.get('pn') || params.get('pa') || '';

    if (!payeeVpa) return null;

    const amountStr = params.get('am');
    const amount = amountStr ? parseFloat(amountStr) : undefined;

    return {
      payeeVpa,
      payeeName: decodeURIComponent(payeeName),
      amount: amount && !isNaN(amount) ? amount : undefined,
      transactionNote: params.get('tn') || undefined,
      merchantCode: params.get('mc') || undefined,
      currency: params.get('cu') || 'INR',
    };
  } catch {
    return null;
  }
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function isValidAmount(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 100000;
}
