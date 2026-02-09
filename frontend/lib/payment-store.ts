import { useCallback, useSyncExternalStore } from 'react';
import type { UpiQrData } from './upi';

interface PaymentState {
  qrData: UpiQrData | null;
  amount: number | null;
  transactionId: string | null;
  mode: 'ussd' | 'ivr' | null;
  instruction: string | null;
}

let state: PaymentState = {
  qrData: null,
  amount: null,
  transactionId: null,
  mode: null,
  instruction: null,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setQrData(data: UpiQrData) {
  state = { ...state, qrData: data, amount: data.amount ?? null };
  emitChange();
}

export function setAmount(amount: number) {
  state = { ...state, amount };
  emitChange();
}

export function setTransactionResult(transactionId: string, mode: 'ussd' | 'ivr', instruction: string) {
  state = { ...state, transactionId, mode, instruction };
  emitChange();
}

export function resetPayment() {
  state = { qrData: null, amount: null, transactionId: null, mode: null, instruction: null };
  emitChange();
}

export function usePaymentStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...snapshot,
    setQrData: useCallback(setQrData, []),
    setAmount: useCallback(setAmount, []),
    setTransactionResult: useCallback(setTransactionResult, []),
    resetPayment: useCallback(resetPayment, []),
  };
}
