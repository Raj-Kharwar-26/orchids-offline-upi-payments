import { usePaymentStore } from '@/lib/payment-store';
import { formatCurrency } from '@/lib/upi';
import { useRouter } from 'expo-router';
import {
  CheckCircle2Icon,
  HomeIcon,
  PhoneIcon,
  HashIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { View, Text, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { qrData, amount, transactionId, mode, resetPayment } = usePaymentStore();

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

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
    >
      <View className="items-center px-5 pt-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2Icon size={44} color={isDark ? '#818cf8' : '#6366f1'} />
        </View>
        <Text className="mt-5 text-xl font-bold text-foreground">Instructions Sent</Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          Follow the {mode === 'ussd' ? 'USSD *99#' : 'IVR call'} steps to complete payment.{'\n'}
          No internet is needed for this step.
        </Text>
      </View>

      {(qrData || amount) && (
        <View className="mt-8 mx-5 rounded-2xl bg-card p-4">
          {qrData && (
            <View className="flex-row items-center justify-between border-b border-border pb-3">
              <Text className="text-xs text-muted-foreground">To</Text>
              <Text className="text-sm font-semibold text-foreground">{qrData.payeeName}</Text>
            </View>
          )}
          {qrData && (
            <View className="flex-row items-center justify-between border-b border-border py-3">
              <Text className="text-xs text-muted-foreground">UPI ID</Text>
              <Text className="text-sm text-foreground">{qrData.payeeVpa}</Text>
            </View>
          )}
          {amount && (
            <View className="flex-row items-center justify-between border-b border-border py-3">
              <Text className="text-xs text-muted-foreground">Amount</Text>
              <Text className="text-sm font-bold text-primary">{formatCurrency(amount)}</Text>
            </View>
          )}
          <View className="flex-row items-center justify-between pt-3">
            <Text className="text-xs text-muted-foreground">Method</Text>
            <Text className="text-sm font-semibold text-foreground">
              {mode === 'ussd' ? 'USSD (*99#)' : 'IVR Call'}
            </Text>
          </View>
        </View>
      )}

      <View className="mt-6 mx-5 rounded-2xl bg-primary/5 border border-primary/20 p-4">
        <Text className="text-sm font-semibold text-foreground mb-2">How to verify payment</Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          After completing the {mode === 'ussd' ? '*99# USSD' : 'IVR'} steps, you will receive an SMS confirmation from your bank. You can also check your balance by dialing *99*99#.
        </Text>
      </View>

      <View className="mt-8 px-5 gap-3">
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            onPress={handleCheckBalance}
            className="flex-row items-center justify-center gap-2 rounded-2xl border border-primary py-4"
            activeOpacity={0.8}
          >
            <HashIcon size={18} color={isDark ? '#818cf8' : '#6366f1'} />
            <Text className="text-base font-bold text-primary">Check Balance (*99*99#)</Text>
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
