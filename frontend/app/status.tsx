import { usePaymentStore, setPaymentStatus } from '@/lib/payment-store';
import { formatCurrency } from '@/lib/upi';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'expo-router';
import {
  CheckCircle2Icon,
  HomeIcon,
  HashIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  PhoneCallIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TxnStatus = 'created' | 'confirmed' | 'processing' | 'success' | 'failed' | 'pending';

const STATUS_LABELS: Record<TxnStatus, string> = {
  created: 'Transaction Created',
  confirmed: 'Payment Confirmed',
  processing: 'Processing…',
  success: 'Payment Successful',
  failed: 'Payment Failed',
  pending: 'Awaiting Confirmation',
};

const STATUS_SUBLABELS: Record<TxnStatus, string> = {
  created: 'Waiting for bank authorization',
  confirmed: 'Bank received your request',
  processing: 'Your bank is processing the transfer',
  success: 'Money has been transferred',
  failed: 'Transaction could not be completed',
  pending: 'Complete the USSD/IVR steps',
};

const TERMINAL_STATUSES: TxnStatus[] = ['success', 'failed'];

export default function StatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { qrData, amount, transactionId, dbTransactionId, mode, paymentStatus, resetPayment } =
    usePaymentStore();

  const [liveStatus, setLiveStatus] = useState<TxnStatus>(
    (paymentStatus as TxnStatus) ?? 'confirmed'
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTerminal = TERMINAL_STATUSES.includes(liveStatus);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    if (!isTerminal) pulse.start();
    else pulse.stop();
    return () => pulse.stop();
  }, [isTerminal]);

  const fetchStatus = async () => {
    if (!dbTransactionId) return;
    try {
      const data = await apiRequest<{ status: string; updatedAt: string }>(
        `/api/transactions/${dbTransactionId}/status`
      );
      const s = data.status as TxnStatus;
      setLiveStatus(s);
      setPaymentStatus(s);
      setUpdatedAt(data.updatedAt);
      setPollCount((c) => c + 1);
      if (TERMINAL_STATUSES.includes(s) && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {}
  };

  useEffect(() => {
    if (!dbTransactionId) return;
    fetchStatus();
    if (!isTerminal) {
      pollRef.current = setInterval(fetchStatus, 2500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [dbTransactionId]);

  if (!transactionId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No transaction to check.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} className="mt-4 rounded-xl bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleNewPayment = () => {
    resetPayment();
    router.replace('/');
  };

  const handleCheckBalance = () => {
    if (Platform.OS !== 'web') {
      Linking.openURL('tel:*99%2399%23');
    }
  };

  const StatusIcon = () => {
    if (liveStatus === 'success') {
      return <CheckCircle2Icon size={44} color="#22c55e" strokeWidth={2} />;
    }
    if (liveStatus === 'failed') {
      return <XCircleIcon size={44} color="#ef4444" strokeWidth={2} />;
    }
    return (
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <ClockIcon size={44} color={isDark ? '#818cf8' : '#6366f1'} strokeWidth={2} />
      </Animated.View>
    );
  };

  const statusBgColor =
    liveStatus === 'success'
      ? 'bg-emerald-500/10'
      : liveStatus === 'failed'
      ? 'bg-red-500/10'
      : 'bg-primary/10';

  const statusTextColor =
    liveStatus === 'success'
      ? 'text-emerald-600'
      : liveStatus === 'failed'
      ? 'text-red-500'
      : 'text-primary';

  const steps: TxnStatus[] = ['confirmed', 'processing', 'success'];
  const stepLabels = ['Initiated', 'Processing', 'Complete'];

  const currentStep =
    liveStatus === 'success'
      ? 3
      : liveStatus === 'processing'
      ? 2
      : liveStatus === 'failed'
      ? -1
      : 1;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
    >
      <View className="items-center px-6 pb-4">
        <View className={`h-20 w-20 items-center justify-center rounded-full ${statusBgColor} mb-4`}>
          <StatusIcon />
        </View>
        <Text className={`text-xl font-bold ${statusTextColor}`}>
          {STATUS_LABELS[liveStatus]}
        </Text>
        <Text className="mt-1.5 text-sm text-center text-muted-foreground">
          {STATUS_SUBLABELS[liveStatus]}
        </Text>

        {!isTerminal && dbTransactionId && (
          <View className="mt-3 flex-row items-center gap-1.5">
            <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
              <RefreshCwIcon size={12} color={isDark ? '#64748b' : '#94a3b8'} />
            </Animated.View>
            <Text className="text-xs text-muted-foreground">
              Auto-refreshing{pollCount > 0 ? ` · checked ${pollCount}×` : ''}
            </Text>
          </View>
        )}
      </View>

      {liveStatus !== 'failed' && (
        <View className="mx-5 mb-6">
          <View className="flex-row items-center justify-between">
            {steps.map((_, i) => (
              <View key={i} className="items-center flex-1">
                <View
                  className={`h-8 w-8 rounded-full items-center justify-center ${
                    i < currentStep
                      ? 'bg-emerald-500'
                      : i === currentStep - 1 && !isTerminal
                      ? 'bg-primary'
                      : 'bg-secondary'
                  }`}
                >
                  {i < currentStep ? (
                    <CheckCircle2Icon size={16} color="#fff" strokeWidth={2.5} />
                  ) : (
                    <Text className={`text-xs font-bold ${i === currentStep - 1 ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text className="mt-1.5 text-xs text-muted-foreground">{stepLabels[i]}</Text>
              </View>
            ))}
          </View>
          <View className="absolute top-4 left-12 right-12 h-0.5 bg-border -z-10" />
        </View>
      )}

      <View className="mx-5 rounded-2xl bg-card overflow-hidden mb-5">
        {qrData && (
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-border">
            <Text className="text-xs text-muted-foreground">To</Text>
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-md bg-primary/20">
                <Text className="text-xs font-bold text-primary">
                  {qrData.payeeName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-foreground">{qrData.payeeName}</Text>
            </View>
          </View>
        )}
        {qrData && (
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-border">
            <Text className="text-xs text-muted-foreground">UPI ID</Text>
            <Text className="text-xs font-mono text-foreground">{qrData.payeeVpa}</Text>
          </View>
        )}
        {amount && (
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-border">
            <Text className="text-xs text-muted-foreground">Amount</Text>
            <Text className="text-sm font-bold text-foreground">{formatCurrency(amount)}</Text>
          </View>
        )}
        <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-border">
          <Text className="text-xs text-muted-foreground">Method</Text>
          <Text className="text-sm font-semibold text-foreground">
            {mode === 'ussd' ? 'USSD (*99#)' : 'IVR Call'}
          </Text>
        </View>
        {updatedAt && (
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="text-xs text-muted-foreground">Last updated</Text>
            <Text className="text-xs text-muted-foreground">
              {new Date(updatedAt).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      {!isTerminal && (
        <View className="mx-5 mb-5 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-4">
          <Text className="text-sm font-semibold text-foreground mb-1.5">
            Waiting for bank confirmation
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            After completing the {mode === 'ussd' ? '*99# USSD' : 'IVR'} steps, your bank will send
            an SMS. You can also dial *99*99# to check your balance.
          </Text>
        </View>
      )}

      {liveStatus === 'success' && (
        <View className="mx-5 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-4">
          <Text className="text-sm font-semibold text-emerald-600 mb-1">Payment Successful!</Text>
          <Text className="text-sm text-muted-foreground leading-5">
            Your payment to {qrData?.payeeName} was completed. Check your bank SMS for confirmation.
          </Text>
        </View>
      )}

      {liveStatus === 'failed' && (
        <View className="mx-5 mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-4">
          <Text className="text-sm font-semibold text-red-500 mb-1">Payment Failed</Text>
          <Text className="text-sm text-muted-foreground leading-5">
            The transaction could not be completed. Please try again or contact your bank.
          </Text>
        </View>
      )}

      <View className="px-5 gap-3">
        {Platform.OS !== 'web' && !isTerminal && (
          <TouchableOpacity
            onPress={handleCheckBalance}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-primary py-4"
            activeOpacity={0.8}
          >
            <HashIcon size={18} color={isDark ? '#818cf8' : '#6366f1'} />
            <Text className="text-base font-bold text-primary">Check Balance (*99*99#)</Text>
          </TouchableOpacity>
        )}

        {!isTerminal && dbTransactionId && (
          <TouchableOpacity
            onPress={fetchStatus}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-border py-3.5"
            activeOpacity={0.8}
          >
            <RefreshCwIcon size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <Text className="text-sm font-semibold text-muted-foreground">Refresh Status</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNewPayment}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4"
          activeOpacity={0.8}
        >
          <HomeIcon size={18} color="#ffffff" />
          <Text className="text-base font-bold text-primary-foreground">New Payment</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
