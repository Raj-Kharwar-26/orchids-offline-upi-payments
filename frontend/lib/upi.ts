export interface UpiQrData {
  payeeVpa: string;
  payeeName: string;
  amount?: number;
  transactionNote?: string;
  merchantCode?: string;
  currency?: string;
}

function nameFromVpa(vpa: string): string {
  const local = vpa.split('@')[0] || vpa;
  return local
    .replace(/[._-]/g, ' ')
    .replace(/\d+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ') || vpa;
}

export function parseUpiQr(data: string): UpiQrData | null {
  if (!data.startsWith('upi://pay')) {
    return null;
  }

  try {
    const url = new URL(data);
    const params = url.searchParams;

    const payeeVpa = params.get('pa');
    if (!payeeVpa) return null;

    const rawName = params.get('pn');
    const payeeName = rawName
      ? decodeURIComponent(rawName)
      : nameFromVpa(payeeVpa);

    const amountStr = params.get('am');
    const amount = amountStr ? parseFloat(amountStr) : undefined;

    return {
      payeeVpa,
      payeeName,
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

export function generateUssdSteps(vpa: string, amount: number): string[] {
  return [
    'Dial *99# from the SIM linked to your bank account.',
    'Select Option 1 → "Send Money".',
    `Choose "UPI ID" and enter: ${vpa}`,
    `Enter amount: ₹${amount}`,
    'Enter a remark or press 1 to skip.',
    'Enter your UPI PIN to authorize the payment.',
    'You will see a confirmation message and receive an SMS.',
  ];
}

export function generateIvrSteps(vpa: string, amount: number): string[] {
  return [
    'Call 080-4516-3666 from your registered mobile number.\n(SBI, HDFC, ICICI, Axis, IDFC First)\nOr call 6366-200-200 (Canara, PNB, NSDL)',
    'Select your preferred language.',
    'Choose "Money Transfer" or "Send Money".',
    `Enter recipient mobile number or UPI ID: ${vpa}`,
    `Enter amount: ₹${amount}`,
    'Enter your UPI PIN using the keypad to authorize.',
    'You will hear a confirmation and receive an SMS.',
  ];
}

export function generateLocalTxnId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `txn-${ts}-${rand}`;
}
