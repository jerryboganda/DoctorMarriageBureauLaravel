import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Clock3, CreditCard, ExternalLink, Gift, Loader2, RefreshCw, ShieldCheck, Wallet as WalletIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { compressImage } from '../utils/compression';
import { useAuthStore } from '../src/stores/authStore';

type WalletTransaction = {
  date: string;
  amount: string;
  payment_method: string;
  approval: string;
};

type WithdrawTransaction = {
  amount: string;
  status: string;
  details: string;
  date: string;
};

type PaymentMethod = {
  payment_type: string;
  payment_type_key: string;
  name?: string;
  title?: string;
  manual_payment_id?: number;
  details?: string;
};

type PaginationMeta = {
  current_page?: number;
  last_page?: number;
};

const gatewayPath = (key?: string) => {
  switch (key) {
    case 'paypal':
      return 'paypal/payment/pay';
    case 'stripe':
      return 'stripe';
    case 'razorpay':
      return 'pay-with-razorpay';
    case 'phonepe':
      return 'pay-with-phonepe';
    case 'instamojo_payment':
      return 'pay-with-instamojo';
    case 'paytm':
      return 'paytm/index';
    default:
      return null;
  }
};

const WalletView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<string>('Rs.0');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionMeta, setTransactionMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1 });
  const [transactionPage, setTransactionPage] = useState(1);
  const [withdraws, setWithdraws] = useState<WithdrawTransaction[]>([]);
  const [withdrawMeta, setWithdrawMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1 });
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [withdrawEnabled, setWithdrawEnabled] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [selectedMethodKey, setSelectedMethodKey] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const selectedMethod = useMemo(() => {
    if (!selectedMethodKey) return null;
    return paymentMethods.find((method) => method.payment_type_key === selectedMethodKey) || null;
  }, [paymentMethods, selectedMethodKey]);

  const fetchBalance = useCallback(async () => {
    const response = await api.get('/member/my-wallet-balance');
    const payload = response.data?.data ?? response.data ?? {};
    setBalance(payload.wallet_balance || 'Rs.0');
  }, []);

  const fetchTransactions = useCallback(async (page = 1) => {
    const response = await api.get('/member/wallet', { params: { page } });
    setTransactions(response.data?.data ?? []);
    setTransactionMeta(response.data?.meta ?? { current_page: page, last_page: 1 });
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    const response = await api.get('/payment-types', { params: { payment_type: 'wallet_recharge' } });
    const methods = response.data?.data ?? [];
    setPaymentMethods(methods);
    setSelectedMethodKey((current) => current || methods[0]?.payment_type_key || null);
  }, []);

  const fetchWithdraws = useCallback(async (page = 1) => {
    try {
      const response = await api.get('/member/wallet-withdraw-request-history', { params: { page } });
      setWithdrawEnabled(Boolean(response.data?.result));
      setWithdraws(response.data?.data ?? []);
      setWithdrawMeta(response.data?.meta ?? { current_page: page, last_page: 1 });
    } catch (err: any) {
      const message = String(err?.response?.data?.message || '');
      const unauthorized = message.toLowerCase().includes('not authorized');
      if (unauthorized) {
        setWithdrawEnabled(false);
        setWithdraws([]);
        setWithdrawMeta({ current_page: 1, last_page: 1 });
        return;
      }
      throw err;
    }
  }, []);

  const refreshWallet = useCallback(async ({ silent = false, walletPage = transactionPage, requestPage = withdrawPage } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      await Promise.all([
        fetchBalance(),
        fetchTransactions(walletPage),
        fetchPaymentMethods(),
        fetchWithdraws(requestPage),
      ]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load wallet details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBalance, fetchTransactions, fetchPaymentMethods, fetchWithdraws, transactionPage, withdrawPage]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    fetchTransactions(transactionPage).catch(() => {});
  }, [fetchTransactions, transactionPage]);

  useEffect(() => {
    fetchWithdraws(withdrawPage).catch(() => {});
  }, [fetchWithdraws, withdrawPage]);

  const resetRechargeModal = () => {
    setShowRechargeModal(false);
    setRechargeAmount('');
    setTransactionId('');
    setPaymentDetails('');
    setReceipt(null);
    setRechargeError(null);
    setGatewayNotice(null);
  };

  const handleRecharge = async () => {
    if (!selectedMethod) {
      setRechargeError('Please select a recharge method.');
      return;
    }

    const amount = Number(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRechargeError('Please enter a valid amount.');
      return;
    }

    setRechargeError(null);
    setGatewayNotice(null);

    try {
      setRechargeSubmitting(true);

      if (selectedMethod.payment_type === 'manual_payment') {
        if (!transactionId.trim() || !paymentDetails.trim()) {
          setRechargeError(t('errors.provideTransactionId'));
          return;
        }

        const formData = new FormData();
        formData.append('amount', String(amount));
        formData.append('payment_method', 'manual_payment');
        formData.append('manual_payment_id', String(selectedMethod.manual_payment_id || ''));
        formData.append('transaction_id', transactionId.trim());
        formData.append('payment_details', paymentDetails.trim());
        if (receipt) {
          formData.append('reciept', receipt);
        }

        const response = await api.post('/member/wallet-recharge', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data?.result || response.data?.success) {
          resetRechargeModal();
          await refreshWallet({ silent: true, walletPage: 1, requestPage: 1 });
          setTransactionPage(1);
          setWithdrawPage(1);
          return;
        }

        setRechargeError(response.data?.message || 'Wallet recharge failed.');
        return;
      }

      if (selectedMethod.payment_type_key === 'paypal') {
        const response = await api.post('/member/wallet-recharge', {
          amount,
          payment_method: 'paypal',
          payment_type: 'wallet_payment',
          user_id: user?.id,
        });

        if (response.data?.url) {
          window.open(response.data.url, '_blank', 'noopener');
          setGatewayNotice('A payment window has opened in a new tab. Complete the top-up there, then refresh your wallet balance.');
          return;
        }

        setRechargeError(response.data?.message || 'Could not launch PayPal checkout.');
        return;
      }

      const path = gatewayPath(selectedMethod.payment_type_key);
      if (!path) {
        setRechargeError('This recharge method is not available right now.');
        return;
      }

      const params = new URLSearchParams({
        payment_type: 'wallet_payment',
        payment_method: selectedMethod.payment_type_key,
        amount: String(amount),
        user_id: String(user?.id ?? ''),
      });

      window.open(`${api.defaults.baseURL}/${path}?${params.toString()}`, '_blank', 'noopener');
      setGatewayNotice('A payment window has opened in a new tab. Complete the top-up there, then refresh your wallet balance.');
    } catch (err: any) {
      setRechargeError(err?.response?.data?.message || 'Wallet recharge failed.');
    } finally {
      setRechargeSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      return;
    }

    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      setWithdrawSubmitting(true);
      const response = await api.post('/member/wallet-withdraw-request-store', {
        amount,
        details: withdrawDetails.trim(),
      });

      if (response.data?.result || response.data?.success) {
        setWithdrawSuccess(response.data?.message || 'Withdraw request sent successfully.');
        setWithdrawAmount('');
        setWithdrawDetails('');
        setWithdrawPage(1);
        await refreshWallet({ silent: true, walletPage: transactionPage, requestPage: 1 });
        return;
      }

      setWithdrawError(response.data?.message || 'Withdraw request failed.');
    } catch (err: any) {
      setWithdrawError(err?.response?.data?.message || 'Withdraw request failed.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const renderPagination = (meta: PaginationMeta, page: number, setPage: (page: number) => void) => {
    const current = Number(meta.current_page || 1);
    const last = Number(meta.last_page || 1);
    if (last <= 1) return null;

    return (
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-4">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={current <= 1}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">Page {current} of {last}</span>
        <button
          onClick={() => setPage(Math.min(last, page + 1))}
          disabled={current >= last}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-50">
      <header className="h-auto md:h-20 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Wallet</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your balance, top up funds, and track wallet activity.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => refreshWallet({ silent: true })}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm inline-flex items-center gap-2"
          >
            <ArrowUpRight size={16} /> Top Up Wallet
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-8">
          {loading ? (
            <div className="flex items-center justify-center p-20 text-slate-500">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-primary" />
                <p className="text-sm font-medium">Loading wallet details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button onClick={() => refreshWallet()} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm">Try again</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white/70 text-sm font-medium">Available Balance</p>
                      <h3 className="text-4xl font-black mt-2 tracking-tight">{balance}</h3>
                      <p className="text-white/70 text-sm mt-3 max-w-xl">Use your wallet balance for package and add-on purchases directly from checkout.</p>
                    </div>
                    <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center">
                      <WalletIcon size={28} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-8">
                    <button onClick={() => setShowRechargeModal(true)} className="px-4 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold inline-flex items-center gap-2">
                      <CreditCard size={16} /> Add Funds
                    </button>
                    <button onClick={() => setTransactionPage(1)} className="px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 border border-white/10">
                      <Clock3 size={16} /> View History
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift size={18} className="text-primary" />
                    <h4 className="text-lg font-bold text-slate-900">Wallet Tips</h4>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" /><span>Top up your wallet before choosing Wallet Payment in checkout.</span></li>
                    <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" /><span>Manual top-ups stay pending until approved by the team.</span></li>
                    <li className="flex gap-3"><ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" /><span>Use Refresh after completing an external gateway payment.</span></li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Transaction History</h3>
                      <p className="text-sm text-slate-500 mt-1">All wallet credits and recharge requests.</p>
                    </div>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                      No wallet transactions yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-100">
                            <th className="py-3 pr-4 font-semibold">Date</th>
                            <th className="py-3 pr-4 font-semibold">Amount</th>
                            <th className="py-3 pr-4 font-semibold">Method</th>
                            <th className="py-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((item, index) => (
                            <tr key={`${item.date}-${item.amount}-${index}`} className="border-b border-slate-50 text-slate-700">
                              <td className="py-3 pr-4">{item.date}</td>
                              <td className="py-3 pr-4 font-semibold text-slate-900">{item.amount}</td>
                              <td className="py-3 pr-4">{item.payment_method}</td>
                              <td className="py-3">{item.approval}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination(transactionMeta, transactionPage, setTransactionPage)}
                    </div>
                  )}
                </section>

                <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Withdraw Requests</h3>
                      <p className="text-sm text-slate-500 mt-1">{withdrawEnabled ? 'Request a payout from eligible wallet balance.' : 'Withdrawals are not available for this account yet.'}</p>
                    </div>
                  </div>

                  {withdrawEnabled ? (
                    <>
                      <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 mb-6">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="Enter withdrawal amount"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                        />
                        <textarea
                          value={withdrawDetails}
                          onChange={(e) => setWithdrawDetails(e.target.value)}
                          placeholder="Add payout details or notes"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm h-24 resize-none"
                        />
                        {withdrawError ? <p className="text-sm text-red-600">{withdrawError}</p> : null}
                        {withdrawSuccess ? <p className="text-sm text-green-600">{withdrawSuccess}</p> : null}
                        <button
                          onClick={handleWithdraw}
                          disabled={withdrawSubmitting}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm disabled:opacity-60"
                        >
                          {withdrawSubmitting ? 'Submitting request...' : 'Submit Withdraw Request'}
                        </button>
                      </div>

                      {withdraws.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                          No withdraw requests yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-slate-500 border-b border-slate-100">
                                <th className="py-3 pr-4 font-semibold">Date</th>
                                <th className="py-3 pr-4 font-semibold">Amount</th>
                                <th className="py-3 pr-4 font-semibold">Status</th>
                                <th className="py-3 font-semibold">Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {withdraws.map((item, index) => (
                                <tr key={`${item.date}-${item.amount}-${index}`} className="border-b border-slate-50 text-slate-700">
                                  <td className="py-3 pr-4">{item.date}</td>
                                  <td className="py-3 pr-4 font-semibold text-slate-900">{item.amount}</td>
                                  <td className="py-3 pr-4">{item.status}</td>
                                  <td className="py-3">{item.details || '?'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {renderPagination(withdrawMeta, withdrawPage, setWithdrawPage)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                      Withdraw requests are currently unavailable for your account.
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </div>

      {showRechargeModal ? (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Top Up Wallet</h3>
                <p className="text-sm text-slate-500 mt-1">Choose a payment method and add funds to your wallet.</p>
              </div>
              <button onClick={resetRechargeModal} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Payment Method</label>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const selected = selectedMethodKey === method.payment_type_key;
                    return (
                      <button
                        key={method.payment_type_key}
                        onClick={() => setSelectedMethodKey(method.payment_type_key)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-4 rounded-2xl border-2 text-left ${selected ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}
                      >
                        <div>
                          <p className={`font-bold ${selected ? 'text-primary' : 'text-slate-800'}`}>{method.title || method.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{method.payment_type === 'manual_payment' ? 'Manual approval required' : 'Secure gateway payment'}</p>
                        </div>
                        {method.payment_type !== 'manual_payment' ? <ExternalLink size={16} className="text-slate-400" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMethod?.payment_type === 'manual_payment' ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {selectedMethod.details ? (
                    <div className="text-xs text-slate-600 leading-6 bg-white border border-slate-200 rounded-xl p-3" dangerouslySetInnerHTML={{ __html: selectedMethod.details }} />
                  ) : null}
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm"
                  />
                  <textarea
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    placeholder="Payment details"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm h-24 resize-none"
                  />
                  <input
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        setReceipt(null);
                        return;
                      }
                      if (file.type.startsWith('image/')) {
                        setReceipt(await compressImage(file));
                        return;
                      }
                      setReceipt(file);
                    }}
                    className="w-full text-sm"
                  />
                </div>
              ) : null}

              {rechargeError ? <p className="text-sm text-red-600">{rechargeError}</p> : null}
              {gatewayNotice ? <p className="text-sm text-green-600">{gatewayNotice}</p> : null}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button onClick={resetRechargeModal} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm">
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleRecharge}
                  disabled={rechargeSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-60"
                >
                  {rechargeSubmitting ? 'Processing...' : 'Continue Recharge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WalletView;
