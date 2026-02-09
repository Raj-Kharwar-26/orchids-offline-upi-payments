import { usePaymentStore } from '@/lib/payment-store';
import { formatCurrency } from '@/lib/upi';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'expo-router';
import {
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  HomeIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_CONFIG = {
  created: { label: 'Created', color: '#64748b', Icon: ClockIcon },
  confirmed: { label: 'Confirmed', color: '#6366f1', Icon: ClockIcon },
  processing: { label: 'Processing', color: '#f59e0b', Icon: ClockIcon },
  success: { label: 'Payment Successful', color: '#22c55e', Icon: CheckCircle2Icon },
  failed: { label: 'Payment Failed', color: '#ef4444', Icon: XCircleIcon },
  pending: { label: 'Pending Verification', color: '#f59e0b', Icon: AlertTriangleIcon },
} as const;

type TransactionStatus = keyof typeof STATUS_CONFIG;

export default function StatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { qrData, amount, transactionId, resetPayment } = usePaymentStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['transaction-status', transactionId],
    queryFn: () =>
      apiRequest<{ id: string; status: TransactionStatus; updatedAt: string }>(
        `/api/transactions/${transactionId}/status`
      ),
    enabled: !!transactionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'success' || status === 'failed') return false;
      return 3000;
    },
  });

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

  const status = data?.status || 'confirmed';
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.Icon;
  const isFinal = status === 'success' || status === 'failed';

  const handleNewPayment = () => {
    resetPayment();
    router.replace('/');
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
    >
      <View className="items-center px-5 pt-8">
        <View
          className="h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: config.color + '1a' }}
        >
          <StatusIcon size={44} color={config.color} />
        </View>
        <Text className="mt-5 text-xl font-bold text-foreground">{config.label}</Text>
        {!isFinal && !isLoading && (
          <Text className="mt-2 text-sm text-muted-foreground">
            Checking every few seconds...
          </Text>
        )}
      </View>

      {(qrData || amount) && (
        <View className="mt-8 mx-5 rounded-2xl bg-card p-4">
          {qrData && (
            <View className="flex-row items-center justify-between border-b border-border pb-3">
              <Text className="text-xs text-muted-foreground">To</Text>
              <Text className="text-sm font-semibold text-foreground">{qrData.payeeName}</Text>
            </View>
          )}
          {amount && (
            <View className="flex-row items-center justify-between border-b border-border py-3">
              <Text className="text-xs text-muted-foreground">Amount</Text>
              <Text className="text-sm font-bold text-primary">{formatCurrency(amount)}</Text>
            </View>
          )}
          <View className="flex-row items-center justify-between pt-3">
            <Text className="text-xs text-muted-foreground">Status</Text>
            <Text className="text-sm font-semibold" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>
        </View>
      )}

      {isLoading && (
        <View className="mt-8 items-center">
          <ActivityIndicator size="large" color={isDark ? '#818cf8' : '#6366f1'} />
        </View>
      )}

      {status === 'success' && (
        <View className="mt-6 mx-5 rounded-2xl bg-primary/5 border border-primary/20 p-4">
          <Text className="text-center text-sm text-foreground">
            Payment was completed successfully. The merchant has been notified.
          </Text>
        </View>
      )}

      {status === 'failed' && (
        <View className="mt-6 mx-5 rounded-2xl bg-destructive/10 border border-destructive/20 p-4">
          <Text className="text-center text-sm text-foreground">
            Payment could not be processed. Please try again or contact your bank.
          </Text>
        </View>
      )}

      {status === 'pending' && (
        <View className="mt-6 mx-5 rounded-2xl bg-warning/10 border border-warning/20 p-4">
          <Text className="text-center text-sm text-foreground">
            Payment is pending bank verification. This may take a few minutes.
          </Text>
        </View>
      )}

      <View className="mt-8 px-5 gap-3">
        {!isFinal && (
          <TouchableOpacity
            onPress={() => refetch()}
            disabled={isRefetching}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-primary py-4"
            activeOpacity={0.8}
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={isDark ? '#818cf8' : '#6366f1'} />
            ) : (
              <RefreshCwIcon size={18} color={isDark ? '#818cf8' : '#6366f1'} />
            )}
            <Text className="text-base font-bold text-primary">Refresh Status</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleNewPayment}
          className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${isFinal ? 'bg-primary' : 'bg-secondary'}`}
          activeOpacity={0.8}
        >
          <HomeIcon size={18} color={isFinal ? '#ffffff' : (isDark ? '#e2e8f0' : '#1e293b')} />
          <Text className={`text-base font-bold ${isFinal ? 'text-primary-foreground' : 'text-foreground'}`}>
            New Payment
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
