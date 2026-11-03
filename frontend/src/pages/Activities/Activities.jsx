import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  RadioTower,
  Goal,
  UserCheck,
  Plus,
  ExternalLink,
  ChevronRight,
  Settings,
  Calendar,
  Users,
  Trophy,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  FileEdit,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';

const unwrap = (res) => {
  if (!res) return null;
  if (res.data !== undefined) return res.data;
  return res;
};

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d, fallback = 'To be announced') {
  if (!d) return fallback;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return fallback;
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const Activities = ({ initialTab = 'created' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || initialTab;

  const [activeTab, setActiveTab] = useState(tabFromUrl); // 'created' | 'participations' | 'accessed'
  const [createdList, setCreatedList] = useState([]);
  const [participationsList, setParticipationsList] = useState([]);
  const [accessedList, setAccessedList] = useState([]);
  const [overview, setOverview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync state if URL query changes
  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab && qTab !== activeTab) {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  // Load activities data
  useEffect(() => {
    let cancelled = false;

    const fetchAllActivities = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewRes, createdRes, partRes, accRes] = await Promise.allSettled([
          hackathonService.getActivitiesOverview(),
          hackathonService.getCreatedHackathons(),
          hackathonService.getParticipations(),
          hackathonService.getAccessedHackathons(),
        ]);

        if (cancelled) return;

        if (overviewRes.status === 'fulfilled') {
          setOverview(unwrap(overviewRes.value));
        }

        if (createdRes.status === 'fulfilled') {
          const cData = unwrap(createdRes.value);
          setCreatedList(Array.isArray(cData?.hackathons) ? cData.hackathons : Array.isArray(cData) ? cData : []);
        }

        if (partRes.status === 'fulfilled') {
          const pData = unwrap(partRes.value);
          setParticipationsList(
            Array.isArray(pData?.myParticipations)
              ? pData.myParticipations
              : Array.isArray(pData?.participations)
              ? pData.participations
              : Array.isArray(pData)
              ? pData
              : []
          );
        }

        if (accRes.status === 'fulfilled') {
          const aData = unwrap(accRes.value);
          setAccessedList(
            Array.isArray(aData?.accessedHackathons)
              ? aData.accessedHackathons
              : Array.isArray(aData)
              ? aData
              : []
          );
        }
      } catch (err) {
        console.error('Failed to load activities:', err);
        setError('Failed to load activities. Please check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAllActivities();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const getStatusBadge = (h) => {
    const status = h.lifecycleStatus || h.status;
    if (status === 'DRAFT') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          📝 Draft ({h.progressPercent || 0}%)
        </span>
      );
    }
    if (status === 'ONGOING') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Ongoing
        </span>
      );
    }
    if (status === 'COMPLETED') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          🏁 Finished
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
        🗓️ Upcoming
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-space">
      {/* Top Banner / Navigation Header */}
      <div className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-darker-blue" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-space">
                  Dashboard & Activities
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-darker-blue tracking-tight mt-1">
                My Hackathon Activities
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-alef mt-0.5">
                Manage your created hackathons, track participations, and view judging access.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/create-hackathon')}
                className="px-4 py-2.5 rounded-2xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={15} />
                Create New Hackathon
              </button>
            </div>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-b border-gray-100 scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabChange('created')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'created'
                  ? 'bg-darker-blue text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <RadioTower size={14} />
              Created Hackathons
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'created' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {overview?.counts?.createdHackathons ?? createdList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('participations')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'participations'
                  ? 'bg-darker-blue text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Goal size={14} />
              My Participations
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'participations' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {overview?.counts?.participations ?? participationsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('accessed')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'accessed'
                  ? 'bg-darker-blue text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserCheck size={14} />
              Judging & Accessed
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'accessed' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {overview?.counts?.accessedHackathons ?? accessedList.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {location.state?.message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{location.state.message}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-darker-blue" />
            <p className="text-xs font-semibold">Loading your activities...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* ─── TAB 1: CREATED HACKATHONS ─── */}
            {activeTab === 'created' && (
              <div>
                {createdList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-xl mx-auto shadow-xs my-8 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
                      <RadioTower size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-darker-blue">
                        No Hackathons Created Yet
                      </h3>
                      <p className="text-xs text-gray-500 font-alef mt-1 max-w-sm mx-auto">
                        You haven&apos;t hosted or drafted any hackathons yet. Build one from scratch in minutes!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/create-hackathon')}
                      className="px-5 py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold transition shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus size={14} /> Create Your First Hackathon
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdList.map((hackathon) => {
                      const isDraft = (hackathon.lifecycleStatus || hackathon.status) === 'DRAFT';
                      const hId = hackathon._id?.toString() || hackathon.slug;

                      return (
                        <div
                          key={hId}
                          className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden group"
                        >
                          {/* Banner & Badges */}
                          <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                            {hackathon.banner ? (
                              <img
                                src={hackathon.banner}
                                alt={hackathon.eventName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-indigo-900 via-slate-800 to-darker-blue flex items-center justify-center">
                                <span className="text-3xl">🦅</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
                              {getStatusBadge(hackathon)}
                              <span className="bg-white/85 backdrop-blur-md text-gray-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                                {hackathon.mode || 'Hybrid'}
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-4 right-4 z-10">
                              <p className="text-[10px] text-lime-300 font-bold uppercase tracking-wider truncate">
                                {hackathon.organizingBody || 'Your Organization'}
                              </p>
                              <h3 className="text-base font-extrabold text-white truncate drop-shadow-sm">
                                {hackathon.eventName || 'Untitled Hackathon'}
                              </h3>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <p className="text-xs text-gray-600 font-alef line-clamp-2 leading-relaxed">
                                {hackathon.theme || hackathon.shortDescription || 'No subtitle provided yet.'}
                              </p>

                              {/* Progress bar for Draft */}
                              {isDraft && (
                                <div className="mt-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1.5">
                                    <span>Draft Setup Progress</span>
                                    <span>{hackathon.progressPercent || 0}%</span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-amber-200/80 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                      style={{ width: `${hackathon.progressPercent || 15}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Metrics strip */}
                              <div className="grid grid-cols-3 gap-2 mt-4 text-center divide-x divide-gray-100 bg-slate-50 p-2.5 rounded-2xl border border-gray-100">
                                <div>
                                  <span className="text-[9.5px] uppercase font-bold text-gray-400">Teams</span>
                                  <p className="text-sm font-extrabold text-darker-blue mt-0.5">
                                    {hackathon.registeredTeamsCount ?? 0}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[9.5px] uppercase font-bold text-gray-400">Rounds</span>
                                  <p className="text-sm font-extrabold text-darker-blue mt-0.5">
                                    {hackathon.roundsCount ?? 1}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[9.5px] uppercase font-bold text-gray-400">Judges</span>
                                  <p className="text-sm font-extrabold text-darker-blue mt-0.5">
                                    {hackathon.acceptedJudgesCount ?? hackathon.totalJudgesCount ?? 0}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center gap-2">
                              {isDraft ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/create-hackathon?id=${hId}`)}
                                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <FileEdit size={13} /> Continue Editing
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/hackathons/${hId}`)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    View Page <ExternalLink size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => navigate(`/hackathon/${hId}/manage`)}
                                    className="flex-1 py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Settings size={13} /> Manage
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: MY PARTICIPATIONS ─── */}
            {activeTab === 'participations' && (
              <div>
                {participationsList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-xl mx-auto shadow-xs my-8 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                      <Goal size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-darker-blue">
                        No Participations Yet
                      </h3>
                      <p className="text-xs text-gray-500 font-alef mt-1 max-w-sm mx-auto">
                        Explore upcoming challenges on the home feed and register your team to start hacking!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/home')}
                      className="px-5 py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold transition shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      Browse Hackathons <ArrowRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {participationsList.map((part) => {
                      const h = part.hackathon || {};
                      const hId = h._id?.toString() || h.slug;

                      return (
                        <div
                          key={part.teamId || hId}
                          className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden"
                        >
                          <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                            {h.banner ? (
                              <img src={h.banner} alt={h.eventName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-emerald-900 to-darker-blue flex items-center justify-center text-3xl">
                                🚀
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                              {getStatusBadge(h)}
                            </div>

                            <div className="absolute bottom-3 left-4 right-4 z-10">
                              <h3 className="text-base font-extrabold text-white truncate">
                                {h.eventName || 'Hackathon Event'}
                              </h3>
                              <p className="text-[11px] text-lime-300 font-semibold truncate">
                                Team: <strong>{part.teamName}</strong> {part.isLeader && '👑 (Leader)'}
                              </p>
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2 text-xs text-gray-600 font-alef">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Team Code:</span>
                                <span className="font-mono font-bold text-darker-blue bg-slate-100 px-2 py-0.5 rounded-md">
                                  {part.inviteCode || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Members:</span>
                                <span className="font-bold text-darker-blue">
                                  {part.memberCount || part.members?.length || 1}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Submissions:</span>
                                <span className="font-bold text-emerald-600">
                                  {part.submissionsCount ?? 0} submitted
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/hackathon/${hId}/participate`)}
                              className="w-full py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              Go to Participant Hub <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 3: JUDGING & ACCESSED ─── */}
            {activeTab === 'accessed' && (
              <div>
                {accessedList.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-xl mx-auto shadow-xs my-8 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-xs">
                      <UserCheck size={32} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-darker-blue">
                        No Judging Invitations Yet
                      </h3>
                      <p className="text-xs text-gray-500 font-alef mt-1 max-w-sm mx-auto">
                        When hackathon organizers invite you to judge rounds, their hackathons will appear right here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accessedList.map((item) => {
                      const h = item.hackathon || item;
                      const hId = h._id?.toString() || h.slug;

                      return (
                        <div
                          key={item.judgeId || hId}
                          className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden"
                        >
                          <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                            {h.banner ? (
                              <img src={h.banner} alt={h.eventName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-purple-900 to-darker-blue flex items-center justify-center text-3xl">
                                ⚖️
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                ⚖️ Judge Access
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-4 right-4 z-10">
                              <h3 className="text-base font-extrabold text-white truncate">
                                {h.eventName || 'Hackathon Event'}
                              </h3>
                              <p className="text-[11px] text-lime-300 font-semibold truncate">
                                Access: {item.accessType || 'All Rounds'}
                              </p>
                            </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <p className="text-xs text-gray-600 font-alef line-clamp-2">
                              {h.theme || 'Evaluate assigned submissions and score projects.'}
                            </p>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/hackathons/${hId}/manage`)}
                                className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                ⚖️ Judge Dashboard <ChevronRight size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/hackathons/${hId}`)}
                                className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold transition flex items-center justify-center cursor-pointer"
                                title="View Public Page"
                              >
                                <ExternalLink size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Activities;
