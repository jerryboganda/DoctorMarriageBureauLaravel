import React, { useEffect, useMemo, useState } from 'react';
import {
    X,
    Lock,
    CreditCard,
    Wallet,
    Building,
    CheckCircle2,
    ShieldCheck,
    Loader2,
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import { compressImage } from '../utils/compression';
import { useTranslation } from 'react-i18next';

interface PaymentModalProps {
    itemId: number;
    itemName: string;
    amount: number;
    purchaseType: 'package' | 'addon';
    appliedCouponCode?: string | null;
    onCouponApplied?: (code: string | null) => void;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    itemId,
    itemName,
    amount,
    purchaseType,
    appliedCouponCode,
    onCouponApplied,
    onClose,
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [step, setStep] = useState<'summary' | 'processing' | 'success'>('summary');
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [loadingMethods, setLoadingMethods] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [paymentProof, setPaymentProof] = useState<File | null>(null);

    const [couponCode, setCouponCode] = useState(appliedCouponCode ?? '');
    const [couponData, setCouponData] = useState<{
        code: string;
        discount_amount: number;
        final_amount: number;
    } | null>(null);
    const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
        'idle',
    );
    const [couponMessage, setCouponMessage] = useState<string | null>(null);

    const subtotal = amount;
    const discountAmount = couponData?.discount_amount ?? 0;
    const total = couponData?.final_amount ?? subtotal;
    const purchaseLabel =
        purchaseType === 'package'
            ? t('billing.payment.packagePurchase')
            : t('billing.payment.addonPurchase');
    const successNote =
        purchaseType === 'package'
            ? t('billing.payment.membershipVerification')
            : t('billing.payment.addonVerification');

    useEffect(() => {
        let isActive = true;

        const fetchMethods = async () => {
            try {
                setLoadingMethods(true);
                const response = await api.get('/payment-types', {
                    params: {
                        payment_type:
                            purchaseType === 'addon' ? 'addon_payment' : 'package_payment',
                    },
                });
                if (!isActive) return;
                const methods = response.data?.data ?? [];
                setPaymentMethods(methods);
                if (!selectedKey && methods.length > 0) {
                    setSelectedKey(methods[0].payment_type_key || methods[0].payment_type);
                }
            } catch (err) {
                if (!isActive) return;
                setError(t('errors.loadPaymentMethods'));
            } finally {
                if (isActive) setLoadingMethods(false);
            }
        };

        fetchMethods();

        return () => {
            isActive = false;
        };
    }, [purchaseType]);

    const selectedMethod = useMemo(() => {
        if (!selectedKey) return null;
        return (
            paymentMethods.find(
                (method) => (method.payment_type_key || method.payment_type) === selectedKey,
            ) || null
        );
    }, [paymentMethods, selectedKey]);

    const isManual = selectedMethod?.payment_type === 'manual_payment';
    const isWallet = selectedMethod?.payment_type_key === 'wallet';

    const getGatewayPath = (key?: string) => {
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

    const applyCoupon = async (overrideCode?: string) => {
        const code = (overrideCode ?? couponCode).trim();
        if (!code) {
            setCouponStatus('error');
            setCouponMessage(t('errors.enterCouponCode'));
            return;
        }

        setCouponStatus('loading');
        setCouponMessage(null);

        try {
            const response = await api.post('/member/coupons/validate', {
                code,
                amount: subtotal,
                purchase_type: purchaseType,
            });
            const payload = response.data?.data ?? {};
            if (response.data?.result || response.data?.success) {
                setCouponData({
                    code: payload.code ?? code,
                    discount_amount: Number(payload.discount_amount ?? 0),
                    final_amount: Number(payload.final_amount ?? subtotal),
                });
                setCouponStatus('success');
                setCouponMessage(t('billing.payment.couponApplied'));
                onCouponApplied?.(payload.code ?? code);
            } else {
                setCouponData(null);
                setCouponStatus('error');
                setCouponMessage(response.data?.message || t('billing.payment.invalidCoupon'));
            }
        } catch (err: any) {
            setCouponData(null);
            setCouponStatus('error');
            setCouponMessage(err.response?.data?.message || t('errors.applyCoupon'));
        }
    };

    const clearCoupon = () => {
        setCouponData(null);
        setCouponStatus('idle');
        setCouponMessage(null);
        onCouponApplied?.(null);
    };

    useEffect(() => {
        if (!appliedCouponCode) {
            return;
        }

        if (couponData?.code === appliedCouponCode) {
            return;
        }

        setCouponCode(appliedCouponCode);
        applyCoupon(appliedCouponCode);
    }, [appliedCouponCode, purchaseType, subtotal]);

    const handlePay = async () => {
        if (!selectedMethod) return;
        setError(null);

        const couponPayload = couponData?.code ? { coupon_code: couponData.code } : {};

        if (isManual) {
            if (!transactionId.trim() || !paymentDetails.trim()) {
                setError(t('errors.provideTransactionId'));
                return;
            }
            try {
                setSubmitting(true);
                const formData = new FormData();
                formData.append(
                    purchaseType === 'package' ? 'package_id' : 'addon_id',
                    String(itemId),
                );
                formData.append('amount', String(total));
                formData.append('payment_method', 'manual_payment');
                formData.append(
                    'manual_payment_id',
                    String(selectedMethod.manual_payment_id || ''),
                );
                formData.append('transaction_id', transactionId);
                formData.append('payment_details', paymentDetails);
                if (couponData?.code) {
                    formData.append('coupon_code', couponData.code);
                }
                if (paymentProof) {
                    formData.append('payment_proof', paymentProof);
                }
                const response = await api.post(
                    purchaseType === 'package'
                        ? '/member/package-purchase'
                        : '/member/addon-purchase',
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    },
                );
                if (response.data?.result || response.data?.success) {
                    setStep('success');
                } else {
                    setError(response.data?.message || t('errors.paymentSubmissionFailed'));
                }
            } catch (err: any) {
                setError(err.response?.data?.message || t('errors.paymentSubmissionFailed'));
            } finally {
                setSubmitting(false);
            }
            return;
        }

        if (isWallet) {
            try {
                setSubmitting(true);
                const response = await api.post(
                    purchaseType === 'package'
                        ? '/member/package-purchase'
                        : '/member/addon-purchase',
                    {
                        [purchaseType === 'package' ? 'package_id' : 'addon_id']: itemId,
                        amount: total,
                        payment_method: 'wallet',
                        ...couponPayload,
                    },
                );
                if (response.data?.result || response.data?.success) {
                    setStep('success');
                } else {
                    setError(response.data?.message || t('errors.walletPaymentFailed'));
                }
            } catch (err: any) {
                setError(err.response?.data?.message || t('errors.walletPaymentFailed'));
            } finally {
                setSubmitting(false);
            }
            return;
        }

        const gatewayPath = getGatewayPath(selectedMethod.payment_type_key);
        if (!gatewayPath) {
            setError(t('errors.unsupportedPaymentMethod'));
            return;
        }

        setStep('processing');
        const params = new URLSearchParams({
            payment_type: purchaseType === 'package' ? 'package_payment' : 'addon_payment',
            payment_method: selectedMethod.payment_type_key,
            amount: String(total),
            [purchaseType === 'package' ? 'package_id' : 'addon_id']: String(itemId),
            user_id: String(user?.id ?? ''),
        });
        if (couponData?.code) {
            params.append('coupon_code', couponData.code);
        }
        window.open(
            `${api.defaults.baseURL}/${gatewayPath}?${params.toString()}`,
            '_blank',
            'noopener',
        );
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95">
                    <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {t('billing.payment.submitted')}
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Your request for <b>{itemName}</b> has been received. {successNote}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800"
                    >
                        {t('billing.payment.continueToDashboard')}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'processing') {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95">
                    <Loader2 size={36} className="animate-spin text-primary mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {t('billing.payment.completePayment')}
                    </h2>
                    <p className="text-slate-500 mb-6">{t('billing.payment.finishInWindow')}</p>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800"
                    >
                        {t('billing.payment.close')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] md:h-[600px] animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-full md:w-5/12 bg-slate-50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
                    <div className="flex justify-between items-center md:block mb-4 md:mb-6">
                        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            <ShieldCheck className="text-green-600" size={20} />{' '}
                            {t('billing.payment.orderSummary')}
                        </h3>
                        <button onClick={onClose} className="md:hidden text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-800">{itemName}</p>
                                <p className="text-xs text-slate-500">{purchaseLabel}</p>
                            </div>
                            <p className="font-bold text-slate-900">
                                Rs.{subtotal.toLocaleString()}
                            </p>
                        </div>

                        {discountAmount > 0 && couponData ? (
                            <div className="flex justify-between items-center text-sm text-green-600">
                                <span>
                                    {t('billing.payment.discount')} ({couponData.code})
                                </span>
                                <span>-Rs.{discountAmount.toLocaleString()}</span>
                            </div>
                        ) : null}

                        <hr className="border-slate-200" />

                        <div className="flex justify-between items-center">
                            <p className="font-bold text-lg text-slate-900">
                                {t('billing.payment.total')}
                            </p>
                            <p className="font-black text-2xl text-primary">
                                Rs.{total.toLocaleString()}
                            </p>
                        </div>

                        <div className="pt-2 space-y-2">
                            <p className="text-xs font-semibold text-slate-500">
                                {t('billing.payment.haveCoupon')}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder={t('billing.payment.enterCode')}
                                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                                />
                                <button
                                    onClick={() => applyCoupon()}
                                    disabled={couponStatus === 'loading' || !couponCode.trim()}
                                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {couponStatus === 'loading'
                                        ? t('billing.payment.applying')
                                        : t('billing.payment.apply')}
                                </button>
                            </div>
                            {couponMessage && (
                                <p
                                    className={`text-xs ${couponStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}
                                >
                                    {couponMessage}
                                </p>
                            )}
                            {couponData && (
                                <button
                                    onClick={clearCoupon}
                                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                                >
                                    {t('billing.payment.removeCoupon')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col relative overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="hidden md:block absolute right-6 top-6 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-bold text-slate-900 mb-6">
                        {t('billing.payment.paymentMethod')}
                    </h2>

                    {loadingMethods ? (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="animate-spin" size={18} />
                            {t('billing.payment.loadingPaymentMethods')}
                        </div>
                    ) : (
                        <div className="space-y-3 mb-8">
                            {paymentMethods.map((method) => (
                                <PaymentOption
                                    key={method.payment_type_key || method.payment_type}
                                    icon={
                                        method.payment_type === 'manual_payment' ? (
                                            <Building size={20} />
                                        ) : method.payment_type_key === 'wallet' ? (
                                            <Wallet size={20} />
                                        ) : (
                                            <CreditCard size={20} />
                                        )
                                    }
                                    label={method.title || method.name}
                                    selected={
                                        selectedKey ===
                                        (method.payment_type_key || method.payment_type)
                                    }
                                    onSelect={() =>
                                        setSelectedKey(
                                            method.payment_type_key || method.payment_type,
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}

                    {selectedMethod?.payment_type === 'manual_payment' && (
                        <div className="space-y-4 mb-8 animate-in fade-in">
                            {selectedMethod.details && (
                                <div
                                    className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    dangerouslySetInnerHTML={{ __html: selectedMethod.details }}
                                />
                            )}
                            <input
                                type="text"
                                placeholder={t('billing.payment.transactionId')}
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-xl text-sm"
                            />
                            <textarea
                                placeholder={t('billing.payment.paymentDetails')}
                                value={paymentDetails}
                                onChange={(e) => setPaymentDetails(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-xl text-sm h-24 resize-none"
                            />
                            <input
                                type="file"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file && file.type.startsWith('image/')) {
                                        const compressed = await compressImage(file);
                                        setPaymentProof(compressed);
                                    } else {
                                        setPaymentProof(file || null);
                                    }
                                }}
                                className="w-full text-sm"
                            />
                        </div>
                    )}

                    {error && <p className="text-xs text-red-600 font-medium mb-4">{error}</p>}

                    <div className="mt-auto">
                        <button
                            onClick={handlePay}
                            disabled={submitting || loadingMethods || !selectedMethod}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:bg-primary-hover flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {submitting ? (
                                t('billing.payment.processing')
                            ) : (
                                <>
                                    <Lock size={20} />{' '}
                                    {t('billing.payment.payAmount', {
                                        amount: total.toLocaleString(),
                                    })}
                                </>
                            )}
                        </button>
                        <div className="flex justify-center items-center gap-4 mt-4 text-xs text-slate-400 grayscale opacity-70">
                            <ShieldCheck size={12} />{' '}
                            <span className="font-medium">{t('billing.payment.sslSecure')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PaymentOption: React.FC<{
    icon: React.ReactNode;
    label: string;
    selected: boolean;
    onSelect: () => void;
}> = ({ icon, label, selected, onSelect }) => (
    <div
        onClick={onSelect}
        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-300'}`}
    >
        <div
            className={`p-2 rounded-full ${selected ? 'bg-white text-primary shadow-sm' : 'bg-slate-100 text-slate-500'}`}
        >
            {icon}
        </div>
        <span className={`font-bold ${selected ? 'text-primary' : 'text-slate-700'}`}>{label}</span>
        {selected && (
            <div className="ml-auto size-4 bg-primary rounded-full border-2 border-white shadow-sm ring-1 ring-primary"></div>
        )}
    </div>
);

export default PaymentModal;
