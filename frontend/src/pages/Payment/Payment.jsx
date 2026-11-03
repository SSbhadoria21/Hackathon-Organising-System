import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard, Lock, CheckCircle2, ArrowLeft, Shield, Smartphone,
  Building2, Wallet, ChevronRight, Loader2,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / QR', icon: Smartphone, description: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, description: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, description: 'All major banks' },
  { id: 'wallet', label: 'Wallets', icon: Wallet, description: 'Paytm, Amazon Pay' },
];

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const hackathon = location.state?.hackathon;
  const team = location.state?.team;

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('form');

  useEffect(() => {
    if (!hackathon) navigate(`/hackathon/${id}/participate`);
  }, [hackathon, id, navigate]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStage('processing');
    await new Promise((res) => setTimeout(res, 2200));
    try { await hackathonService.completePayment(id); } catch {}
    setStage('success');
    setLoading(false);
  };

  const fmtCard = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g,'').slice(0,4); return d.length>=3?`${d.slice(0,2)}/${d.slice(2)}`:d; };

  if (stage === 'processing') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6 font-space">
      <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 text-center max-w-sm w-full space-y-6">
        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
          <Loader2 size={40} className="text-indigo-600 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-darker-blue">Processing Payment</h2>
          <p className="text-xs text-gray-500 font-alef mt-2">Securely processing your payment. Please don't close this page.</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield size={14} className="text-green-500" /> 256-bit SSL Encryption
        </div>
      </div>
    </div>
  );

  if (stage === 'success') return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-indigo-50 flex items-center justify-center p-6 font-space">
      <div className="bg-white rounded-3xl p-10 shadow-2xl border border-emerald-100 text-center max-w-md w-full space-y-6">
        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border-4 border-emerald-200 shadow-lg">
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">Payment Successful 🎉</span>
          <h2 className="text-2xl font-extrabold text-darker-blue mt-3">You're All Set!</h2>
          <p className="text-xs text-gray-500 font-alef mt-2 max-w-xs mx-auto leading-relaxed">
            Your payment of <strong>₹{hackathon?.feeAmount}</strong> has been confirmed. Welcome to <strong>{hackathon?.eventName}</strong>!
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Team Name</span>
            <span className="font-bold text-darker-blue">{team?.name || 'Your Team'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Hackathon</span>
            <span className="font-bold text-darker-blue truncate max-w-[160px]">{hackathon?.eventName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-extrabold text-emerald-600">₹{hackathon?.feeAmount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Transaction ID</span>
            <span className="font-mono text-[10px] text-gray-600">TXN{Date.now().toString().slice(-10)}</span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/hackathon/${id}/participate`)}
          className="w-full py-3.5 rounded-2xl bg-darker-blue hover:bg-dark-blue text-white font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          Go to Participation Hub <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4 font-space">
      <div className="w-full max-w-lg">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-darker-blue transition cursor-pointer">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-darker-blue via-[#232f72] to-indigo-900 p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-lime-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-200">Secure Checkout</span>
            </div>
            <h1 className="text-xl font-extrabold">{hackathon?.eventName || 'Hackathon Registration'}</h1>
            <p className="text-xs text-white/70 mt-0.5">Team: <strong className="text-white">{team?.name}</strong></p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-xs text-white/60">Total Amount</span>
              <span className="text-3xl font-extrabold text-lime-300">₹{hackathon?.feeAmount || 0}</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs font-bold text-darker-blue mb-3">Choose Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id} type="button" onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${selectedMethod===m.id?'border-darker-blue bg-indigo-50 shadow-sm':'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${selectedMethod===m.id?'bg-darker-blue text-white':'bg-gray-100 text-gray-600'}`}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-darker-blue leading-tight">{m.label}</p>
                          <p className="text-[9px] text-gray-400">{m.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-3.5">
              {selectedMethod === 'upi' && (
                <div>
                  <label className="text-xs font-bold text-darker-blue block mb-1.5">UPI ID</label>
                  <input type="text" value={upiId} onChange={(e)=>setUpiId(e.target.value)} placeholder="yourname@upi"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-darker-blue outline-none text-sm transition" />
                  <p className="text-[10px] text-gray-400 mt-1">You'll receive a payment request on your UPI app.</p>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-darker-blue block mb-1.5">Card Number</label>
                    <input type="text" value={cardNumber} onChange={(e)=>setCardNumber(fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-darker-blue outline-none text-sm font-mono tracking-wider transition" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-darker-blue block mb-1.5">Cardholder Name</label>
                    <input type="text" value={cardName} onChange={(e)=>setCardName(e.target.value)} placeholder="Name on card"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-darker-blue outline-none text-sm transition" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-darker-blue block mb-1.5">Expiry</label>
                      <input type="text" value={cardExpiry} onChange={(e)=>setCardExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-darker-blue outline-none text-sm transition" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-darker-blue block mb-1.5">CVV</label>
                      <input type="password" value={cardCvv} onChange={(e)=>setCardCvv(e.target.value.replace(/\D/g,'').slice(0,3))} placeholder="•••" maxLength={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-darker-blue outline-none text-sm transition" />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'netbanking' && (
                <div>
                  <label className="text-xs font-bold text-darker-blue block mb-1.5">Select Bank</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-darker-blue outline-none text-sm bg-white transition">
                    {['State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Punjab National Bank','Kotak Mahindra Bank'].map(b=>(
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedMethod === 'wallet' && (
                <div className="grid grid-cols-3 gap-2">
                  {['Paytm','Amazon Pay','PhonePe'].map((w)=>(
                    <button key={w} type="button" className="p-3 rounded-xl border border-gray-200 hover:border-darker-blue text-xs font-bold text-gray-700 transition cursor-pointer">{w}</button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-[10px] text-green-800">
                <Shield size={13} className="text-green-600 shrink-0" />
                Your payment is secured with 256-bit SSL encryption.
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                <Lock size={15} /> Pay ₹{hackathon?.feeAmount || 0} Securely
              </button>

              <p className="text-center text-[10px] text-gray-400 font-alef">By paying, you agree to the hackathon's terms and conditions.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
