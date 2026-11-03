import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  Code2,
  Video,
  FileText,
  KeyRound,
  Trash2,
  Crown,
  Trophy,
  Award,
  Radio,
  ChevronRight,
  ShieldAlert,
  X,
  CreditCard,
  UserPlus,
  MapPin,
  Building2,
  Share2,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';

function formatMinutes(mins) {
  if (mins === null || mins === undefined) return '';
  if (mins <= 0) return 'Deadline passed';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  return `${hours}h ${remainingMins}m left`;
}

function formatDate(d) {
  if (!d) return 'TBA';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return 'TBA';
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Participate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Submission Form State
  const [selectedRound, setSelectedRound] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState('');
  const [submissionForm, setSubmissionForm] = useState({
    repoUrl: '',
    liveUrl: '',
    deckFileUrl: '',
    pitchVideoUrl: '',
    description: '',
    demoCredentials: '',
  });

  const fetchJourney = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hackathonService.getParticipateData(id);
      const journey = res?.data || res;
      setData(journey);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load participation data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLeaveOrDisband = async () => {
    const isLeader = data?.isLeader;
    const confirmMsg = isLeader
      ? 'Are you sure you want to disband your team? All members will be removed and registered teams count decremented.'
      : 'Are you sure you want to leave this team?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await hackathonService.leaveOrDisbandTeam(id);
      alert(isLeader ? 'Team disbanded successfully.' : 'You left the team.');
      navigate(`/hackathon/${id}`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not leave/disband team.');
    }
  };

  const openSubmissionModal = (round) => {
    setSelectedRound(round);
    setSubmissionSuccess('');
    setError('');
    const prevSub = round.submission;
    if (prevSub) {
      setSubmissionForm({
        repoUrl: prevSub.repoUrl || '',
        liveUrl: prevSub.liveUrl || '',
        deckFileUrl: prevSub.deckFileUrl || '',
        pitchVideoUrl: prevSub.pitchVideoUrl || '',
        description: prevSub.description || '',
        demoCredentials: prevSub.demoCredentials || '',
      });
    } else {
      setSubmissionForm({
        repoUrl: '',
        liveUrl: '',
        deckFileUrl: '',
        pitchVideoUrl: '',
        description: '',
        demoCredentials: '',
      });
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedRound) return;

    setSubmissionLoading(true);
    setError('');
    try {
      await hackathonService.submitWork(id, {
        roundId: selectedRound.roundId,
        ...submissionForm,
      });

      setSubmissionSuccess('Work submitted successfully! You can update it until the round deadline.');
      await fetchJourney();
      setTimeout(() => {
        setSelectedRound(null);
        setSubmissionSuccess('');
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit work.');
    } finally {
      setSubmissionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 pl-16 pr-6 min-h-screen bg-default-bg flex items-center justify-center font-space">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-darker-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-gray-500">Loading participation dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.isRegistered) {
    return (
      <div className="pt-20 pl-16 pr-6 min-h-screen bg-default-bg font-space">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-gray-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-darker-blue">Participation Hub</h2>
          <p className="text-xs text-gray-600 font-alef">
            {error || 'You are not currently registered for this hackathon.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate(`/hackathon/${id}`)}
              className="px-5 py-2.5 rounded-xl bg-darker-blue text-white text-xs font-bold hover:bg-dark-blue transition cursor-pointer"
            >
              Go to Hackathon Page & Register
            </button>
            <button
              onClick={() => navigate('/home')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment pending state — show payment prompt
  if (data?.overallStatus === 'PAYMENT_PENDING') {
    return (
      <div className="pt-20 pl-16 pr-6 min-h-screen bg-default-bg font-space">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-amber-200 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <CreditCard size={30} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Payment Required</span>
            <h2 className="text-xl font-bold text-darker-blue mt-3">Complete Your Registration</h2>
            <p className="text-xs text-gray-500 font-alef mt-1">
              Your team has been created. Complete payment to unlock full participation access.
            </p>
          </div>
          {data?.hackathon?.feeAmount && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
              <p className="text-xs text-purple-700 font-semibold">Registration Fee</p>
              <p className="text-3xl font-extrabold text-purple-900 mt-1">₹{data.hackathon.feeAmount}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(`/hackathon/${id}/payment`, { state: { hackathon: data.hackathon, team: data.team } })}
              className="py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard size={14} /> Proceed to Payment
            </button>
            <button
              onClick={() => navigate(`/hackathon/${id}`)}
              className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
            >
              Back to Hackathon
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { hackathon, team, overallStatus, rounds = [], summary = {} } = data;

  const statusColor =
    overallStatus === 'FINALIST'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : overallStatus === 'ELIMINATED'
      ? 'bg-rose-100 text-rose-800 border-rose-200'
      : overallStatus === 'HACKATHON_COMPLETED'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : 'bg-indigo-100 text-indigo-800 border-indigo-200';

  return (
    <div className="pt-12 pl-14 sm:pl-16 pr-4 sm:pr-8 pb-16 min-h-screen bg-default-bg font-space">
      <div className="max-w-[1240px] mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/hackathon/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-darker-blue transition-colors cursor-pointer bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-2xs"
          >
            <ArrowLeft size={13} />
            Back to Hackathon Details
          </button>

          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
            Status: {overallStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {/* ─── Header Card: Hackathon & Team Summary ─── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400 text-lime-950 uppercase tracking-wider">
                  {hackathon?.mode || 'Hybrid'}
                </span>
                <span className="text-xs text-gray-400 font-medium">Participant Journey</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-darker-blue tracking-tight">
                {hackathon?.eventName}
              </h1>
              <p className="text-xs text-dark-green font-semibold mt-0.5">{hackathon?.theme}</p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shrink-0">
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Rounds</span>
                <p className="text-lg font-extrabold text-darker-blue">{summary.totalRounds || rounds.length}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Completed</span>
                <p className="text-lg font-extrabold text-emerald-600">{summary.roundsCompleted || 0}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Current Round</span>
                <p className="text-lg font-extrabold text-indigo-600">
                  {summary.currentRoundNumber ? `R${summary.currentRoundNumber}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Grid: 2 Columns ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Rounds Timeline & Work Submission */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-darker-blue flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    Hackathon Rounds & Submissions
                  </h2>
                  <p className="text-xs text-gray-500 font-alef mt-0.5">
                    Submit and update your deliverables before each round deadline.
                  </p>
                </div>
              </div>

              {/* Rounds List */}
              <div className="space-y-6">
                {rounds.map((round, idx) => {
                  const isEligible = round.isEligible;
                  const isActive = round.roundStatus === 'ACTIVE';
                  const isSubmitted = round.participantStatus === 'SUBMITTED';
                  const isAdvanced = round.participantStatus === 'ADVANCED';
                  const isEliminated = round.participantStatus === 'ELIMINATED';

                  return (
                    <div
                      key={round.roundId || idx}
                      className="relative pl-8 pb-6 last:pb-0 border-l-2 border-darker-blue/20 last:border-l-transparent"
                    >
                      {/* Step Circle */}
                      <div
                        className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs
                          ${isAdvanced
                            ? 'bg-emerald-500 text-white'
                            : isEliminated
                            ? 'bg-rose-500 text-white'
                            : isActive
                            ? 'bg-darker-blue text-white ring-4 ring-indigo-100'
                            : 'bg-slate-200 text-gray-600'
                          }`}
                      >
                        {round.roundNumber}
                      </div>

                      <div className="bg-slate-50/80 rounded-2xl p-5 border border-gray-200/60 space-y-3">
                        {/* Title Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-darker-blue flex items-center gap-2">
                              {round.roundName}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                                {round.roundType}
                              </span>
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Opens: {formatDate(round.roundOpens)} • Closes: {formatDate(round.roundCloses)}
                            </p>
                          </div>

                          {/* Round State Pill */}
                          <div className="flex items-center gap-1.5">
                            {isActive && round.minutesToDeadline !== null && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Clock size={11} /> {formatMinutes(round.minutesToDeadline)}
                              </span>
                            )}
                            <span
                              className={`px-3 py-0.5 rounded-full text-xs font-bold
                                ${isAdvanced
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isEliminated
                                  ? 'bg-rose-100 text-rose-800'
                                  : isSubmitted
                                  ? 'bg-blue-100 text-blue-800'
                                  : isActive
                                  ? 'bg-lime-100 text-lime-900'
                                  : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                              {round.participantStatus.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Offline Venue Info */}
                        {round.isOnline === false && (
                          <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-xs flex items-start gap-2">
                            <MapPin size={13} className="text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-orange-900">{round.offlineVenue || 'In-Person Round'}</p>
                              {round.offlineAddress && <p className="text-orange-700 font-alef">{round.offlineAddress}</p>}
                              {round.offlineMapLink && (
                                <a href={round.offlineMapLink} target="_blank" rel="noreferrer"
                                  className="text-orange-600 underline flex items-center gap-1 mt-0.5">
                                  <MapPin size={10} /> View on Maps
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Existing Submission Details */}
                        {round.submission && (
                          <div className="p-3.5 rounded-xl bg-white border border-gray-100 text-xs space-y-2">
                            <div className="flex items-center justify-between text-gray-500 font-semibold text-[11px]">
                              <span>Your Submission Deliverables</span>
                              <span>Submitted {formatDate(round.submission.submittedAt)}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {round.submission.repoUrl && (
                                <a
                                  href={round.submission.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 truncate"
                                >
                                  <Code2 size={12} /> Repo: {round.submission.repoUrl}
                                </a>
                              )}
                              {round.submission.liveUrl && (
                                <a
                                  href={round.submission.liveUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 truncate"
                                >
                                  <ExternalLink size={12} /> Live Demo: {round.submission.liveUrl}
                                </a>
                              )}
                              {round.submission.deckFileUrl && (
                                <a
                                  href={round.submission.deckFileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 truncate"
                                >
                                  <FileText size={12} /> Deck: {round.submission.deckFileUrl}
                                </a>
                              )}
                              {round.submission.pitchVideoUrl && (
                                <a
                                  href={round.submission.pitchVideoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 truncate"
                                >
                                  <Video size={12} /> Video: {round.submission.pitchVideoUrl}
                                </a>
                              )}
                            </div>

                            {round.submission.description && (
                              <p className="text-[11px] text-gray-600 font-alef line-clamp-2 pt-1 border-t border-gray-50">
                                {round.submission.description}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Round Cleared Celebration Banner */}
                        {(isAdvanced || round.isRoundCleared || round.submission?.status === 'ADVANCED') && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-2xs space-y-1 animate-in fade-in">
                            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                              <CheckCircle2 size={18} className="text-emerald-600" />
                              🎉 You have cleared this round!
                            </div>
                            <p className="text-xs text-emerald-700 font-alef pl-6 leading-relaxed">
                              Congratulations! Your work has been evaluated and approved. Your team has successfully advanced from this round and is now eligible to submit deliverables for the next stage.
                            </p>
                          </div>
                        )}

                        {isEliminated && (
                          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-alef">
                            <AlertCircle size={16} className="text-rose-600 shrink-0" />
                            <span>Evaluation complete. Your team was not selected to advance from this round. Thank you for participating!</span>
                          </div>
                        )}

                        {/* Result summary if published */}
                        {round.result && (
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
                            <span className="font-bold text-darker-blue flex items-center gap-1.5">
                              <Trophy size={14} className="text-amber-500" />
                              Official Round Score: {round.result.finalScore?.toFixed(1) ?? '—'}
                            </span>
                            {round.result.rank && (
                              <span className="font-extrabold text-indigo-700">Rank #{round.result.rank}</span>
                            )}
                          </div>
                        )}

                        {/* Action CTA */}
                        {isEligible && (isActive || isSubmitted || isAdvanced) && (
                          <div className="pt-2 flex items-center justify-between">
                            {(isAdvanced || round.isRoundCleared) ? (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                Round Cleared · Next Round Unlocked
                              </span>
                            ) : <span />}

                            <button
                              type="button"
                              onClick={() => openSubmissionModal(round)}
                              className="px-4 py-2 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Send size={13} />
                              {isSubmitted ? 'Update Submission' : 'Submit Work for Round'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Team Card & Invite Code */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Your Team</span>
                  <h3 className="text-lg font-bold text-darker-blue leading-tight">{team?.name}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                  {team?.members?.length || 1} Members
                </span>
              </div>

              {/* Invite Code Box (Leader Only) */}
              {team?.inviteCode && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1">
                      <KeyRound size={13} />
                      Team Invite Code
                    </span>
                    <span className="text-[10px] text-amber-700 font-normal">Leader Only</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white px-3 py-2 rounded-xl font-mono text-base font-extrabold text-amber-950 tracking-widest text-center border border-amber-200">
                      {team.inviteCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(team.inviteCode)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-800 font-alef leading-tight">
                    Share this code with teammates so they can join your team during registration.
                  </p>
                </div>
              )}

              {/* Members List */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Team Members</p>
                <div className="space-y-2">
                  {(team?.members || []).map((m) => {
                    const isLeader =
                      m._id?.toString() === team?.leaderId?._id?.toString() ||
                      m._id?.toString() === team?.leaderId?.toString();
                    return (
                      <div
                        key={m._id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-darker-blue text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(m.fullName || m.username || 'M')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-darker-blue">{m.fullName || m.username}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{m.email}</p>
                          </div>
                        </div>

                        {isLeader && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Crown size={10} /> Leader
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Invite Friends (leader only) */}
              {data?.isLeader && data?.team?.inviteCode && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 space-y-2">
                  <p className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                    <UserPlus size={12} /> Invite Teammates
                  </p>
                  <p className="text-[10px] text-indigo-700 font-alef leading-snug">
                    Share your invite code with friends. They can join your team during hackathon registration.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`Join my team for ${data.hackathon?.eventName}! Use code: ${data.team.inviteCode}`);
                      alert('Invite message copied to clipboard!');
                    }}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 size={12} /> Copy Invite Message
                  </button>
                </div>
              )}

              {/* Leave / Disband Team */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLeaveOrDisband}
                  className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} />
                  {data?.isLeader ? 'Disband Team' : 'Leave Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Work Submission Modal ─── */}
      {selectedRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 font-space space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Round {selectedRound.roundNumber} Deliverables
                </span>
                <h3 className="text-base font-extrabold text-darker-blue leading-tight">
                  {selectedRound.roundName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRound(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {submissionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{submissionSuccess}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWork} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-darker-blue block mb-1">
                  Code Repository URL (GitHub / GitLab)
                </label>
                <input
                  type="url"
                  value={submissionForm.repoUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, repoUrl: e.target.value })}
                  placeholder="https://github.com/your-team/project"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-darker-blue transition text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-darker-blue block mb-1">
                  Live Deployment / Demo URL
                </label>
                <input
                  type="url"
                  value={submissionForm.liveUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, liveUrl: e.target.value })}
                  placeholder="https://your-hackathon-project.vercel.app"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-darker-blue transition text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-darker-blue block mb-1">
                    Presentation Deck URL (SlideShare/Drive)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.deckFileUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, deckFileUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-darker-blue transition text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-darker-blue block mb-1">
                    Pitch Video URL (YouTube / Loom)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.pitchVideoUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, pitchVideoUrl: e.target.value })}
                    placeholder="https://youtu.be/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-darker-blue transition text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-darker-blue block mb-1">
                  Project Description & Overview
                </label>
                <textarea
                  rows={3}
                  value={submissionForm.description}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                  placeholder="What problem does this solve? What tech stack did your team use?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-darker-blue transition text-xs font-alef"
                />
              </div>

              <div>
                <label className="font-bold text-darker-blue block mb-1">
                  Demo Test Credentials (Optional)
                </label>
                <input
                  type="text"
                  value={submissionForm.demoCredentials}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, demoCredentials: e.target.value })}
                  placeholder="admin@test.com / demo123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-darker-blue transition text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRound(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionLoading}
                  className="px-5 py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submissionLoading ? 'Saving Deliverables…' : 'Submit Deliverables'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Participate;

