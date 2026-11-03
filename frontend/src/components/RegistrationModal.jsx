import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  X,
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Dices,
  Lock,
  Crown,
  ChevronRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import hackathonService from '../backend/hackathon.js';

// Random cool team name suggestions
const TEAM_NAMES = [
  'Quantum Forge',
  'Code Vanguard',
  'Nova Pioneers',
  'Byte Crafters',
  'Syntax Hackers',
  'Cyber Wolves',
  'Algorithm Aces',
  'Pixel Phoenix',
  'Binary Titans',
  'Vector Mavericks',
  'Apex Builders',
  'ZeroDay Innovators',
  'Hyperloop Hackers',
];

const RegistrationModal = ({
  isOpen,
  onClose,
  hackathon,
  onRegistrationSuccess,
}) => {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth.userData?.data || state.auth.userData);
  const isLoggedIn = useSelector((state) => state.auth.status);

  const [activeTab, setActiveTab] = useState('CREATE'); // 'CREATE' or 'JOIN'
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [agreedToRules, setAgreedToRules] = useState(true);
  const [agreedToEligibility, setAgreedToEligibility] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Set default team name when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessData(null);
      setCopied(false);
      if (authUser?.fullName || authUser?.username) {
        setTeamName(`${authUser.fullName || authUser.username}'s Team`);
      } else {
        setTeamName('');
      }
    }
  }, [isOpen, authUser]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !hackathon) return null;

  const hackathonId = hackathon._id || hackathon.slug;
  const teamMin = hackathon.teamMinSize || 1;
  const teamMax = hackathon.teamMaxSize || 4;

  const handleRandomizeName = () => {
    const random = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];
    setTeamName(random);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!agreedToRules) {
      setError('Please agree to the Hackathon Rules and Code of Conduct to proceed.');
      return;
    }

    if (activeTab === 'CREATE') {
      if (!teamName.trim() || teamName.trim().length < 2) {
        setError('Please enter a team name with at least 2 characters.');
        return;
      }
      if (teamName.trim().length > 60) {
        setError('Team name cannot exceed 60 characters.');
        return;
      }
    } else {
      if (!inviteCode.trim() || inviteCode.trim().length < 4) {
        setError('Please enter a valid team invite code.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload =
        activeTab === 'CREATE'
          ? { action: 'CREATE', teamName: teamName.trim() }
          : { action: 'JOIN', inviteCode: inviteCode.trim().toUpperCase() };

      const res = await hackathonService.registerHackathon(hackathonId, payload);
      const data = res?.data || res;

      setSuccessData(data);
      if (onRegistrationSuccess) {
        onRegistrationSuccess(data);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please check the requirements and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden font-space flex flex-col max-h-[90vh]">
        {/* Header Strip with Event Banner Preview */}
        <div className="relative bg-gradient-to-r from-darker-blue via-[#232f72] to-[#1e2337] p-6 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400 text-lime-950 uppercase tracking-wider">
              {hackathon.mode || 'Online'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
              {hackathon.paid ? `Paid Entry` : 'Free Entry'}
            </span>
            <span className="text-white/80 text-xs flex items-center gap-1 font-medium ml-auto mr-8">
              <Users size={12} />
              {teamMin === teamMax
                ? `${teamMin} members`
                : `${teamMin}–${teamMax} members`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate leading-tight">
            {hackathon.eventName || 'Hackathon Registration'}
          </h2>
          <p className="text-xs text-lime-200/90 truncate font-alef mt-0.5">
            {hackathon.theme || 'Complete your registration to participate'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Unauthenticated State */}
          {!isLoggedIn ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/60 shadow-xs">
                <Lock size={26} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-darker-blue">Sign in to Register</h3>
                <p className="text-xs text-gray-500 font-alef max-w-sm mx-auto mt-1">
                  You need an active account to register a team, access hackathon challenges, and submit your project.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 rounded-xl bg-darker-blue text-white text-xs font-bold hover:bg-dark-blue transition cursor-pointer"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Create an Account
                </button>
              </div>
            </div>
          ) : successData ? (
            /* ─── SUCCESS CELEBRATION STATE ─── */
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              <div className={`w-16 h-16 rounded-3xl ${hackathon.paid ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'} flex items-center justify-center mx-auto shadow-md border`}>
                <CheckCircle2 size={34} />
              </div>

              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${hackathon.paid ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
                  {hackathon.paid ? 'Team Created! 🎉 Payment Required' : 'Registration Confirmed 🎉'}
                </span>
                <h3 className="text-2xl font-extrabold text-darker-blue mt-2">
                  {hackathon.paid ? 'One More Step!' : "You're Officially In!"}
                </h3>
                <p className="text-xs text-gray-500 font-alef mt-1">
                  {hackathon.paid
                    ? `Your team has been created. Complete payment of ₹${hackathon.feeAmount} to activate your registration.`
                    : `Welcome to ${hackathon.eventName}. Get your team ready!`
                  }
                </p>
              </div>

              {/* Team Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Your Team</span>
                    <p className="text-base font-extrabold text-darker-blue leading-tight">
                      {successData?.team?.name || successData?.teamName || teamName}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1">
                    <Crown size={12} />
                    {successData?.inviteCode ? 'Team Leader' : 'Team Member'}
                  </span>
                </div>

                {/* Invite Code Box (if leader) */}
                {(successData?.inviteCode || successData?.team?.inviteCode) && (
                  <div className="p-3 rounded-xl bg-white border border-dashed border-darker-blue/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-semibold flex items-center gap-1">
                        <KeyRound size={12} className="text-darker-blue" />
                        Teammate Invite Code:
                      </span>
                      <span className="text-[10px] text-gray-400">Share with members</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 px-3 py-2 rounded-lg font-mono text-base font-extrabold text-darker-blue tracking-widest text-center border border-slate-200">
                        {successData?.inviteCode || successData?.team?.inviteCode}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(successData?.inviteCode || successData?.team?.inviteCode)}
                        className="px-4 py-2 rounded-lg bg-darker-blue text-white text-xs font-bold hover:bg-dark-blue transition flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-lime-300" /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {((hackathon.paid || successData?.paid) && !successData?.isTeamPaid) ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      const targetHackathonId = successData?.hackathonId || successData?.team?.hackathonId || hackathonId;
                      navigate(`/hackathon/${targetHackathonId}/payment`, {
                        state: {
                          hackathon,
                          team: successData?.team || { name: teamName },
                        },
                      });
                    }}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    💳 Proceed to Payment (₹{successData?.feeAmount || hackathon.feeAmount}) <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      const targetHackathonId = successData?.hackathonId || successData?.team?.hackathonId || hackathonId;
                      navigate(`/hackathon/${targetHackathonId}/participate`);
                    }}
                    className="w-full py-3 rounded-xl bg-darker-blue text-white text-xs font-bold hover:bg-dark-blue shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Go to Participation Hub <ArrowRight size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ─── ACTIVE FORM STATE ─── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Segmented Mode Selector */}
              <div className="p-1 rounded-2xl bg-slate-100 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('CREATE');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
                    ${activeTab === 'CREATE'
                      ? 'bg-white text-darker-blue shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <UserPlus size={13} />
                  Create a Team
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('JOIN');
                    setError('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
                    ${activeTab === 'JOIN'
                      ? 'bg-white text-darker-blue shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                    }`}
                >
                  <KeyRound size={13} />
                  Join with Code
                </button>
              </div>

              {/* Paid / Free Registration Badge */}
              {hackathon.paid ? (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1.5">
                    💳 Registration Fee
                  </span>
                  <span className="font-bold text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg shadow-xs">
                    ₹{hackathon.feeAmount}
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span className="font-semibold">🎟️ Entry Type</span>
                  <span className="font-bold text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Free Entry
                  </span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB 1: CREATE A TEAM */}
              {activeTab === 'CREATE' ? (
                <div className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-darker-blue">
                        Team Name <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRandomizeName}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Dices size={12} /> Suggest Name
                      </button>
                    </div>

                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Quantum Builders"
                      maxLength={60}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-darker-blue focus:ring-2 focus:ring-darker-blue/20 outline-none text-xs text-darker-blue font-medium transition"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Between 2 and 60 characters. This will appear on submissions and leaderboards.
                    </p>
                  </div>

                  {/* Leader Info Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-darker-blue text-white flex items-center justify-center font-bold text-xs">
                        {(authUser?.fullName || authUser?.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-darker-blue">
                          {authUser?.fullName || authUser?.username || 'You'}
                        </p>
                        <p className="text-[10px] text-gray-500">{authUser?.email || 'Logged in user'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Crown size={11} /> Team Leader
                    </span>
                  </div>

                  {/* Team Size Tip */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0 text-indigo-600" />
                    <span>
                      After creating your team, you will receive an <strong>Invite Code</strong> to share with up to{' '}
                      <strong>{teamMax - 1}</strong> teammates!
                    </span>
                  </div>
                </div>
              ) : (
                /* TAB 2: JOIN WITH CODE */
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-darker-blue block mb-1.5">
                      Team Invite Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCD1234"
                      maxLength={12}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-darker-blue focus:ring-2 focus:ring-darker-blue/20 outline-none text-sm text-darker-blue font-mono font-bold tracking-wider uppercase transition text-center"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Enter the 8-character invite code provided by your team leader.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-gray-600 font-alef leading-relaxed">
                    Joining a team grants you access to team submissions, workspace communication, and results.
                  </div>
                </div>
              )}

              {/* Agreement Checkboxes */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToEligibility}
                    onChange={(e) => setAgreedToEligibility(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-darker-blue focus:ring-darker-blue"
                  />
                  <span>
                    I confirm that I meet the eligibility criteria for this hackathon (
                    <strong>
                      {hackathon.eligibility
                        ? hackathon.eligibility.replace(/_/g, ' ').toLowerCase()
                        : 'open to all'}
                    </strong>
                    ).
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToRules}
                    onChange={(e) => setAgreedToRules(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-darker-blue focus:ring-darker-blue"
                  />
                  <span>
                    I agree to abide by the Hackathon Rules, Code of Conduct, and Original Code Plagiarism Policy.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading || !agreedToRules || !agreedToEligibility}
                  className="w-full py-3 rounded-xl bg-darker-blue hover:bg-dark-blue active:scale-98 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering…
                    </>
                  ) : activeTab === 'CREATE' ? (
                    <>
                      {hackathon.paid ? `Create Team & Register (₹${hackathon.feeAmount})` : 'Create Team & Register'} <ChevronRight size={14} />
                    </>
                  ) : (
                    <>
                      {hackathon.paid ? `Join Team & Register (₹${hackathon.feeAmount})` : 'Join Team & Register'} <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal;

