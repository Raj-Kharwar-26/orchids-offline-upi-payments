import { resetPayment } from '@/lib/payment-store';
import { useRouter } from 'expo-router';
import {
  ScanLineIcon,
  ShieldCheckIcon,
  WifiOffIcon,
  PhoneIcon,
  MoonStarIcon,
  SunIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    resetPayment();
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
    >
      <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
        <View />
        <TouchableOpacity onPress={toggleColorScheme} className="rounded-full bg-secondary p-2.5">
          {isDark ? (
            <SunIcon size={18} color={iconColor} />
          ) : (
            <MoonStarIcon size={18} color={iconColor} />
          )}
        </TouchableOpacity>
      </View>

      <View className="items-center px-6 pb-8 pt-6">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary">
          <ScanLineIcon size={40} color="#ffffff" />
        </View>
        <Text className="text-3xl font-bold text-foreground">PayLite UPI</Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Offline QR scan with assisted UPI payments
        </Text>
      </View>

      <View className="px-5">
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          className="items-center rounded-2xl bg-primary px-6 py-5"
          activeOpacity={0.8}
        >
          <ScanLineIcon size={32} color="#ffffff" />
          <Text className="mt-3 text-xl font-bold text-primary-foreground">Scan QR Code</Text>
          <Text className="mt-1 text-sm text-primary-foreground/80">
            Scan any Bharat UPI QR to pay
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-8 px-5">
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          How it works
        </Text>
        <View className="gap-3">
          <FeatureCard
            icon={<WifiOffIcon size={22} color={mutedColor} />}
            title="Offline QR Scan"
            description="Scan any UPI QR code without internet"
          />
          <FeatureCard
            icon={<PhoneIcon size={22} color={mutedColor} />}
            title="Assisted Payment"
            description="Complete via USSD (*99#) or IVR call"
          />
          <FeatureCard
            icon={<ShieldCheckIcon size={22} color={mutedColor} />}
            title="Secure & Compliant"
            description="No PIN collected in-app. Bank-authorized."
          />
        </View>
      </View>

      <View className="mt-8 items-center px-5">
        <Text className="text-center text-xs text-muted-foreground">
          PayLite UPI is an assistive layer. Final payment authorization{'\n'}happens via your bank
          through USSD or IVR.
        </Text>
      </View>
    </ScrollView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center gap-4 rounded-xl bg-card p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">{icon}</View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="mt-0.5 text-xs text-muted-foreground">{description}</Text>
      </View>
    </View>
  );
}
