import { usePaymentStore } from '@/lib/payment-store';
import { formatCurrency, generateUssdSteps, generateIvrSteps, generateLocalTxnId } from '@/lib/upi';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon, UserIcon, HashIcon, IndianRupeeIcon, FileTextIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const { qrData, amount, setTransactionResult } = usePaymentStore();
  const [selectedMode, setSelectedMode] = useState<'ussd' | 'ivr'>('ussd');

  if (!qrData || !amount) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Missing payment data.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} className="mt-4 rounded-xl bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirm = () => {
    const txnId = generateLocalTxnId();
    const steps = selectedMode === 'ussd'
      ? generateUssdSteps(qrData.payeeVpa, amount)
      : generateIvrSteps(qrData.payeeVpa, amount);

    setTransactionResult(txnId, selectedMode, steps.join('\n'));
    router.replace('/confirm');
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }}
    >
      <View className="flex-row items-center px-5">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeftIcon size={20} color={iconColor} />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-semibold text-foreground">Review Payment</Text>
      </View>

      <View className="mt-6 items-center px-5">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <Text className="text-2xl font-bold text-primary-foreground">
            {qrData.payeeName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="mt-3 text-lg font-bold text-foreground">{qrData.payeeName}</Text>
        <Text className="mt-1 text-3xl font-bold text-primary">{formatCurrency(amount)}</Text>
      </View>

      <View className="mt-6 mx-5 rounded-2xl bg-card p-4">
        <DetailRow icon={<UserIcon size={18} color={mutedColor} />} label="Payee" value={qrData.payeeName} />
        <DetailRow icon={<HashIcon size={18} color={mutedColor} />} label="UPI ID" value={qrData.payeeVpa} />
        <DetailRow
          icon={<IndianRupeeIcon size={18} color={mutedColor} />}
          label="Amount"
          value={formatCurrency(amount)}
        />
        {qrData.transactionNote && (
          <DetailRow
            icon={<FileTextIcon size={18} color={mutedColor} />}
            label="Note"
            value={qrData.transactionNote}
            last
          />
        )}
      </View>

      <View className="mt-6 px-5">
        <Text className="mb-3 text-sm font-semibold text-muted-foreground">Payment Method</Text>
        <View className="gap-3">
          <TouchableOpacity
            onPress={() => setSelectedMode('ussd')}
            className={`rounded-xl border p-4 ${
              selectedMode === 'ussd' ? 'border-primary bg-primary/10' : 'border-border bg-card'
            }`}
          >
            <Text className={`text-base font-semibold ${selectedMode === 'ussd' ? 'text-primary' : 'text-foreground'}`}>
              USSD (*99#)
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Dial *99# and follow prompts to authorize
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedMode('ivr')}
            className={`rounded-xl border p-4 ${
              selectedMode === 'ivr' ? 'border-primary bg-primary/10' : 'border-border bg-card'
            }`}
          >
            <Text className={`text-base font-semibold ${selectedMode === 'ivr' ? 'text-primary' : 'text-foreground'}`}>
              IVR (Phone Call)
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Receive a call and enter UPI PIN via keypad
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-8 px-5">
          <TouchableOpacity
            onPress={handleConfirm}
            className="items-center rounded-2xl bg-primary py-4"
            activeOpacity={0.8}
          >
            <Text className="text-base font-bold text-primary-foreground">
              Confirm & Get Instructions
            </Text>
          </TouchableOpacity>
      </View>

      <View className="mt-4 px-5">
        <Text className="text-center text-xs text-muted-foreground">
          No UPI PIN is collected in this app.{'\n'}Authorization happens through your bank.
        </Text>
      </View>
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center py-3 ${!last ? 'border-b border-border' : ''}`}>
      <View className="mr-3">{icon}</View>
      <Text className="w-16 text-xs text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}
