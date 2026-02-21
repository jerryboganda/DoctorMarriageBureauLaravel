import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../components/Background';
import { api } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import {
  WalletIcon, ChevronLeftIcon, PlusIcon, ArrowUpRightIcon, ArrowDownLeftIcon,
  CreditCardIcon, ClockIcon, CheckCircleIcon, XCircleIcon, DollarIcon, GiftIcon
} from '../components/Icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: WalletTransaction[];
}

const WalletScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const response = await api.get('/member/wallet');
      if (response.data.result && response.data.data) {
        setWallet(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch wallet', error);
      // Set default wallet if API fails
      setWallet({ balance: 0, currency: 'PKR', transactions: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('wallet.invalidAmount'), t('wallet.enterValidAmount'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdding(true);
    try {
      // Send amount with default payment method (manual_payment for now)
      // Can be enhanced later to let user choose payment method
      const response = await api.post('/member/wallet-recharge', {
        amount,
        payment_method: 'manual_payment',
        payment_details: 'Mobile App Recharge'
      });
      if (response.data.result) {
        if (response.data.data?.payment_url) {
          // Open payment URL in in-app browser
          await WebBrowser.openBrowserAsync(response.data.data.payment_url);
        } else {
          Alert.alert(t('common.success'), t('wallet.fundsAdded'));
          fetchWallet();
        }
        setShowAddModal(false);
        setAddAmount('');
      } else {
        Alert.alert(t('common.error'), response.data.message || t('wallet.addFundsFailed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('wallet.processFailed'));
    } finally {
      setAdding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${wallet?.currency || 'PKR'} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon size={16} color="#22c55e" />;
      case 'pending':
        return <ClockIcon size={16} color="#f59e0b" />;
      case 'failed':
        return <XCircleIcon size={16} color="#ef4444" />;
      default:
        return <ClockIcon size={16} color="#94a3b8" />;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50">
        <LinearGradient
          colors={['#059669', '#10b981', '#34d399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1 items-center justify-center"
        >
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="items-center"
          >
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
              <WalletIcon size={40} color="white" />
            </View>
            <ActivityIndicator size="large" color="white" />
            <Text className="text-white/90 mt-4 font-medium">{t('wallet.loading')}</Text>
          </MotiView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <Background />

      {/* Header */}
      <LinearGradient
        colors={['#059669', '#10b981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ChevronLeftIcon size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">{t('wallet.title')}</Text>
          <View className="w-10 h-10" />
        </View>

        {/* Balance Card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mx-4 mb-6"
        >
          <View className="bg-white/20 rounded-3xl p-6 backdrop-blur-lg">
            <Text className="text-white/70 text-sm font-medium">{t('wallet.availableBalance')}</Text>
            <Text className="text-4xl font-bold text-white mt-2">
              {formatCurrency(wallet?.balance || 0)}
            </Text>

            {/* Quick Actions */}
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-1 bg-white py-3 rounded-xl items-center flex-row justify-center"
              >
                <PlusIcon size={18} color="#059669" />
                <Text className="text-emerald-600 font-bold ml-2">{t('wallet.addFunds')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/referrals')}
                className="flex-1 bg-white/20 py-3 rounded-xl items-center flex-row justify-center"
              >
                <GiftIcon size={18} color="white" />
                <Text className="text-white font-bold ml-2">{t('wallet.earnCredits')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </MotiView>
      </LinearGradient>

      {/* Transactions */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
      >
        <Text className="text-lg font-bold text-slate-900 mb-4">{t('wallet.transactions')}</Text>

        {wallet?.transactions && wallet.transactions.length > 0 ? (
          <View className="pb-28">
            {wallet.transactions.map((tx, index) => (
              <MotiView
                key={tx.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: index * 50 }}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center"
              >
                {/* Icon */}
                <View className={`w-12 h-12 rounded-full items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                  {tx.type === 'credit' ? (
                    <ArrowDownLeftIcon size={24} color="#10b981" />
                  ) : (
                    <ArrowUpRightIcon size={24} color="#ef4444" />
                  )}
                </View>

                {/* Details */}
                <View className="flex-1 ml-4">
                  <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                    {tx.description}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {getStatusIcon(tx.status)}
                    <Text className="text-slate-500 text-xs ml-1">{tx.status}</Text>
                    <Text className="text-slate-400 text-xs ml-2">• {formatDate(tx.created_at)}</Text>
                  </View>
                </View>

                {/* Amount */}
                <Text className={`text-lg font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </MotiView>
            ))}
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="items-center py-16"
          >
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <ClockIcon size={40} color="#10b981" />
            </View>
            <Text className="text-lg font-bold text-slate-900 mb-2">{t('wallet.noTransactions')}</Text>
            <Text className="text-slate-500 text-center px-8">
              {t('wallet.noTransactionsDesc')}
            </Text>
          </MotiView>
        )}
      </ScrollView>

      {/* Add Funds Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <MotiView
            from={{ translateY: 300 }}
            animate={{ translateY: 0 }}
            className="bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-12 h-1 bg-slate-300 rounded-full self-center mb-6" />

            <Text className="text-2xl font-bold text-slate-900 mb-6">{t('wallet.addFunds')}</Text>

            {/* Amount Input */}
            <View className="bg-slate-100 rounded-2xl p-4 mb-4">
              <Text className="text-xs font-bold text-slate-500 uppercase mb-2">Amount ({wallet?.currency || 'PKR'})</Text>
              <View className="flex-row items-center">
                <DollarIcon size={24} color="#059669" />
                <TextInput
                  className="flex-1 text-3xl font-bold text-slate-900 ml-2"
                  value={addAmount}
                  onChangeText={setAddAmount}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Quick Amount Buttons */}
            <View className="flex-row gap-2 mb-6">
              {[500, 1000, 2000, 5000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAddAmount(String(amt));
                  }}
                  className={`flex-1 py-3 rounded-xl border ${addAmount === String(amt)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-slate-200'
                    }`}
                >
                  <Text className={`text-center font-bold ${addAmount === String(amt) ? 'text-white' : 'text-slate-600'
                    }`}>
                    {amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Methods */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-slate-500 uppercase mb-3">{t('payment.paymentMethod')}</Text>
              <TouchableOpacity className="flex-row items-center bg-slate-100 rounded-xl p-4">
                <CreditCardIcon size={24} color="#1e3a8a" />
                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-slate-900">{t('payment.creditCard')}</Text>
                  <Text className="text-slate-500 text-sm">Visa, Mastercard, etc.</Text>
                </View>
                <View className="w-5 h-5 rounded-full border-2 border-emerald-500 items-center justify-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1 bg-slate-200 py-4 rounded-xl items-center"
              >
                <Text className="text-slate-700 font-bold text-lg">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFunds}
                disabled={adding || !addAmount}
                className={`flex-1 py-4 rounded-xl items-center ${adding || !addAmount ? 'bg-slate-300' : 'bg-emerald-500'
                  }`}
              >
                {adding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">{t('wallet.addFunds')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
};

export default WalletScreen;
