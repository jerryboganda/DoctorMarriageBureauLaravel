import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import {
  ChevronLeftIcon, CreditCardIcon, CheckCircleIcon, StarIcon,
  CrownIcon, XIcon, ShieldIcon, SparklesIcon, HeartIcon, MessageCircleIcon,
  EyeIcon, BookmarkIcon, ChevronRightIcon, GiftIcon, AlertCircleIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';

interface Package {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  duration_days: number;
  features: string[];
  is_popular?: boolean;
  contact_limit?: number;
  interest_limit?: number;
  shortlist_limit?: number;
  profile_highlights?: number;
  support_priority?: string;
}

const PaymentScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchPackages();
    fetchPaymentMethods();
    fetchWalletBalance();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      if (response.data.result) {
        const packagesData = response.data.data.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          price: parseFloat(pkg.price),
          original_price: pkg.original_price ? parseFloat(pkg.original_price) : undefined,
          duration_days: pkg.duration || 30,
          features: pkg.features ? JSON.parse(pkg.features) : [],
          is_popular: pkg.is_featured === 1,
          contact_limit: pkg.max_contact_view || 0,
          interest_limit: pkg.max_interest || 0,
          shortlist_limit: pkg.max_shortlist || 0,
          profile_highlights: pkg.profile_highlight_days || 0,
          support_priority: pkg.support_priority || 'Standard',
        }));
        setPackages(packagesData);

        // Pre-select if package ID passed
        if (params.packageId) {
          const preSelected = packagesData.find((p: Package) => p.id === parseInt(params.packageId as string));
          if (preSelected) setSelectedPackage(preSelected);
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/member/payment-methods');
      if (response.data.result) {
        setPaymentMethods(response.data.data || []);
      }
    } catch (error) {
      // Default payment methods
      setPaymentMethods([
        { id: 'wallet', name: 'Wallet Balance', icon: 'wallet' },
        { id: 'card', name: 'Credit/Debit Card', icon: 'card' },
        { id: 'bank', name: 'Bank Transfer', icon: 'bank' },
      ]);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await api.get('/member/my-wallet-balance');
      if (response.data.result) {
        setWalletBalance(parseFloat(response.data.data?.balance || response.data.balance) || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert(t('common.error'), t('payment.enterCoupon'));
      return;
    }
    if (!selectedPackage) {
      Alert.alert(t('common.error'), t('payment.selectPackageFirst'));
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await api.post('/member/coupons/validate', {
        code: couponCode,
        package_id: selectedPackage.id,
      });

      if (response.data.result) {
        setCouponApplied(true);
        setDiscount(response.data.data.discount || 0);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('common.success'), `${t('payment.couponApplied')} PKR ${response.data.data.discount}`);
      } else {
        Alert.alert(t('payment.invalidCoupon'), response.data.message || t('payment.couponNotValid'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('payment.couponError'));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setDiscount(0);
  };

  const handleCheckout = () => {
    if (!selectedPackage) {
      Alert.alert(t('common.error'), t('payment.selectPackage'));
      return;
    }
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert(t('common.error'), t('payment.selectPaymentMethod'));
      return;
    }

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const finalAmount = (selectedPackage?.price || 0) - discount;

      if (selectedPaymentMethod === 'wallet' && walletBalance < finalAmount) {
        Alert.alert(t('payment.insufficientBalance'), t('payment.insufficientBalanceDesc'));
        setProcessing(false);
        return;
      }

      const response = await api.post('/member/package-purchase', {
        package_id: selectedPackage?.id,
        payment_method: selectedPaymentMethod,
        coupon_code: couponApplied ? couponCode : null,
      });

      if (response.data.result) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowPaymentModal(false);

        // If payment requires redirect (card/bank)
        if (response.data.data.payment_url) {
          await WebBrowser.openBrowserAsync(response.data.data.payment_url);
          Alert.alert(
            t('payment.completePayment'),
            t('payment.redirectPayment'),
            [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)') }]
          );
        } else {
          Alert.alert(
            t('common.success'),
            t('payment.subscribed', { name: selectedPackage?.name }),
            [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)') }]
          );
        }
      } else {
        Alert.alert(t('common.error'), response.data.message || t('payment.paymentFailed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('payment.processingFailed'));
    } finally {
      setProcessing(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const lower = feature.toLowerCase();
    if (lower.includes('contact')) return <EyeIcon size={16} color="#3b82f6" />;
    if (lower.includes('interest') || lower.includes('express')) return <HeartIcon size={16} color="#ef4444" />;
    if (lower.includes('message') || lower.includes('chat')) return <MessageCircleIcon size={16} color="#10b981" />;
    if (lower.includes('shortlist')) return <BookmarkIcon size={16} color="#f59e0b" />;
    if (lower.includes('highlight') || lower.includes('boost')) return <SparklesIcon size={16} color="#8b5cf6" />;
    if (lower.includes('support') || lower.includes('priority')) return <ShieldIcon size={16} color="#06b6d4" />;
    return <CheckCircleIcon size={16} color="#22c55e" />;
  };

  const finalPrice = selectedPackage ? selectedPackage.price - discount : 0;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Background />

      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: (insets.top || 0) + 30 }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">{t('payment.title')}</Text>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <CrownIcon size={20} color="white" />
          </View>
        </View>

        <View className="items-center pb-8">
          <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
            <CrownIcon size={40} color="white" />
          </View>
          <Text className="text-white text-lg font-semibold">{t('payment.unlockPremium')}</Text>
          <Text className="text-white/80 text-sm text-center px-8 mt-1">
            {t('payment.premiumDesc')}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-4 -mt-4" showsVerticalScrollIndicator={false}>
        {/* Packages */}
        {packages.map((pkg, index) => (
          <MotiView
            key={pkg.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 100 }}
          >
            <TouchableOpacity
              onPress={() => {
                setSelectedPackage(pkg);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`mb-4 rounded-2xl overflow-hidden border-2 ${selectedPackage?.id === pkg.id
                ? 'border-violet-500'
                : 'border-transparent'
                }`}
            >
              <LinearGradient
                colors={pkg.is_popular ? ['#7c3aed', '#a855f7'] : ['#ffffff', '#f8fafc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4"
              >
                {pkg.is_popular && (
                  <View className="absolute top-0 right-0 bg-amber-400 px-3 py-1 rounded-bl-xl">
                    <Text className="text-xs font-bold text-amber-900">POPULAR</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedPackage?.id === pkg.id
                      ? 'border-violet-500 bg-violet-500'
                      : 'border-slate-300'
                      }`}>
                      {selectedPackage?.id === pkg.id && (
                        <CheckCircleIcon size={14} color="white" />
                      )}
                    </View>
                    <View className="ml-3">
                      <Text className={`text-lg font-bold ${pkg.is_popular ? 'text-white' : 'text-slate-900'}`}>
                        {pkg.name}
                      </Text>
                      <Text className={`text-xs ${pkg.is_popular ? 'text-white/70' : 'text-slate-500'}`}>
                        {pkg.duration_days} days validity
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    {pkg.original_price && (
                      <Text className={`text-sm line-through ${pkg.is_popular ? 'text-white/50' : 'text-slate-400'}`}>
                        PKR {pkg.original_price.toLocaleString()}
                      </Text>
                    )}
                    <Text className={`text-xl font-bold ${pkg.is_popular ? 'text-white' : 'text-violet-600'}`}>
                      PKR {pkg.price.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="border-t border-slate-200/20 pt-3">
                  {pkg.features.slice(0, 4).map((feature, idx) => (
                    <View key={idx} className="flex-row items-center mb-2">
                      {getFeatureIcon(feature)}
                      <Text className={`ml-2 text-sm ${pkg.is_popular ? 'text-white/90' : 'text-slate-600'}`}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                  {pkg.features.length > 4 && (
                    <Text className={`text-xs mt-1 ${pkg.is_popular ? 'text-white/70' : 'text-slate-500'}`}>
                      +{pkg.features.length - 4} more features
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        ))}

        {/* Coupon Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300 }}
          className="bg-white rounded-2xl p-4 shadow-sm mb-4"
        >
          <View className="flex-row items-center mb-3">
            <GiftIcon size={20} color="#7c3aed" />
            <Text className="text-base font-semibold text-slate-900 ml-2">{t('payment.haveCoupon')}</Text>
          </View>

          <View className="flex-row items-center">
            <TextInput
              className={`flex-1 bg-slate-100 rounded-xl px-4 py-3 text-base ${couponApplied ? 'bg-emerald-50' : ''
                }`}
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Enter coupon code"
              placeholderTextColor="#94a3b8"
              editable={!couponApplied}
              autoCapitalize="characters"
            />
            {couponApplied ? (
              <TouchableOpacity
                onPress={removeCoupon}
                className="ml-2 bg-red-100 px-4 py-3 rounded-xl"
              >
                <XIcon size={20} color="#ef4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={applyCoupon}
                disabled={applyingCoupon}
                className="ml-2 bg-violet-100 px-4 py-3 rounded-xl"
              >
                {applyingCoupon ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <Text className="text-violet-600 font-semibold">{t('common.apply')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {couponApplied && (
            <View className="flex-row items-center mt-2 bg-emerald-50 p-2 rounded-lg">
              <CheckCircleIcon size={16} color="#10b981" />
              <Text className="text-emerald-600 text-sm ml-2">
                {t('payment.couponSaved', { amount: discount.toLocaleString() })}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Order Summary */}
        {selectedPackage && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm mb-4"
          >
            <Text className="text-base font-semibold text-slate-900 mb-3">{t('payment.orderSummary')}</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-600">{selectedPackage.name}</Text>
              <Text className="text-slate-900">PKR {selectedPackage.price.toLocaleString()}</Text>
            </View>

            {discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-emerald-600">{t('payment.discount')}</Text>
                <Text className="text-emerald-600">-PKR {discount.toLocaleString()}</Text>
              </View>
            )}

            <View className="border-t border-slate-200 pt-2 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-slate-900">{t('payment.total')}</Text>
                <Text className="text-lg font-bold text-violet-600">
                  PKR {finalPrice.toLocaleString()}
                </Text>
              </View>
            </View>
          </MotiView>
        )}

        {/* Checkout Button */}
        <TouchableOpacity
          onPress={handleCheckout}
          disabled={!selectedPackage}
          className="overflow-hidden rounded-xl mb-6"
        >
          <LinearGradient
            colors={selectedPackage ? ['#7c3aed', '#a855f7'] : ['#94a3b8', '#94a3b8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 items-center flex-row justify-center"
          >
            <CreditCardIcon size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              {t('payment.proceedToPayment')}
            </Text>
            <ChevronRightIcon size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Trust Badges */}
        <View className="flex-row justify-center items-center mb-8">
          <View className="flex-row items-center mx-3">
            <ShieldIcon size={16} color="#64748b" />
            <Text className="text-slate-500 text-xs ml-1">{t('payment.securePayment')}</Text>
          </View>
          <View className="flex-row items-center mx-3">
            <CheckCircleIcon size={16} color="#64748b" />
            <Text className="text-slate-500 text-xs ml-1">{t('payment.instantActivation')}</Text>
          </View>
        </View>

        <View className="h-28" />
      </ScrollView>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-slate-900">{t('payment.selectPaymentMethod')}</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <XIcon size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Wallet Option */}
            <TouchableOpacity
              onPress={() => setSelectedPaymentMethod('wallet')}
              className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${selectedPaymentMethod === 'wallet'
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-200'
                }`}
            >
              <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center">
                <CreditCardIcon size={24} color="#10b981" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-slate-900">{t('wallet.balance')}</Text>
                <Text className="text-sm text-slate-500">
                  Available: PKR {walletBalance.toLocaleString()}
                </Text>
              </View>
              {walletBalance < finalPrice && (
                <View className="bg-red-100 px-2 py-1 rounded">
                  <Text className="text-xs text-red-600">{t('payment.lowBalance')}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Card Option */}
            <TouchableOpacity
              onPress={() => setSelectedPaymentMethod('card')}
              className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${selectedPaymentMethod === 'card'
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-200'
                }`}
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <CreditCardIcon size={24} color="#3b82f6" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-slate-900">{t('payment.creditCard')}</Text>
                <Text className="text-sm text-slate-500">Visa, Mastercard, etc.</Text>
              </View>
            </TouchableOpacity>

            {/* Bank Transfer */}
            <TouchableOpacity
              onPress={() => setSelectedPaymentMethod('bank')}
              className={`flex-row items-center p-4 rounded-xl mb-6 border-2 ${selectedPaymentMethod === 'bank'
                ? 'border-violet-500 bg-violet-50'
                : 'border-slate-200'
                }`}
            >
              <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                <CreditCardIcon size={24} color="#f59e0b" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-slate-900">{t('payment.bankTransfer')}</Text>
                <Text className="text-sm text-slate-500">{t('payment.directBankPayment')}</Text>
              </View>
            </TouchableOpacity>

            {/* Pay Button */}
            <TouchableOpacity
              onPress={processPayment}
              disabled={!selectedPaymentMethod || processing}
              className="overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={selectedPaymentMethod && !processing ? ['#7c3aed', '#a855f7'] : ['#94a3b8', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 items-center flex-row justify-center"
              >
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-lg">
                      Pay PKR {finalPrice.toLocaleString()}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-4">
              <ShieldIcon size={14} color="#64748b" />
              <Text className="text-slate-500 text-xs ml-1">
                {t('payment.sslEncryption')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PaymentScreen;
