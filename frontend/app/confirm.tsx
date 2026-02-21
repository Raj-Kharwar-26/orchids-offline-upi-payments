import { usePaymentStore } from '@/lib/payment-store';
import { formatCurrency } from '@/lib/upi';
import { useRouter } from 'expo-router';
import {
  PhoneIcon,
  HashIcon,
  CheckCircleIcon,
  CopyIcon,
  PhoneCallIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { qrData, amount, transactionId, mode, instruction } = usePaymentStore();
  const [copied, setCopied] = useState(false);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(slideUp, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  if (!qrData || !amount || !transactionId || !instruction) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No transaction data.</Text>
        <TouchableOpacity onPress={() => router.replace('/')} className="mt-4 rounded-xl bg-primary px-6 py-3">
          <Text className="font-semibold text-primary-foreground">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const steps = instruction.split('\n').filter((s: string) => s.trim().length > 0);

  const handleCopy = async () => {
    const text = steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const handleDialUssd = () => {
    if (Platform.OS !== 'web') {
      Linking.openURL('tel:*99%23');
    }
  };

  const handleCallIvr = (number: string) => {
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${number.replace(/-/g, '')}`);
    }
  };

  const initials = qrData.payeeName
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
    >
      <View className="items-center px-6 pt-10 pb-8">
        <Animated.View
          style={{
            transform: [{ scale: checkScale }],
            opacity: checkOpacity,
          }}
          className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-emerald-500"
        >
          <CheckCircleIcon size={44} color="#ffffff" strokeWidth={2.5} />
        </Animated.View>

        <Animated.View
          style={{ transform: [{ translateY: slideUp }], opacity: fadeIn }}
          className="items-center w-full"
        >
          <Text className="text-2xl font-bold text-foreground">Payment Initiated</Text>
          <Text className="mt-1.5 text-sm text-muted-foreground">
            Complete via {mode === 'ussd' ? 'USSD *99#' : 'IVR call'} to finish
          </Text>

          <View className="mt-8 w-full rounded-3xl bg-card overflow-hidden">
            <View className="items-center py-6 px-4 border-b border-border">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-3">
                <Text className="text-xl font-bold text-primary-foreground">{initials}</Text>
              </View>
              <Text className="text-base font-semibold text-foreground">{qrData.payeeName}</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">{qrData.payeeVpa}</Text>
            </View>

            <View className="px-5 py-5 items-center border-b border-border">
              <Text className="text-xs text-muted-foreground mb-1">Amount</Text>
              <Text className="text-4xl font-bold text-foreground">{formatCurrency(amount)}</Text>
            </View>

            <View className="flex-row">
              <View className="flex-1 items-center py-4 border-r border-border">
                <Text className="text-xs text-muted-foreground mb-1">Method</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {mode === 'ussd' ? 'USSD *99#' : 'IVR Call'}
                </Text>
              </View>
              <View className="flex-1 items-center py-4">
                <Text className="text-xs text-muted-foreground mb-1">Txn Ref</Text>
                <Text className="text-xs font-mono text-muted-foreground">
                  {transactionId.slice(0, 10)}…
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 w-full">
            {mode === 'ussd' ? (
              <TouchableOpacity
                onPress={handleDialUssd}
                className="flex-row items-center justify-between rounded-2xl bg-primary px-5 py-4"
                activeOpacity={0.85}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                    <HashIcon size={18} color="#fff" />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-primary-foreground">Dial *99# Now</Text>
                    <Text className="text-xs text-primary-foreground/70">Works without internet</Text>
                  </View>
                </View>
                <ArrowRightIcon size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View className="gap-3">
                <TouchableOpacity
                  onPress={() => handleCallIvr('08045163666')}
                  className="flex-row items-center justify-between rounded-2xl bg-primary px-5 py-4"
                  activeOpacity={0.85}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                      <PhoneCallIcon size={18} color="#fff" />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-primary-foreground">080-4516-3666</Text>
                      <Text className="text-xs text-primary-foreground/70">SBI, HDFC, ICICI, Axis</Text>
                    </View>
                  </View>
                  <ArrowRightIcon size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCallIvr('6366200200')}
                  className="flex-row items-center justify-between rounded-2xl border border-primary px-5 py-4 bg-primary/5"
                  activeOpacity={0.85}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                      <PhoneIcon size={18} color={isDark ? '#818cf8' : '#6366f1'} />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-primary">6366-200-200</Text>
                      <Text className="text-xs text-muted-foreground">Canara Bank, PNB, NSDL</Text>
                    </View>
                  </View>
                  <ArrowRightIcon size={20} color={isDark ? '#818cf8' : '#6366f1'} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="mt-4 w-full rounded-2xl border border-border overflow-hidden">
            <TouchableOpacity
              onPress={() => setStepsExpanded((v) => !v)}
              className="flex-row items-center justify-between px-4 py-3.5 bg-card"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-2">
                {mode === 'ussd' ? (
                  <HashIcon size={16} color={isDark ? '#818cf8' : '#6366f1'} />
                ) : (
                  <PhoneIcon size={16} color={isDark ? '#818cf8' : '#6366f1'} />
                )}
                <Text className="text-sm font-semibold text-foreground">Step-by-step guide</Text>
              </View>
              {stepsExpanded ? (
                <ChevronUpIcon size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              ) : (
                <ChevronDownIcon size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              )}
            </TouchableOpacity>

            {stepsExpanded && (
              <View className="px-4 py-4 bg-primary/5 gap-3">
                {steps.map((step: string, index: number) => (
                  <View key={index} className="flex-row">
                    <View className="mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-primary/20 shrink-0">
                      <Text className="text-xs font-bold text-primary">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm leading-5 text-foreground">{step}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={handleCopy}
                  className="mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-secondary py-2.5"
                >
                  <CopyIcon size={14} color={isDark ? '#e2e8f0' : '#1e293b'} />
                  <Text className="text-xs font-medium text-foreground">
                    {copied ? 'Copied!' : 'Copy steps'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/status')}
            className="mt-4 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-border py-3.5"
            activeOpacity={0.8}
          >
            <Text className="text-sm font-semibold text-foreground">Track Payment Status</Text>
            <ArrowRightIcon size={16} color={isDark ? '#e2e8f0' : '#1e293b'} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            className="mt-3 items-center py-2"
          >
            <Text className="text-sm text-muted-foreground">Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
