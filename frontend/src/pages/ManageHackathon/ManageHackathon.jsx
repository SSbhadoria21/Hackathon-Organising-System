import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Users, FileText, Trophy, Clock, Edit3,
  ExternalLink, CheckCircle2, AlertCircle, Loader2, BarChart3,
  ChevronDown, ChevronUp, Eye, Shield, Download, Trash2, RefreshCw,
  Calendar, MapPin, DollarSign, Radio, Target, X, Scale, Award,
  Sparkles, Star, MessageSquare, Check, Sliders, Globe, Code2,
  Presentation, Video, Filter,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';

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

function getStatusColor(status) {
  switch (status) {
    case 'DRAFT': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'PUBLISHED': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ONGOING': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'COMPLETED': return 'bg-purple-100 text-purple-800 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getSubmissionStatusBadge(status) {
  switch (status) {
    case 'ADVANCED':
      return {
        label: '🎉 Round Cleared · Advanced',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'REJECTED':
      return {
        label: 'Not Advanced',
        className: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'EVALUATING':
      return {
        label: '⏳ Under Evaluation',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'SUBMITTED':
    default:
      return {
        label: 'Submitted',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
      };
  }
}

const ManageHackathon = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [expandedRound, setExpandedRound] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submissionRoundFilter, setSubmissionRoundFilter] = useState('ALL');

  // User role & judge info
  const [userRole, setUserRole] = useState('ORGANIZER');
  const [isJudge, setIsJudge] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(true);
  const [judgeProfile, setJudgeProfile] = useState(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Scoring / Evaluation modal state
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [activeSub, setActiveSub] = useState(null);
  const [activeRound, setActiveRound] = useState(null);
  const [criteriaScores, setCriteriaScores] = useState([]);
  const [overallComment, setOverallComment] = useState('');
  const [advanceTeam, setAdvanceTeam] = useState(true);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoringError, setScoringError] = useState('');
  const [scoringSuccess, setScoringSuccess] = useState('');

  const handleDeleteHackathon = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await hackathonService.deleteHackathon(id);
      navigate('/activities?tab=created', {
        state: { message: 'Hackathon deleted successfully.' },
      });
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError(err?.response?.data?.message || 'Failed to delete hackathon. Please try again.');
      setIsDeleting(false);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      let mgmtData = null;
      try {
        const mgmtRes = await hackathonService.getManagementData(id);
        mgmtData = mgmtRes?.data || mgmtRes;
      } catch (e) {
        console.warn('getManagementData fallback:', e);
      }

      if (mgmtData?.hackathon) {
        setHackathon(mgmtData.hackathon);
        setTeams(Array.isArray(mgmtData.teams) ? mgmtData.teams : []);
        setSubmissions(Array.isArray(mgmtData.submissions) ? mgmtData.submissions : []);
        setUserRole(mgmtData.userRole || 'ORGANIZER');
        setIsJudge(Boolean(mgmtData.isJudge));
        setIsOrganizer(mgmtData.isOrganizer !== false);
        setJudgeProfile(mgmtData.judgeProfile || null);

        const rList = Array.isArray(mgmtData.rounds)
          ? mgmtData.rounds
          : Array.isArray(mgmtData.hackathon?.rounds)
          ? mgmtData.hackathon.rounds
          : [];
        setRounds(rList);

        if (rList.length > 0) {
          const firstRId = rList[0]._id?.toString() || rList[0].id?.toString();
          setExpandedRound(firstRId);
        }

        if (mgmtData.isJudge && !mgmtData.isOrganizer) {
          setActiveTab('submissions');
        }
      } else {
        // Fallback to individual endpoints
        const res = await hackathonService.getHackathonById(id);
        const data = res?.data || res;
        const hData = data?.hackathon || data;
        setHackathon(hData);

        const rList = Array.isArray(hData?.rounds)
          ? hData.rounds
          : Array.isArray(hData?.roundIds)
          ? hData.roundIds
          : [];
        setRounds(rList);

        if (rList.length > 0) {
          const firstRId = rList[0]._id?.toString() || rList[0].id?.toString();
          setExpandedRound(firstRId);
        }

        try {
          const teamsRes = await hackathonService.getManageTeams(id);
          const td = teamsRes?.data || teamsRes;
          setTeams(Array.isArray(td?.teams) ? td.teams : Array.isArray(td) ? td : []);
        } catch {}

        try {
          const subRes = await hackathonService.getManageSubmissions(id);
          const sd = subRes?.data || subRes;
          setSubmissions(Array.isArray(sd?.submissions) ? sd.submissions : Array.isArray(sd) ? sd : []);
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching hackathon details:', err);
      setError(err?.response?.data?.message || 'Failed to load hackathon details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Open scoring modal for a submission
  const openScoringModal = (submission, roundArg = null) => {
    const subRoundId = (submission.roundId?._id || submission.roundId)?.toString();
    const r =
      roundArg ||
      rounds.find(rd => (rd._id || rd.id)?.toString() === subRoundId) ||
      (submission.roundId && typeof submission.roundId === 'object' ? submission.roundId : null) ||
      rounds[0] ||
      {};

    setActiveSub(submission);
    setActiveRound(r);
    setScoringError('');
    setScoringSuccess('');

    // Pre-populate criteria from round
    const roundCriterias =
      r.criterias?.length > 0
        ? r.criterias
        : [
            {
              _id: 'default',
              name: 'Overall Innovation & Execution',
              weight: 100,
              description: 'Evaluation of project quality, originality, and completeness',
            },
          ];

    // Check if current user or submission has existing scores
    const existingJudgeScore = submission.myScore || (submission.scores && submission.scores[0]);
    const prevCriteriaScores = existingJudgeScore?.criteriaScores || [];

    const initialCriteriaScores = roundCriterias.map(c => {
      const match = prevCriteriaScores.find(
        pcs => (pcs.criteriaId?._id || pcs.criteriaId)?.toString() === (c._id)?.toString()
      );
      return {
        criteriaId: c._id?.toString() || 'default',
        name: c.name,
        weight: Number(c.weight) || Math.round(100 / roundCriterias.length),
        description: c.description || '',
        score: match ? match.score : 80,
        comment: match?.comment || '',
      };
    });

    setCriteriaScores(initialCriteriaScores);
    setOverallComment(existingJudgeScore?.overallComment || '');
    setAdvanceTeam(submission.status === 'ADVANCED' || true);
    setScoringModalOpen(true);
  };

  const handleScoreChange = (index, newScore) => {
    const val = Math.max(0, Math.min(100, Number(newScore) || 0));
    setCriteriaScores(prev => {
      const next = [...prev];
      next[index] = { ...next[index], score: val };
      return next;
    });
  };

  const handleScoreCommentChange = (index, comment) => {
    setCriteriaScores(prev => {
      const next = [...prev];
      next[index] = { ...next[index], comment };
      return next;
    });
  };

  const calculateTotalScore = () => {
    if (!criteriaScores.length) return 0;
    const totalWeight = criteriaScores.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
    if (totalWeight <= 0) {
      const avg = criteriaScores.reduce((sum, c) => sum + (Number(c.score) || 0), 0) / criteriaScores.length;
      return Math.round(avg);
    }
    const weightedSum = criteriaScores.reduce(
      (sum, c) => sum + (Number(c.score) || 0) * (Number(c.weight) || 0),
      0
    );
    return Math.round(weightedSum / totalWeight);
  };

  const handleSaveScore = async () => {
    if (!activeSub) return;
    setIsSavingScore(true);
    setScoringError('');
    setScoringSuccess('');

    try {
      const payload = {
        submissionId: activeSub._id?.toString(),
        criteriaScores: criteriaScores.map(cs => ({
          criteriaId: cs.criteriaId,
          score: Number(cs.score),
          comment: cs.comment ? cs.comment.trim() : undefined,
        })),
        overallComment: overallComment.trim() || undefined,
        advanceTeam: advanceTeam,
        status: advanceTeam ? 'ADVANCED' : 'EVALUATING',
      };

      await hackathonService.submitJudgeScore(id, payload);
      setScoringSuccess(
        advanceTeam
          ? 'Marks assigned! Team has been successfully cleared and advanced to the next round.'
          : 'Marks assigned successfully!'
      );

      // Refresh hackathon data
      await fetchData();

      setTimeout(() => {
        setScoringModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Error saving score:', err);
      setScoringError(err?.response?.data?.message || err?.message || 'Failed to submit score');
    } finally {
      setIsSavingScore(false);
    }
  };

  // Filtered submissions for the Submissions tab
  const filteredSubmissions = useMemo(() => {
    if (submissionRoundFilter === 'ALL') return submissions;
    return submissions.filter(s => {
      const sRoundId = (s.roundId?._id || s.roundId)?.toString();
      return sRoundId === submissionRoundFilter;
    });
  }, [submissions, submissionRoundFilter]);

  if (loading) {
    return (
      <div className="pt-20 pl-16 min-h-screen bg-default-bg flex items-center justify-center font-space">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-darker-blue mx-auto" />
          <p className="text-xs font-semibold text-gray-500">Loading management dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 pl-16 min-h-screen bg-default-bg flex items-center justify-center font-space">
        <div className="max-w-md bg-white rounded-3xl p-8 text-center space-y-4 border border-rose-200">
          <AlertCircle size={32} className="text-rose-500 mx-auto" />
          <p className="text-sm text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/activities')}
            className="px-5 py-2 rounded-xl bg-darker-blue text-white text-xs font-bold cursor-pointer"
          >
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  const metrics = {
    totalTeams: teams.length,
    paidTeams: teams.filter(t => t.paymentStatus === 'PAID').length,
    totalSubmissions: submissions.length,
    totalRounds: rounds.length,
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'submissions', label: `Submissions (${metrics.totalSubmissions})`, icon: FileText },
    { id: 'rounds', label: `Rounds (${metrics.totalRounds})`, icon: Target },
    { id: 'teams', label: `Teams (${metrics.totalTeams})`, icon: Users },
  ];

  return (
    <div className="pt-12 pl-14 sm:pl-16 pr-4 sm:pr-8 pb-20 min-h-screen bg-default-bg font-space">
      <div className="max-w-[1360px] mx-auto space-y-6">

        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <button
            onClick={() => navigate('/activities')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-darker-blue transition bg-white/70 px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Activities
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>

            <button
              onClick={() => navigate(`/hackathons/${id}`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              <ExternalLink size={13} /> View Public Page
            </button>

            {isOrganizer && (
              <>
                <button
                  onClick={() => navigate(`/create-hackathon?id=${id}&mode=edit`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <Edit3 size={13} /> Edit Details
                </button>
                <button
                  onClick={() => {
                    setDeleteError('');
                    setShowDeleteModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <Trash2 size={13} /> Delete Hackathon
                </button>
              </>
            )}
          </div>
        </div>

        {/* Judge Banner if authenticated as Judge */}
        {isJudge && !isOrganizer && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-darker-blue text-white rounded-3xl p-5 sm:p-6 shadow-md border border-purple-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-xl text-purple-300">
                <Scale size={22} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">Official Judge Dashboard</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30">
                    Judge Access
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 font-alef leading-relaxed max-w-2xl">
                  You are evaluating submissions as an appointed judge. Review all deliverables below, evaluate projects according to the rubrics, assign marks, and qualify teams to advance.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('submissions')}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-sm transition shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <FileText size={14} /> Review Submissions ({submissions.length})
            </button>
          </div>
        )}

        {/* Header Card */}
        <div className="relative bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          {hackathon?.banner && (
            <div className="h-32 w-full relative">
              <img src={hackathon.banner} alt={hackathon.eventName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(hackathon?.status)}`}>
                    {hackathon?.status || 'Unknown'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-100 text-lime-800">
                    {hackathon?.mode || 'Online'}
                  </span>
                  {hackathon?.paid && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      Paid · ₹{hackathon?.feeAmount}
                    </span>
                  )}
                  {isJudge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                      <Scale size={10} /> {isOrganizer ? 'Organizer & Judge' : 'Judge'}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-darker-blue">{hackathon?.eventName}</h1>
                <p className="text-xs text-dark-green font-semibold mt-0.5">{hackathon?.theme}</p>
                <p className="text-xs text-gray-500 font-alef mt-1">By {hackathon?.organizingBody || 'Your Organization'}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3 shrink-0">
                {[
                  { label: 'Submissions', value: metrics.totalSubmissions, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Rounds', value: metrics.totalRounds, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Teams', value: metrics.totalTeams, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Paid', value: metrics.paidTeams, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center min-w-[72px]`}>
                    <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-darker-blue text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <h2 className="text-lg font-bold text-darker-blue flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" /> Hackathon Timeline
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Registration Opens', value: hackathon?.registrationOpens },
                  { label: 'Registration Closes', value: hackathon?.registrationCloses },
                  { label: 'Hacking Starts', value: hackathon?.hackingStartsAt },
                  { label: 'Hacking Ends', value: hackathon?.hackingEndsAt },
                  { label: 'Result Announcement', value: hackathon?.resultAnnouncementDate },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-gray-100 text-xs"
                  >
                    <span className="text-gray-500 font-semibold">{item.label}</span>
                    <span className="font-bold text-darker-blue">{formatDate(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 space-y-3">
                <h2 className="text-base font-bold text-darker-blue">Event Details</h2>
                {hackathon?.address && (
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-alef">{hackathon.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <Users size={14} className="text-indigo-500" />
                  <span className="text-gray-600">
                    Team size: <strong>{hackathon?.teamMinSize || 1}–{hackathon?.teamMaxSize || 4}</strong> members
                  </span>
                </div>
                {hackathon?.paid && (
                  <div className="flex items-center gap-2 text-xs">
                    <DollarSign size={14} className="text-purple-500" />
                    <span className="text-gray-600">
                      Fee: <strong className="text-purple-700">₹{hackathon.feeAmount}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <Radio size={14} className="text-lime-500" />
                  <span className="text-gray-600">
                    Mode: <strong>{hackathon?.mode || 'Online'}</strong>
                  </span>
                </div>
              </div>

              {/* Problem Statement PDF */}
              {hackathon?.problemStatementPdfUrl && (
                <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5">
                  <h2 className="text-sm font-bold text-darker-blue mb-3">Problem Statement</h2>
                  <a
                    href={`/api/hackathons/${id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-darker-blue text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={13} /> Download PDF
                  </a>
                </div>
              )}
            </div>

            {/* Danger Zone: only if organizer */}
            {isOrganizer && (
              <div className="lg:col-span-3 bg-white rounded-3xl border border-rose-200 shadow-xs p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                      <Trash2 size={18} /> Danger Zone: Delete Hackathon
                    </h3>
                    <p className="text-xs text-gray-500 font-alef max-w-2xl">
                      Permanently delete this hackathon from the database. All registered teams, rounds, submissions, and judge evaluations will be wiped out and the hackathon will no longer appear on the home page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setShowDeleteModal(true);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-200 shrink-0"
                  >
                    <Trash2 size={14} /> Delete Hackathon
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── SUBMISSIONS TAB: VISIBLE DIRECTLY WITHOUT BEING HIDDEN ─── */}
        {activeTab === 'submissions' && (
          <div className="space-y-5">
            {/* Filter Bar & Header */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-darker-blue flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  All Project Submissions ({submissions.length})
                </h2>
                <p className="text-xs text-gray-500 font-alef mt-0.5">
                  Inspect code repositories, live links, and pitch presentations. Score rubrics and mark teams as cleared to advance.
                </p>
              </div>

              {/* Round Filter Tabs */}
              {rounds.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setSubmissionRoundFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      submissionRoundFilter === 'ALL'
                        ? 'bg-white text-darker-blue shadow-2xs'
                        : 'text-gray-600 hover:text-darker-blue'
                    }`}
                  >
                    All Rounds ({submissions.length})
                  </button>
                  {rounds.map((r, ri) => {
                    const rId = (r._id || r.id)?.toString();
                    const count = submissions.filter(
                      s => (s.roundId?._id || s.roundId)?.toString() === rId
                    ).length;

                    return (
                      <button
                        key={rId || ri}
                        type="button"
                        onClick={() => setSubmissionRoundFilter(rId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                          submissionRoundFilter === rId
                            ? 'bg-white text-darker-blue shadow-2xs'
                            : 'text-gray-600 hover:text-darker-blue'
                        }`}
                      >
                        Round {r.roundNumber || ri + 1} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of Submissions */}
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400 space-y-2 shadow-xs">
                <FileText size={36} className="mx-auto opacity-40 text-indigo-500" />
                <h3 className="text-sm font-bold text-darker-blue">No submissions found</h3>
                <p className="text-xs text-gray-500 font-alef max-w-sm mx-auto">
                  {submissions.length === 0
                    ? 'Participants have not submitted any project deliverables for this hackathon yet.'
                    : 'No submissions matched the selected round filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub, si) => {
                  const badge = getSubmissionStatusBadge(sub.status);
                  const scoreVal = sub.myScore?.totalScore || sub.averageScore || sub.finalScore;
                  const roundObj =
                    sub.roundId && typeof sub.roundId === 'object'
                      ? sub.roundId
                      : rounds.find(
                          r => (r._id || r.id)?.toString() === sub.roundId?.toString()
                        ) || {};

                  return (
                    <div
                      key={sub._id || si}
                      className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-darker-blue">
                              {sub.teamId?.name || sub.teamName || 'Team Submission'}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              Round {roundObj.roundNumber || 1}: {roundObj.roundName || 'Submission Phase'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.label}
                            </span>
                            {scoreVal != null && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white flex items-center gap-1 shadow-2xs">
                                <Star size={10} className="fill-white" />
                                Score: {scoreVal}/100
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-alef">
                            Team Leader: <strong>{sub.teamId?.leaderId?.fullName || sub.teamId?.leaderId?.username || 'Team Leader'}</strong>
                            {sub.teamId?.members?.length > 1 && ` · ${sub.teamId.members.length} Members`}
                            {' · '}Submitted on {formatDate(sub.createdAt)}
                          </p>
                        </div>

                        {/* Judge & Assign Marks CTA */}
                        <button
                          type="button"
                          onClick={() => openScoringModal(sub, roundObj)}
                          className="px-5 py-2.5 rounded-2xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0 self-start"
                        >
                          <Scale size={14} />
                          {sub.myScore ? 'Update Evaluation & Marks' : 'Judge & Assign Marks'}
                        </button>
                      </div>

                      {/* Project Deliverables Grid */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 space-y-2.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Project Deliverables
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {sub.liveUrl && (
                            <a
                              href={sub.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold flex items-center gap-1.5 border border-blue-200/70 transition shadow-2xs"
                            >
                              <Globe size={14} /> Live Application <ExternalLink size={11} />
                            </a>
                          )}
                          {sub.repoUrl && (
                            <a
                              href={sub.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold flex items-center gap-1.5 border border-slate-300/70 transition shadow-2xs"
                            >
                              <Code2 size={14} /> GitHub Codebase <ExternalLink size={11} />
                            </a>
                          )}
                          {sub.deckFileUrl && (
                            <a
                              href={sub.deckFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold flex items-center gap-1.5 border border-purple-200/70 transition shadow-2xs"
                            >
                              <Presentation size={14} /> Slide Deck / PPT <ExternalLink size={11} />
                            </a>
                          )}
                          {sub.pitchVideoUrl && (
                            <a
                              href={sub.pitchVideoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold flex items-center gap-1.5 border border-rose-200/70 transition shadow-2xs"
                            >
                              <Video size={14} /> Video Presentation <ExternalLink size={11} />
                            </a>
                          )}
                          {!sub.liveUrl && !sub.repoUrl && !sub.deckFileUrl && !sub.pitchVideoUrl && (
                            <span className="text-xs text-gray-400 italic">No external URLs attached.</span>
                          )}
                        </div>
                      </div>

                      {/* Project Description */}
                      {sub.description && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Project Description & Highlights
                          </p>
                          <p className="text-xs text-gray-700 font-alef leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-gray-100">
                            {sub.description}
                          </p>
                        </div>
                      )}

                      {/* Evaluation Breakdown if available */}
                      {sub.myScore?.criteriaScores?.length > 0 && (
                        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-400 font-bold text-[11px]">Your Scores:</span>
                          {sub.myScore.criteriaScores.map((cs, csi) => (
                            <span
                              key={csi}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 font-semibold text-[11px] border border-indigo-100"
                            >
                              Score: {cs.score}/100
                            </span>
                          ))}
                          {sub.myScore.overallComment && (
                            <span className="text-gray-500 italic text-xs ml-2">
                              "{sub.myScore.overallComment}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ROUNDS TAB (Full Details & Submissions Evaluation) ─── */}
        {activeTab === 'rounds' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-darker-blue flex items-center gap-2">
                  <Target size={20} className="text-blue-600" /> Hackathon Rounds & Submission Evaluation
                </h2>
                <p className="text-xs text-gray-500 font-alef mt-1">
                  Click on any round to view its complete submissions, evaluate project deliverables, assign marks per rubric, and qualify teams for the next round.
                </p>
              </div>
              {isOrganizer && (
                <button
                  onClick={() => navigate(`/create-hackathon?id=${id}&step=3`)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-darker-blue text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Edit3 size={13} /> Edit Rounds
                </button>
              )}
            </div>

            {rounds.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400 space-y-2">
                <Target size={32} className="mx-auto opacity-40" />
                <p className="text-sm font-semibold">No rounds configured</p>
                {isOrganizer && (
                  <button
                    onClick={() => navigate(`/create-hackathon?id=${id}&step=3`)}
                    className="mt-2 px-4 py-2 rounded-xl bg-darker-blue text-white text-xs font-bold cursor-pointer"
                  >
                    Configure Rounds
                  </button>
                )}
              </div>
            ) : (
              rounds.map((round, ri) => {
                const now = new Date();
                const opens = new Date(round.roundOpens);
                const closes = new Date(round.roundCloses);
                const roundStatus = now < opens ? 'UPCOMING' : now > closes ? 'CLOSED' : 'ACTIVE';

                const rId = (round._id || round.id)?.toString() || `r${ri}`;
                const roundSubs = submissions.filter(s => {
                  const sRoundId = (s.roundId?._id || s.roundId)?.toString();
                  return sRoundId === rId || (!sRoundId && rounds.length === 1);
                });

                const isExpanded = expandedRound === rId;

                return (
                  <div
                    key={rId}
                    className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Round Header / Accordion trigger */}
                    <div
                      className="p-6 cursor-pointer hover:bg-slate-50/60 transition"
                      onClick={() => setExpandedRound(isExpanded ? null : rId)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="w-9 h-9 rounded-xl bg-darker-blue text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
                              {round.roundNumber || ri + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-extrabold text-darker-blue">{round.roundName}</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {round.roundType}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    roundStatus === 'ACTIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : roundStatus === 'CLOSED'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {roundStatus}
                                </span>
                                {round.isOnline === false && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 flex items-center gap-1">
                                    <MapPin size={9} /> Offline
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-semibold">Opens</p>
                              <p className="font-bold text-darker-blue mt-0.5">{formatDate(round.roundOpens)}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-semibold">Closes</p>
                              <p className="font-bold text-darker-blue mt-0.5">{formatDate(round.roundCloses)}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-semibold">Max Advancing</p>
                              <p className="font-bold text-darker-blue mt-0.5">{round.maxTeamsAdvancing || '—'}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-semibold">Submissions Received</p>
                              <p className="font-bold text-emerald-600 mt-0.5">{roundSubs.length}</p>
                            </div>
                          </div>

                          {/* Offline Venue details */}
                          {round.isOnline === false && round.offlineVenue && (
                            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-xs flex items-start gap-2">
                              <MapPin size={13} className="text-orange-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-orange-900">{round.offlineVenue}</p>
                                {round.offlineAddress && <p className="text-orange-700 font-alef">{round.offlineAddress}</p>}
                                {round.offlineMapLink && (
                                  <a href={round.offlineMapLink} target="_blank" rel="noreferrer" className="text-orange-600 underline">
                                    View Map
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Evaluation Criteria & Rubrics */}
                          {round.criterias?.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evaluation Rubrics</p>
                              <div className="flex flex-wrap gap-2">
                                {round.criterias.map((c, ci) => (
                                  <span
                                    key={ci}
                                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100"
                                  >
                                    {c.name} ({c.weight}%)
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Accordion indicator */}
                        <div className="flex items-center gap-2 text-xs font-bold text-darker-blue shrink-0">
                          <span className="hidden sm:inline">
                            {isExpanded ? 'Hide Submissions' : `View Submissions & Evaluate (${roundSubs.length})`}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Section: Submissions for this round */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-slate-50/40 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold text-darker-blue flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" />
                            Submissions for Round {round.roundNumber || ri + 1} ({roundSubs.length})
                          </h4>
                          <span className="text-[11px] text-gray-500 font-alef">
                            Review team submissions and click "Judge & Assign Marks" to evaluate each project.
                          </span>
                        </div>

                        {roundSubs.length === 0 ? (
                          <div className="p-8 text-center text-gray-400 space-y-2 bg-white rounded-2xl border border-gray-200/60">
                            <FileText size={28} className="mx-auto opacity-40" />
                            <p className="text-xs font-semibold">No submissions have been received for this round yet.</p>
                            <p className="text-[11px] text-gray-400 font-alef">
                              Teams registered for this hackathon will appear here once they upload their deliverables.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {roundSubs.map((sub, si) => {
                              const badge = getSubmissionStatusBadge(sub.status);
                              const scoreVal = sub.myScore?.totalScore || sub.averageScore || sub.finalScore;

                              return (
                                <div
                                  key={sub._id || si}
                                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-sm transition space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5 className="text-sm font-bold text-darker-blue">
                                          {sub.teamId?.name || sub.teamName || 'Team Submission'}
                                        </h5>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                                          {badge.label}
                                        </span>
                                        {scoreVal != null && (
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                                            <Star size={10} className="fill-indigo-700 text-indigo-700" />
                                            Score: {scoreVal}/100
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-500">
                                        Leader: {sub.teamId?.leaderId?.fullName || sub.teamId?.leaderId?.username || 'Team Leader'} · Submitted on {formatDate(sub.createdAt)}
                                      </p>
                                    </div>

                                    {/* Judge Button */}
                                    <button
                                      type="button"
                                      onClick={() => openScoringModal(sub, round)}
                                      className="px-4 py-2 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 self-start"
                                    >
                                      <Scale size={13} />
                                      {sub.myScore ? 'Update Evaluation & Marks' : 'Judge & Assign Marks'}
                                    </button>
                                  </div>

                                  {/* Deliverables Links */}
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {sub.liveUrl && (
                                      <a
                                        href={sub.liveUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold flex items-center gap-1.5 border border-blue-100 transition"
                                      >
                                        <Globe size={13} /> Live Application Demo <ExternalLink size={10} />
                                      </a>
                                    )}
                                    {sub.repoUrl && (
                                      <a
                                        href={sub.repoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold flex items-center gap-1.5 border border-slate-200 transition"
                                      >
                                        <Code2 size={13} /> GitHub Repository <ExternalLink size={10} />
                                      </a>
                                    )}
                                    {sub.deckFileUrl && (
                                      <a
                                        href={sub.deckFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold flex items-center gap-1.5 border border-purple-100 transition"
                                      >
                                        <Presentation size={13} /> Pitch Deck / Slides <ExternalLink size={10} />
                                      </a>
                                    )}
                                    {sub.pitchVideoUrl && (
                                      <a
                                        href={sub.pitchVideoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold flex items-center gap-1.5 border border-rose-100 transition"
                                      >
                                        <Video size={13} /> Video Presentation <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>

                                  {sub.description && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 text-xs text-gray-700 font-alef leading-relaxed">
                                      <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                                        Project Description & Highlights
                                      </p>
                                      {sub.description}
                                    </div>
                                  )}

                                  {/* Existing Judge Breakdown if evaluated */}
                                  {sub.myScore?.criteriaScores?.length > 0 && (
                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-3 flex-wrap text-[11px]">
                                      <span className="text-gray-400 font-semibold">Scored Criteria:</span>
                                      {sub.myScore.criteriaScores.map((cs, csi) => (
                                        <span
                                          key={csi}
                                          className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-medium"
                                        >
                                          Score: <strong>{cs.score}/100</strong>
                                        </span>
                                      ))}
                                      {sub.myScore.overallComment && (
                                        <span className="text-gray-500 italic">
                                          "{sub.myScore.overallComment}"
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── TEAMS TAB ─── */}
        {activeTab === 'teams' && (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-darker-blue flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Registered Teams
              </h2>
              <span className="text-xs text-gray-500">{teams.length} team{teams.length !== 1 ? 's' : ''} registered</span>
            </div>
            {teams.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <Users size={32} className="mx-auto opacity-40" />
                <p className="text-sm font-semibold">No teams registered yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {teams.map((team, idx) => (
                  <div key={team._id || idx}>
                    <div
                      className="p-5 hover:bg-slate-50/60 transition cursor-pointer"
                      onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-sm">
                            {(team.name || 'T')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-darker-blue">{team.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {team.members?.length || 0} members · Leader: {team.leaderId?.fullName || team.leaderId?.username || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              team.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : team.paymentStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {team.paymentStatus === 'PAID' ? '✓ Paid' : team.paymentStatus === 'PENDING' ? '⏳ Pending' : 'Free'}
                          </span>
                          {expandedTeam === team._id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </div>
                      </div>
                    </div>

                    {expandedTeam === team._id && (
                      <div className="px-5 pb-5 bg-slate-50/50 border-t border-gray-100">
                        <div className="pt-4 space-y-2">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Team Members</p>
                          {(team.members || []).map((m, mi) => (
                            <div key={m._id || mi} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-100 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-darker-blue text-white flex items-center justify-center font-bold text-[10px]">
                                  {(m.fullName || m.username || 'M')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-darker-blue">{m.fullName || m.username}</p>
                                  <p className="text-[10px] text-gray-400">{m.email}</p>
                                </div>
                              </div>
                              {(team.leaderId?._id?.toString() === m._id?.toString() || team.leaderId?.toString() === m._id?.toString()) && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Leader</span>
                              )}
                            </div>
                          ))}
                          {team.inviteCode && (
                            <p className="text-[10px] text-gray-400 pt-1">
                              Invite Code: <strong className="font-mono text-darker-blue">{team.inviteCode}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── JUDGE EVALUATION & SCORING MODAL ─── */}
      {scoringModalOpen && activeSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => !isSavingScore && setScoringModalOpen(false)}
              disabled={isSavingScore}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Scale size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-darker-blue">Judge & Score Submission</h3>
                <p className="text-xs text-gray-500 font-alef">
                  Team: <strong className="text-darker-blue font-semibold">{activeSub.teamId?.name || activeSub.teamName || 'Team'}</strong>
                  {activeRound && ` · Round ${activeRound.roundNumber || 1}: ${activeRound.roundName || 'Phase'}`}
                </p>
              </div>
            </div>

            {/* Quick Deliverable Links Bar */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-gray-100 flex flex-wrap gap-2 text-xs">
              <span className="text-gray-400 font-semibold self-center mr-1">Deliverables:</span>
              {activeSub.liveUrl && (
                <a
                  href={activeSub.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-blue-100/70 hover:bg-blue-100 text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Globe size={11} /> Demo <ExternalLink size={9} />
                </a>
              )}
              {activeSub.repoUrl && (
                <a
                  href={activeSub.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-800 font-semibold flex items-center gap-1"
                >
                  <Code2 size={11} /> Repo <ExternalLink size={9} />
                </a>
              )}
              {activeSub.deckFileUrl && (
                <a
                  href={activeSub.deckFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-purple-100/70 hover:bg-purple-100 text-purple-800 font-semibold flex items-center gap-1"
                >
                  <Presentation size={11} /> Deck <ExternalLink size={9} />
                </a>
              )}
              {activeSub.pitchVideoUrl && (
                <a
                  href={activeSub.pitchVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-rose-100/70 hover:bg-rose-100 text-rose-800 font-semibold flex items-center gap-1"
                >
                  <Video size={11} /> Video <ExternalLink size={9} />
                </a>
              )}
            </div>

            {/* Criteria Evaluation Sliders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={13} className="text-indigo-600" /> Rubric Criteria Scoring
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Overall Weighted Score:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-600 text-white shadow-2xs">
                    {calculateTotalScore()} / 100
                  </span>
                </div>
              </div>

              {criteriaScores.map((cs, index) => (
                <div
                  key={cs.criteriaId || index}
                  className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-darker-blue">{cs.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                          Weight: {cs.weight}%
                        </span>
                      </div>
                      {cs.description && (
                        <p className="text-[11px] text-gray-500 font-alef mt-0.5">{cs.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cs.score}
                        onChange={e => handleScoreChange(index, e.target.value)}
                        className="w-14 px-2 py-1 text-center font-bold text-xs text-darker-blue bg-slate-50 border border-gray-200 rounded-lg focus:outline-indigo-500"
                      />
                      <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={cs.score}
                      onChange={e => handleScoreChange(index, e.target.value)}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Quick Score Preset Pills */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-gray-400">Quick set:</span>
                    {[50, 70, 85, 95, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleScoreChange(index, val)}
                        className={`px-2 py-0.5 rounded-md border font-semibold cursor-pointer transition ${
                          cs.score === val
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  {/* Optional comment */}
                  <input
                    type="text"
                    placeholder="Optional remark for this criterion..."
                    value={cs.comment || ''}
                    onChange={e => handleScoreCommentChange(index, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-indigo-500 placeholder-gray-400"
                  />
                </div>
              ))}
            </div>

            {/* Overall Feedback */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-darker-blue flex items-center gap-1.5">
                <MessageSquare size={13} className="text-indigo-600" /> Overall Judge Remarks & Feedback
              </label>
              <textarea
                rows={3}
                placeholder="Share actionable feedback, highlights of their implementation, or areas of improvement..."
                value={overallComment}
                onChange={e => setOverallComment(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-gray-200 rounded-2xl focus:outline-indigo-500 placeholder-gray-400 font-alef leading-relaxed resize-none"
              />
            </div>

            {/* Round Clearance & Advancement Toggle */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={advanceTeam}
                  onChange={e => setAdvanceTeam(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <p className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-600" />
                    Clear & Advance Team to Next Round
                  </p>
                  <p className="text-[11px] text-emerald-800 font-alef leading-relaxed">
                    When checked, this team will be marked as having <strong>cleared this round</strong>. Their participant dashboard will celebrate: <em className="font-semibold">"🎉 You have cleared this round!"</em> and immediately unlock eligibility for Round {activeRound?.roundNumber ? activeRound.roundNumber + 1 : 2} submissions.
                  </p>
                </div>
              </label>
            </div>

            {/* Status Messages */}
            {scoringError && (
              <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{scoringError}</span>
              </div>
            )}
            {scoringSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{scoringSuccess}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSavingScore}
                onClick={() => setScoringModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingScore}
                onClick={handleSaveScore}
                className="flex-1 py-2.5 rounded-2xl bg-darker-blue hover:bg-dark-blue text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-darker-blue/20"
              >
                {isSavingScore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting Evaluation...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save Marks & Decision
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-100 space-y-5 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              disabled={isDeleting}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertCircle size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-darker-blue">Delete Hackathon?</h3>
              <p className="text-xs text-gray-600 font-alef leading-relaxed">
                Are you sure you want to delete <strong className="text-rose-700 font-semibold">{hackathon?.eventName || 'this hackathon'}</strong>?
              </p>
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-900 text-left space-y-1.5 font-alef">
                <p className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertCircle size={13} className="shrink-0" /> This action is permanent and cannot be undone:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-rose-700">
                  <li>Immediately removed from home page and explore feed</li>
                  <li>All {metrics.totalTeams} registered team(s) and submissions will be deleted</li>
                  <li>Judges, rounds, and results will be permanently removed</li>
                </ul>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteHackathon}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm shadow-rose-200"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Yes, Delete Hackathon
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHackathon;
