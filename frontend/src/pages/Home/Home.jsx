import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  TrendingUp,
  Activity,
  Pencil,
  Landmark,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Bell,
  Check,
  Radio,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d, fallback = "2nd Aug '26") {
  if (!d) return fallback;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return fallback;
  const day = dt.getDate();
  const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                 (day % 10 === 2 && day !== 12) ? 'nd' :
                 (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
  const month = dt.toLocaleDateString('en-US', { month: 'short' });
  const year = dt.getFullYear().toString().slice(-2);
  return `${day}${suffix} ${month} '${year}`;
}

function formatDeadline(d, fallback = "2nd September 2026") {
  if (!d) return fallback;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return fallback;
  const day = dt.getDate();
  const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                 (day % 10 === 2 && day !== 12) ? 'nd' :
                 (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
  const month = dt.toLocaleDateString('en-US', { month: 'long' });
  const year = dt.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

const unwrap = (res) => {
  if (!res) return null;
  if (res.data && typeof res.data === 'object' && !res.hackathons) {
    return res.data;
  }
  return res;
};

// ─── Circular Avatar Pill (matching blue/green badges in design) ────────────

function EmblemBadge({ index = 0 }) {
  const bgColors = [
    'from-teal-600 to-emerald-700',
    'from-blue-600 to-cyan-700',
    'from-emerald-600 to-teal-800',
    'from-cyan-600 to-blue-700',
    'from-indigo-600 to-blue-800',
  ];
  const bg = bgColors[index % bgColors.length];

  return (
    <div
      className={`w-7 h-7 rounded-full bg-gradient-to-tr ${bg} border-2 border-white shadow-xs flex items-center justify-center shrink-0`}
    >
      <div className="w-4 h-4 rounded-full border border-white/60 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
      </div>
    </div>
  );
}

function AvatarRow({ count = 4 }) {
  const n = Math.min(Math.max(count, 3), 5);
  return (
    <div className="flex -space-x-1.5 items-center">
      {Array.from({ length: n }).map((_, i) => (
        <EmblemBadge key={i} index={i} />
      ))}
    </div>
  );
}

// ─── Mini Calendar ("Your Important Dates") ──────────────────────────────────

function MiniCalendar({ importantDates = [] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(7); // August (0-indexed: 7)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const markedDays = new Set([2, 28, 29, 30]);
  if (importantDates && importantDates.length > 0) {
    importantDates.forEach((d) => {
      const dt = new Date(d.date);
      if (dt.getFullYear() === viewYear && dt.getMonth() === viewMonth) {
        markedDays.add(dt.getDate());
      }
    });
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-[#dbeafe] rounded-2xl p-2.5 border border-indigo-200/60 shadow-xs flex flex-col justify-between w-[165px] shrink-0">
      <p className="text-[11px] font-bold text-[#1e293b] font-space text-center leading-tight">
        Your Important Dates
      </p>

      <div className="flex items-center justify-between px-1 my-1">
        <button
          type="button"
          onClick={prevMonth}
          className="text-gray-500 hover:text-darker-blue transition-colors cursor-pointer"
        >
          <ChevronLeft size={12} />
        </button>
        <span className="text-[10px] font-semibold text-gray-700 font-space">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="text-gray-500 hover:text-darker-blue transition-colors cursor-pointer"
        >
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <span key={d} className="text-[8px] font-bold text-gray-500">
            {d}
          </span>
        ))}
        {cells.map((day, idx) => {
          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear();
          const isMarked = day && markedDays.has(day);

          return (
            <span
              key={idx}
              className={`text-[8.5px] w-4.5 h-4 flex items-center justify-center mx-auto rounded-full font-space
                ${isMarked
                  ? 'bg-red-400 text-white font-bold'
                  : isToday
                  ? 'bg-darker-blue text-white font-bold'
                  : 'text-gray-700'
                }
              `}
            >
              {day || ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Header Announcement Banner ──────────────────────────────────────────────

function AnnouncementBanner({ announcement }) {
  const title = announcement?.hackathonName || 'Sekai Unnovation Megathon 2026';
  const message = announcement?.message || 'Submitted ppts must be under 10mb...';
  const fullText = `${title}: ${message}`;

  return (
    <div className="flex items-center bg-[#fef08a] border border-[#fde047] rounded-full px-3.5 py-1 max-w-xl shadow-xs overflow-hidden">
      <span className="text-[11px] font-bold font-space text-amber-950 shrink-0 mr-1.5 whitespace-nowrap">
        Recent Announcement:
      </span>
      <span className="text-[11px] text-amber-900 font-space truncate">
        {fullText}
      </span>
    </div>
  );
}

// ─── Top Row Cards ───────────────────────────────────────────────────────────

function StatsCard({ hackathonsThisWeek = 2, participantsToday = 185 }) {
  return (
    <div className="flex flex-col gap-2 w-[140px] shrink-0">
      {/* Top Half: Hackathons this week */}
      <div className="bg-[#fef08a] rounded-2xl p-2.5 relative overflow-hidden shadow-xs border border-amber-200/60 flex flex-col justify-between h-[62px]">
        {/* Subtle decorative concentric circle watermark */}
        <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full border-4 border-amber-300/40 pointer-events-none" />
        <div className="absolute -right-2 -bottom-2 w-10 h-10 rounded-full border-4 border-amber-300/30 pointer-events-none" />

        <div className="flex items-center gap-1 text-[9.5px] font-medium text-amber-900 font-space">
          <Bell size={10} className="text-amber-800" />
          Hackathons this week
        </div>
        <p className="text-2xl font-extrabold text-amber-950 font-space leading-none">
          {hackathonsThisWeek ?? 2}
        </p>
      </div>

      {/* Bottom Half: Participations today */}
      <div className="bg-[#fca5a5] rounded-2xl p-2.5 relative overflow-hidden shadow-xs border border-rose-200/60 flex flex-col justify-between h-[62px]">
        <div className="flex items-center gap-1 text-[9.5px] font-medium text-white/90 font-space">
          <Check size={10} className="text-white" />
          Participations today
        </div>
        <p className="text-2xl font-extrabold text-white font-space leading-none">
          {participantsToday ?? 185}
        </p>
      </div>
    </div>
  );
}

function TopHackathonCard({ data, navigate }) {
  const eventName = data?.eventName || 'Sekai Unnovation Megathon 2026';
  const theme = data?.theme || 'Create, Thrive and Win 1 Lac Worth of Prizes';
  const count = data?.registrationsCount || 56;

  return (
    <div
      onClick={() => navigate && navigate(`/hackathon/${data?._id || data?.slug || 'sample-1'}`)}
      className="bg-[#dcfce7] rounded-2xl p-2.5 border border-green-200/70 shadow-xs relative overflow-hidden flex-1 min-w-[170px] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Line graph watermark */}
      <svg
        className="absolute top-1 right-2 w-24 h-12 text-green-300/60 pointer-events-none"
        viewBox="0 0 100 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M0 35 L20 28 L40 32 L60 15 L80 18 L100 5" />
        <circle cx="20" cy="28" r="2" fill="currentColor" />
        <circle cx="40" cy="32" r="2" fill="currentColor" />
        <circle cx="60" cy="15" r="2" fill="currentColor" />
        <circle cx="80" cy="18" r="2" fill="currentColor" />
        <circle cx="100" cy="5" r="3" fill="currentColor" />
      </svg>

      <div className="flex items-center gap-1 text-[11px] font-bold text-[#3f6212] font-space z-10">
        <TrendingUp size={12} className="text-[#3f6212]" />
        Top Hackathon Today
      </div>

      {/* Inner white container */}
      <div className="bg-white rounded-xl p-2 shadow-xs border border-green-100 flex items-center gap-2 mt-1 z-10">
        {/* Phoenix / emblem logo */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-xs text-white text-xs font-bold">
          🦅
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-darker-blue font-space truncate leading-tight">
            {eventName}
          </p>
          <p className="text-[8.5px] text-[#466211] font-space truncate leading-tight">
            {theme}
          </p>
          <p className="text-[8.5px] text-gray-500 font-space font-medium">
            Registrations: {count}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1 z-10">
        <AvatarRow count={3} />
      </div>
    </div>
  );
}

function OngoingActivityCard({ data, navigate }) {
  const hackathonName = data?.hackathonName || 'Sekai Unnovation Megathon 2026';
  const roundName = data?.roundName || 'Round 2: Submit Repos';
  const deadline = formatDeadline(data?.deadline, '2nd September 2026');

  return (
    <div
      onClick={() => navigate && navigate(`/hackathon/${data?.hackathonId || data?._id || 'sample-1'}`)}
      className="bg-[#e0f2fe] rounded-2xl p-2.5 border border-sky-200/70 shadow-xs relative overflow-hidden flex-1 min-w-[170px] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Scallop arch pattern watermark */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-25 pointer-events-none">
        <div className="w-5 h-8 rounded-t-full border-2 border-sky-400" />
        <div className="w-5 h-8 rounded-t-full border-2 border-sky-400" />
        <div className="w-5 h-8 rounded-t-full border-2 border-sky-400" />
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold text-[#0369a1] font-space z-10">
        <Activity size={12} className="text-[#0369a1]" />
        Ongoing Activity
      </div>

      {/* Inner white container */}
      <div className="bg-white rounded-xl p-2 shadow-xs border border-sky-100 flex items-center gap-2 mt-1 z-10">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-xs text-white text-xs font-bold">
          🦅
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-darker-blue font-space truncate leading-tight">
            {hackathonName}
          </p>
          <p className="text-[8.5px] text-[#0284c7] font-space font-semibold truncate leading-tight">
            {roundName}
          </p>
          <p className="text-[8.5px] text-[#6366f1] font-space truncate">
            Deadline: {deadline}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1 z-10">
        <AvatarRow count={3} />
      </div>
    </div>
  );
}

function ContinueCard({ data, navigate }) {
  const eventName = data?.eventName || 'Sekai Unnovation Megathon 2026';

  const handleClick = () => {
    if (data?.draftId) {
      navigate(`/create-hackathon`);
    } else {
      navigate('/create-hackathon');
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-[#ede9fe] rounded-2xl p-2.5 border border-purple-200/70 shadow-xs relative overflow-hidden flex-1 min-w-[170px] flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Arch watermark */}
      <div className="absolute top-1 right-2 w-16 h-16 rounded-full border-4 border-purple-300/30 pointer-events-none" />

      <div className="flex items-center gap-1 text-[11px] font-bold text-[#7e22ce] font-space z-10">
        <Pencil size={11} className="text-[#7e22ce]" />
        Continue where you left
      </div>

      {/* Inner white container */}
      <div className="bg-white rounded-xl p-2.5 shadow-xs border border-purple-100 flex items-center gap-2 mt-1 z-10">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-xs text-white text-xs font-bold">
          🦅
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-darker-blue font-space truncate leading-tight">
            {eventName}
          </p>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}

// ─── Hackathon Card (Feed) ───────────────────────────────────────────────────

function HackathonCard({ hackathon, onRegister, registering, onCardClick }) {
  const {
    _id,
    slug,
    eventName = 'Sekai Unnovation Megathon 2026',
    theme = 'Create, Thrive and Win 1 Lac Worth of Prizes',
    mode = 'HYBRID',
    banner,
    organizingBody = 'Sekai Multinational Coorporation Limited',
    registeredTeamsCount = 78,
    teamMinSize = 2,
    teamMaxSize = 4,
    address = 'Sekai University of Sciences, Navi Mumbai, 562011',
    registrationOpens,
    registrationCloses,
    isUserRegistered,
    status = 'Upcoming',
  } = hackathon;

  const id = _id?.toString() || slug || 'card-id';

  // Fallback banner placeholder matching Japanese building or 3D purple aesthetic
  const defaultBanner =
    mode === 'ONLINE'
      ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80';

  const displayBanner = banner || defaultBanner;

  return (
    <div
      onClick={() => onCardClick && onCardClick(id)}
      className="rounded-3xl overflow-hidden bg-white border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col cursor-pointer group"
    >
      {/* Banner image with top-right pill badges */}
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        <img
          src={displayBanner}
          alt={eventName}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />

        {/* Soft bottom gradient fade into content */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />

        {/* Floating pill badges on top-right */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
          <span className="bg-white/85 backdrop-blur-md text-gray-700 text-[11px] font-medium font-space px-3 py-0.5 rounded-full shadow-xs">
            {status === 'DRAFT' ? 'Upcoming' : status === 'ONGOING' ? 'Ongoing' : 'Upcoming'}
          </span>
          <span className="bg-white/85 backdrop-blur-md text-gray-700 text-[11px] font-medium font-space px-3 py-0.5 rounded-full shadow-xs">
            {mode ? mode.charAt(0) + mode.slice(1).toLowerCase() : 'Hybrid'}
          </span>
          <span className="bg-white/85 backdrop-blur-md text-gray-700 p-1.5 rounded-full shadow-xs flex items-center justify-center">
            <Users size={11} />
          </span>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="px-5 pb-5 pt-1 flex flex-col gap-2 flex-1">
        {/* Title & Theme */}
        <div>
          <h3 className="font-bold text-darker-blue font-space text-lg leading-tight line-clamp-1">
            {eventName}
          </h3>
          <p className="text-[#466211] text-xs font-semibold font-space tracking-tight line-clamp-1 mt-0.5">
            {theme}
          </p>
        </div>

        {/* Organizing Body */}
        <div className="flex items-center gap-1.5 text-darker-blue font-bold font-space text-[13px] mt-0.5">
          <Landmark size={14} className="text-darker-blue shrink-0" />
          <span className="line-clamp-1">{organizingBody}</span>
        </div>

        {/* Registrations, Team Members, and Address */}
        <div className="flex items-start justify-between text-xs text-gray-600 font-space pt-0.5">
          <div className="flex items-center gap-1 text-gray-600">
            <Users size={12} className="text-gray-500" />
            <span>Registrations: {registeredTeamsCount}</span>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="text-[11px] text-gray-500 font-medium">
              👥 {teamMinSize}-{teamMaxSize} Members
            </span>
            {address && (
              <span className="text-[10.5px] text-gray-500 flex items-center gap-1 mt-0.5 max-w-[240px] truncate">
                <MapPin size={10} className="shrink-0 text-gray-400" />
                {address}
              </span>
            )}
          </div>
        </div>

        {/* Footer: Avatar Pills + Dates + Register Button */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-auto">
          {/* Circular avatar emblems */}
          <AvatarRow count={4} />

          {/* Dates & Register button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-700 font-space">
              <span>{formatDate(registrationOpens, "2nd Aug '26")}</span>
              <span>{formatDate(registrationCloses, "2nd Aug '26")}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRegister(id);
              }}
              disabled={isUserRegistered || registering}
              className={`flex items-center gap-1 text-xs font-semibold font-space px-5 py-2 rounded-full shadow-sm transition-all cursor-pointer
                ${isUserRegistered
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : 'bg-darker-blue text-white hover:bg-dark-blue active:scale-95 disabled:opacity-60'
                }`}
            >
              {isUserRegistered ? (
                <>
                  <CheckCircle2 size={13} /> Registered
                </>
              ) : registering ? (
                'Registering…'
              ) : (
                <>
                  Register <ArrowUpRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Default Sample Cards if DB has fewer than 2 cards ───────────────────────

const SAMPLE_HACKATHONS = [
  {
    _id: 'sample-1',
    slug: 'sekai-unnovation-megathon-2026-1',
    eventName: 'Sekai Unnovation Megathon 2026',
    theme: 'Create, Thrive and Win 1 Lac Worth of Prizes',
    mode: 'HYBRID',
    banner: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
    organizingBody: 'Sekai Multinational Coorporation Limited',
    registeredTeamsCount: 78,
    teamMinSize: 2,
    teamMaxSize: 4,
    address: 'Sekai University of Sciences, Navi Mumbai, 562011',
    status: 'Upcoming',
  },
  {
    _id: 'sample-2',
    slug: 'sekai-unnovation-megathon-2026-2',
    eventName: 'Sekai Unnovation Megathon 2026',
    theme: 'Create, Thrive and Win 1 Lac Worth of Prizes',
    mode: 'HYBRID',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    organizingBody: 'Sekai Multinational Coorporation Limited',
    registeredTeamsCount: 78,
    teamMinSize: 2,
    teamMaxSize: 4,
    address: 'Sekai University of Sciences, Navi Mumbai, 562011',
    status: 'Upcoming',
  },
];

// ─── Main Home Component ─────────────────────────────────────────────────────

const MODES = ['ALL', 'ONLINE', 'OFFLINE', 'HYBRID'];

const Home = () => {
  const navigate = useNavigate();
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [registeringIds, setRegisteringIds] = useState(new Set());

  const fetchData = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = {};
      if (opts.mode && opts.mode !== 'ALL') params.mode = opts.mode;
      if (opts.page && opts.page > 1) params.page = opts.page;

      const response = await hackathonService.getHomeData(params);
      const data = unwrap(response);
      setHomeData(data);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData({ mode: modeFilter, page });
  }, [modeFilter, page, fetchData]);

  const handleModeChange = (m) => {
    setModeFilter(m);
    setPage(1);
  };

  const handleRegister = async (id) => {
    if (registeringIds.has(id)) return;
    setRegisteringIds((prev) => new Set([...prev, id]));
    try {
      await hackathonService.registerHackathon(id);
      setHomeData((prev) => {
        if (!prev) return prev;
        const updatedHackathons = (prev.hackathons || []).map((h) =>
          h._id?.toString() === id || h.slug === id
            ? { ...h, isUserRegistered: true }
            : h
        );
        return { ...prev, hackathons: updatedHackathons };
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      alert(msg);
    } finally {
      setRegisteringIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const {
    recentAnnouncement,
    metrics,
    topHackathonToday,
    ongoingActivity,
    continueWhereYouLeft,
    importantDates = [],
    hackathons = [],
    pagination,
  } = homeData || {};

  // Display user's hackathons first, and supplement with sample hackathons if needed to maintain full layout
  const displayHackathons =
    hackathons && hackathons.length > 0
      ? hackathons.length === 1
        ? [hackathons[0], SAMPLE_HACKATHONS[1]]
        : hackathons
      : SAMPLE_HACKATHONS;

  return (
    <div className="pt-14 pl-16 pr-6 pb-12 min-h-screen">
      <div className="max-w-[1240px] mx-auto">
        {/* Row 1: Heading on the left + Recent Announcement Banner on the right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h1 className="font-space text-3xl font-extrabold text-[#1e2337] tracking-tight">
            Let&apos;s Compete and Create!
          </h1>
          <AnnouncementBanner announcement={recentAnnouncement} />
        </div>

        {/* Row 2: 5 Cards (Stats, Top Hackathon, Ongoing, Continue, Calendar) */}
        <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
          <StatsCard
            hackathonsThisWeek={metrics?.hackathonsThisWeek ?? 2}
            participantsToday={metrics?.participantsToday ?? 185}
          />
          <TopHackathonCard data={topHackathonToday} navigate={navigate} />
          <OngoingActivityCard data={ongoingActivity} navigate={navigate} />
          <ContinueCard data={continueWhereYouLeft} navigate={navigate} />
          <MiniCalendar importantDates={importantDates} />
        </div>

        {/* Row 3: Filters Bar (Smooth beige/cream full-width bar) */}
        <div className="bg-[#f2f4ec] rounded-2xl px-4 py-2 flex items-center justify-between mb-6 shadow-xs border border-gray-200/50">
          <div className="flex items-center gap-2 text-xs font-bold text-darker-blue font-space">
            <SlidersHorizontal size={14} className="text-darker-blue" />
            Filters
          </div>

          <div className="flex items-center gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={`text-xs px-3.5 py-1 rounded-full font-space font-semibold transition-all cursor-pointer
                  ${modeFilter === m
                    ? 'bg-darker-blue text-white shadow-xs'
                    : 'bg-white/80 text-gray-700 hover:bg-white hover:text-darker-blue'
                  }`}
              >
                {m === 'ALL' ? 'All' : m.charAt(0) + m.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Hackathon Cards Grid (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayHackathons.map((h) => (
            <HackathonCard
              key={h._id?.toString() || h.slug}
              hackathon={h}
              onRegister={handleRegister}
              registering={registeringIds.has(h._id?.toString() || h.slug)}
              onCardClick={(cardId) => navigate(`/hackathon/${cardId}`)}
            />
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 text-xs font-space font-semibold px-4 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-darker-blue hover:text-darker-blue disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="text-xs font-space text-gray-500">
              {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 text-xs font-space font-semibold px-4 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-darker-blue hover:text-darker-blue disabled:opacity-40 transition-all cursor-pointer"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
