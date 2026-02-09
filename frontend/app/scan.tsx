import { setQrData } from '@/lib/payment-store';
import { parseUpiQr } from '@/lib/upi';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  ArrowLeftIcon,
  ScanLineIcon,
  KeyboardIcon,
  FlashlightIcon,
  FlashlightOffIcon,
  ImageIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import jsQR from 'jsqr';

const DEMO_QRS = [
  {
    label: 'Demo Store - ₹150.00',
    sub: 'merchant@upi',
    qr: 'upi://pay?pa=merchant@upi&pn=Demo%20Store&am=150.00&cu=INR&tn=Test%20Payment',
  },
  {
    label: 'Fresh Mart (no amount)',
    sub: 'grocery@ybl',
    qr: 'upi://pay?pa=grocery@ybl&pn=Fresh%20Mart&cu=INR&tn=Groceries',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#e2e8f0' : '#1e293b';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const startScanAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanLineAnim]);

  const handleParsed = useCallback(
    (input: string) => {
      const data = input.trim();
      if (!data) return;

      const parsed = parseUpiQr(data);
      if (!parsed) {
        if (Platform.OS === 'web') {
          window.alert('Invalid QR data. Please paste a valid UPI QR string (starts with upi://pay).');
        } else {
          Alert.alert('Invalid QR', 'Not a valid UPI QR code.');
        }
        return;
      }

      setQrData(parsed);
      if (parsed.amount) {
        router.replace('/review');
      } else {
        router.replace('/amount');
      }
    },
    [router],
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scanned) return;
      setScanned(true);
      handleParsed(data);
      setTimeout(() => setScanned(false), 3000);
    },
    [scanned, handleParsed],
  );

  const handleImagePick = useCallback(async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        setScanning(true);
        const objectUrl = URL.createObjectURL(file);
        try {
          const decoded = await new Promise<string | null>((resolve, reject) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) { resolve(null); return; }
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
              resolve(code ? code.data : null);
            };
            img.onerror = () => reject(new Error('Failed to load'));
            img.src = objectUrl;
          });
          if (decoded) handleParsed(decoded);
          else window.alert('No QR code found in image.');
        } catch { window.alert('Failed to process image.'); }
        finally { setScanning(false); URL.revokeObjectURL(objectUrl); }
      };
      input.click();
      return;
    }

    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      setScanning(true);
      try {
        const { Camera } = await import('expo-camera');
        const results = await Camera.scanFromURLAsync(result.assets[0].uri, ['qr']);
        if (results.length > 0) {
          handleParsed(results[0].data);
        } else {
          Alert.alert('No QR Found', 'No QR code found in the image.');
        }
      } catch {
        Alert.alert('Error', 'Failed to scan QR from image.');
      } finally {
        setScanning(false);
      }
    }
  }, [handleParsed]);

  if (Platform.OS === 'web') {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
            >
              <ArrowLeftIcon size={20} color={iconColor} />
            </TouchableOpacity>
            <Text className="ml-3 text-lg font-semibold text-foreground">Scan QR Code</Text>
          </View>

          <View className="mt-8 items-center">
            <View className="mb-2 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <ScanLineIcon size={32} color="#6366f1" />
            </View>
            <Text className="text-center text-sm text-muted-foreground">
              Camera scanning requires a native device.{'\n'}Upload an image or paste UPI string below.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleImagePick}
            disabled={scanning}
            className="mt-6 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-8"
            activeOpacity={0.7}
          >
            {scanning ? (
              <View className="items-center gap-2">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="text-sm font-medium text-primary">Scanning QR from image...</Text>
              </View>
            ) : (
              <View className="items-center gap-3">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ImageIcon size={28} color="#6366f1" />
                </View>
                <Text className="text-base font-semibold text-foreground">Upload QR Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="mt-8">
            <Text className="mb-2 text-sm font-medium text-foreground">Or paste UPI QR string</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
              placeholder="upi://pay?pa=merchant@upi&pn=..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={qrInput}
              onChangeText={setQrInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => handleParsed(qrInput)}
              className="mt-3 items-center rounded-xl bg-primary py-3"
            >
              <Text className="font-semibold text-primary-foreground">Parse QR Data</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <Text className="mb-3 text-sm font-medium text-muted-foreground">Quick Demo Merchants</Text>
            {DEMO_QRS.map((demo, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleParsed(demo.qr)}
                className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card p-4"
                activeOpacity={0.7}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <KeyboardIcon size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{demo.label}</Text>
                  <Text className="text-xs text-muted-foreground">{demo.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 bg-background px-6"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeftIcon size={20} color={iconColor} />
          </TouchableOpacity>
          <Text className="ml-3 text-lg font-semibold text-foreground">Camera Permission</Text>
        </View>

        <View className="mt-20 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <ScanLineIcon size={40} color="#6366f1" />
          </View>
          <Text className="mb-2 text-center text-lg font-bold text-foreground">
            Camera Access Needed
          </Text>
          <Text className="mb-8 text-center text-sm text-muted-foreground">
            PayLite needs camera access to scan UPI QR codes for payments.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="w-full items-center rounded-2xl bg-primary py-4"
            activeOpacity={0.7}
          >
            <Text className="text-base font-bold text-primary-foreground">Allow Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImagePick}
            className="mt-3 w-full items-center rounded-2xl border border-border py-4"
            activeOpacity={0.7}
          >
            <Text className="text-base font-medium text-foreground">Upload QR Image Instead</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showManual) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-5">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setShowManual(false)}
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
            >
              <ArrowLeftIcon size={20} color={iconColor} />
            </TouchableOpacity>
            <Text className="ml-3 text-lg font-semibold text-foreground">Manual Entry</Text>
          </View>

          <View className="mt-8">
            <Text className="mb-2 text-sm font-medium text-foreground">Paste UPI QR string</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
              placeholder="upi://pay?pa=merchant@upi&pn=..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={qrInput}
              onChangeText={setQrInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => handleParsed(qrInput)}
              className="mt-3 items-center rounded-xl bg-primary py-3"
            >
              <Text className="font-semibold text-primary-foreground">Parse QR Data</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <Text className="mb-3 text-sm font-medium text-muted-foreground">Quick Demo Merchants</Text>
            {DEMO_QRS.map((demo, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleParsed(demo.qr)}
                className="mb-2 flex-row items-center gap-3 rounded-xl border border-border bg-card p-4"
                activeOpacity={0.7}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <KeyboardIcon size={20} color="#6366f1" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{demo.label}</Text>
                  <Text className="text-xs text-muted-foreground">{demo.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={torch}
        onCameraReady={startScanAnimation}
      >
        <View className="flex-1">
          <View
            className="absolute left-0 right-0 z-10 px-5"
            style={{ top: insets.top + 10 }}
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
              >
                <ArrowLeftIcon size={20} color="#fff" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-white">Scan QR Code</Text>
              <TouchableOpacity
                onPress={() => setTorch(!torch)}
                className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
              >
                {torch ? (
                  <FlashlightOffIcon size={20} color="#fbbf24" />
                ) : (
                  <FlashlightIcon size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1 items-center justify-center">
            <View
              style={{
                width: SCAN_AREA_SIZE,
                height: SCAN_AREA_SIZE,
                borderRadius: 24,
                borderWidth: 3,
                borderColor: '#6366f1',
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: '#6366f1',
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCAN_AREA_SIZE - 3],
                      }),
                    },
                  ],
                }}
              />
            </View>
            <Text className="mt-4 text-center text-sm text-white/80">
              Point your camera at a UPI QR code
            </Text>
          </View>

          <View
            className="absolute bottom-0 left-0 right-0 px-5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-center gap-6">
              <TouchableOpacity
                onPress={handleImagePick}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <ImageIcon size={22} color="#fff" />
                </View>
                <Text className="text-xs text-white/80">Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowManual(true)}
                className="items-center"
                activeOpacity={0.7}
              >
                <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <KeyboardIcon size={22} color="#fff" />
                </View>
                <Text className="text-xs text-white/80">Manual</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
