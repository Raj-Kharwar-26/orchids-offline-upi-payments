import { usePaymentStore } from '@/lib/payment-store';
import { formatCurrency, isValidAmount } from '@/lib/upi';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon, IndianRupeeIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function AmountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#e2e8f0' : '#1e293b';
  const { qrData, setAmount } = usePaymentStore();
  const [value, setValue] = useState('');

  if (!qrData) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No payment data. Go back and scan a QR.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} className="mt-4 rounded-xl bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleContinue = () => {
    if (!isValidAmount(value)) return;
    setAmount(parseFloat(value));
    router.push('/review');
  };

  const handleQuickAmount = (amt: number) => {
    setValue(amt.toString());
  };

  const valid = isValidAmount(value);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center px-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeftIcon size={20} color={iconColor} />
          </TouchableOpacity>
          <Text className="ml-3 text-lg font-semibold text-foreground">Enter Amount</Text>
        </View>

        <View className="mt-6 items-center px-5">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Text className="text-xl font-bold text-primary">
              {qrData.payeeName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="mt-3 text-base font-semibold text-foreground">{qrData.payeeName}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">{qrData.payeeVpa}</Text>
        </View>

        <View className="mt-8 items-center px-5">
          <View className="flex-row items-center">
            <IndianRupeeIcon size={28} color={iconColor} />
            <TextInput
              className="ml-1 min-w-[120px] text-center text-4xl font-bold text-foreground"
              value={value}
              onChangeText={(text) => setValue(text.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor={isDark ? '#475569' : '#cbd5e1'}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>
          {value && !valid && (
            <Text className="mt-2 text-sm text-destructive">Enter ₹1 – ₹1,00,000</Text>
          )}
        </View>

        <View className="mt-8 px-5">
          <Text className="mb-3 text-sm font-medium text-muted-foreground">Quick amounts</Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_AMOUNTS.map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => handleQuickAmount(amt)}
                className={`rounded-xl border px-5 py-3 ${
                  value === amt.toString()
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    value === amt.toString() ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {formatCurrency(amt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mt-8 px-5">
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!valid}
            className={`items-center rounded-2xl py-4 ${valid ? 'bg-primary' : 'bg-muted'}`}
            activeOpacity={0.8}
          >
            <Text className={`text-base font-bold ${valid ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
