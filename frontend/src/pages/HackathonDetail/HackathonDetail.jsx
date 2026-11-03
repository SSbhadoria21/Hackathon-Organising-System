import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Award,
  Shield,
  FileText,
  ExternalLink,
  CheckCircle2,
  Share2,
  Copy,
  Landmark,
  Sparkles,
  Layers,
  HelpCircle,
  AlertCircle,
  Building2,
  Code,
  GraduationCap,
  Globe,
  Check,
  ChevronRight,
  Radio,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';
import { RegistrationModal } from '../../components/componentsIndex.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatDateTime(d, fallback = 'To be announced') {
  if (!d) return fallback;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return fallback;
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const unwrap = (res) => {
  if (!res) return null;
  if (res.data && typeof res.data === 'object') {
    return res.data;
  }
  return res;
};

// ─── Fallback Mock Data for preview / samples ────────────────────────────────

const MOCK_HACKATHON = {
  _id: 'mock-1',
  eventName: 'Sekai Unnovation Megathon 2026',
  slug: 'sekai-unnovation-megathon-2026',
  theme: 'Create, Thrive and Win 1 Lac Worth of Prizes',
  mode: 'HYBRID',
  banner: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1600&q=80',
  logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
  organizingBody: 'Sekai Multinational Corporation Limited',
  description:
    'Join innovators, engineers, and designers across the country for the flagship Sekai Unnovation Megathon 2026. Build cutting-edge solutions across AI, Web3, Climate Tech, and Fintech. Experience high-octane 48 hours of collaborative hacking, mentorship from industry veterans, and compete for a total prize pool of over ₹1,00,000!',
  shortDescription: 'The biggest hybrid innovation hackathon of 2026 for visionary builders.',
  address: 'Sekai University of Sciences, Campus 3, Navi Mumbai, 562011',
  mapLink: 'https://maps.google.com',
  registeredTeamsCount: 78,
  expectedTeamsCount: 150,
  teamMinSize: 2,
  teamMaxSize: 4,
  eligibility: 'ACROSS_UNIVERSITIES',
  allowedColleges: ['All recognized universities and engineering institutions'],
  plagiarismPolicyEnabled: true,
  cocDocumentUrl: '#',
  techStackRestrictions: ['React / Next.js', 'Python / Node.js', 'OpenAI / Gemini APIs', 'PostgreSQL / MongoDB', 'Docker'],
  problemStatementPdfUrl: '#',
  totalPrizes: 100000,
  paid: false,
  feeAmount: 0,
  timeZone: 'Asia/Kolkata',
  status: 'PUBLISHED',
  registrationOpens: new Date('2026-08-01T00:00:00Z'),
  registrationCloses: new Date('2026-08-25T23:59:59Z'),
  hackingStartsAt: new Date('2026-09-01T09:00:00Z'),
  hackingEndsAt: new Date('2026-09-03T18:00:00Z'),
  resultAnnouncementDate: new Date('2026-09-05T15:00:00Z'),
  tracks: [
    {
      title: 'Artificial Intelligence & Agentic Workflows',
      description: 'Build autonomous agents, multi-modal applications, and generative AI systems that solve real-world industry bottlenecks.',
    },
    {
      title: 'Decentralized Applications & Web3',
      description: 'Innovate in verifiable computing, decentralized identity, smart contracts, and high-throughput blockchain ecosystems.',
    },
    {
      title: 'Sustainable Cities & Climate Tech',
      description: 'Engineer smart energy optimization, carbon tracking, waste reduction algorithms, and sustainable urban solutions.',
    },
    {
      title: 'Open Innovation',
      description: 'Break boundaries with any bold, high-impact idea combining modern tech stacks to transform daily life.',
    },
  ],
  roundIds: [
    {
      _id: 'r1',
      roundNumber: 1,
      roundName: 'Online Idea Screening & PPT Submission',
      roundType: 'SUBMISSION',
      roundOpens: new Date('2026-08-01T00:00:00Z'),
      roundCloses: new Date('2026-08-25T23:59:59Z'),
      maxTeamsAdvancing: 40,
      aiWeightage: 0.4,
      criterias: [
        { name: 'Innovation & Novelty', weight: 30, description: 'Uniqueness of the proposed technical approach' },
        { name: 'Technical Feasibility', weight: 40, description: 'Viability of implementation within 48 hours' },
        { name: 'Impact & Relevance', weight: 30, description: 'Real-world problem severity and market demand' },
      ],
    },
    {
      _id: 'r2',
      roundNumber: 2,
      roundName: '48-Hour Prototype Hacking Sprint',
      roundType: 'PROTOTYPE',
      roundOpens: new Date('2026-09-01T09:00:00Z'),
      roundCloses: new Date('2026-09-03T09:00:00Z'),
      maxTeamsAdvancing: 10,
      aiWeightage: 0.2,
      criterias: [
        { name: 'Completeness of MVP', weight: 40, description: 'Working prototype demonstrating core user flows' },
        { name: 'Code Quality & Architecture', weight: 30, description: 'Clean git commits, modular structure, security' },
        { name: 'UX & Design Elegance', weight: 30, description: 'Fluid design, accessibility, and intuitive interface' },
      ],
    },
    {
      _id: 'r3',
      roundNumber: 3,
      roundName: 'Grand Jury Demo & Pitch Day',
      roundType: 'PITCH',
      roundOpens: new Date('2026-09-03T11:00:00Z'),
      roundCloses: new Date('2026-09-03T18:00:00Z'),
      maxTeamsAdvancing: 3,
      aiWeightage: 0.0,
      criterias: [
        { name: 'Live Demonstration', weight: 50, description: 'Successful execution of key end-to-end features live' },
        { name: 'Q&A and Defense', weight: 30, description: 'Depth of technical answers to jury probing' },
        { name: 'Presentation Clarity', weight: 20, description: 'Storytelling, vision, and commercial viability' },
      ],
    },
  ],
  prizes: [
    {
      title: '🥇 Grand Champion (1st Place)',
      amount: 50000,
      type: 'CASH',
      description: 'Direct cash grant, winner trophy, cloud credits, and accelerator interview fast-track.',
    },
    {
      title: '🥈 First Runner-Up (2nd Place)',
      amount: 30000,
      type: 'CASH',
      description: 'Cash prize, runner-up plaque, cloud vouchers, and sponsor swag kit.',
    },
    {
      title: '🥉 Second Runner-Up (3rd Place)',
      amount: 15000,
      type: 'CASH',
      description: 'Cash prize, framed certificate of merit, and mentor office hours.',
    },
    {
      title: '💡 Best AI Track Innovation',
      amount: 5000,
      type: 'VOUCHER',
      description: 'Special jury category prize for the most outstanding generative AI agent architecture.',
    },
  ],
  sponsors: [
    { name: 'Sekai Labs', logoUrl: '', websiteUrl: 'https://sekai.example.com' },
    { name: 'CloudScale Infrastructure', logoUrl: '', websiteUrl: 'https://cloudscale.example.com' },
    { name: 'DevMatrix Developer Network', logoUrl: '', websiteUrl: 'https://devmatrix.example.com' },
  ],
  judges: [
    {
      name: 'Dr. Aris Thorne',
      email: 'thorne@sekai.edu',
      designation: 'Head of AI Research, Sekai Labs',
      bio: 'Former principal scientist with 15+ years experience in distributed autonomous agents and LLM orchestration.',
    },
    {
      name: 'Priya Sundaram',
      email: 'priya@techvc.com',
      designation: 'Partner & Chief Architect, TechVenture Capital',
      bio: 'Active angel investor and mentor to 40+ early-stage developer-first startups.',
    },
  ],
  organizer: {
    fullName: 'Sekai Hackathon Organizing Council',
    username: 'sekai_council',
    avatar: '',
    bio: 'Dedicated student & faculty body organizing national-tier hackathons and developer summits.',
  },
};

// ─── Main Component ──────────────────────────────────────────────────────────

const HackathonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (!id || id.startsWith('sample-') || id === 'mock-1') {
          setHackathon(MOCK_HACKATHON);
          setLoading(false);
          return;
        }

        const res = await hackathonService.getHackathonById(id);
        const data = unwrap(res);
        if (!cancelled) {
          if (data && data._id) {
            setHackathon(data);
          } else {
            setHackathon(MOCK_HACKATHON);
          }
        }
      } catch (err) {
        console.warn('Could not fetch hackathon details, using sample view:', err);
        if (!cancelled) {
          setHackathon(MOCK_HACKATHON);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRegisterClick = () => {
    const isReg = hackathon?.isUserRegistered || hackathon?.userRegistration?.isRegistered;
    if (isReg) {
      navigate(`/hackathon/${hackathon?._id || id}/participate`);
      return;
    }
    setIsRegModalOpen(true);
  };

  const handleRegistrationSuccess = (regData) => {
    setHackathon((prev) => ({
      ...prev,
      isUserRegistered: true,
      userRegistration: {
        isRegistered: true,
        teamId: regData?.teamId,
        teamName: regData?.teamName || regData?.team?.name,
      },
      registeredTeamsCount: (prev?.registeredTeamsCount || 0) + 1,
    }));
    setToastMessage('Successfully registered for this hackathon! 🎉');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="pt-20 pl-16 pr-6 min-h-screen bg-default-bg flex items-center justify-center">
        <div className="text-center font-space">
          <div className="w-10 h-10 border-4 border-darker-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-semibold">Loading hackathon experience...</p>
        </div>
      </div>
    );
  }

  const h = hackathon || MOCK_HACKATHON;

  const isRegistered =
    h.isUserRegistered || h.userRegistration?.isRegistered;

  const rounds = h.roundIds && h.roundIds.length > 0 ? h.roundIds : MOCK_HACKATHON.roundIds;
  const prizes = h.prizes && h.prizes.length > 0 ? h.prizes : MOCK_HACKATHON.prizes;
  const tracks = h.tracks && h.tracks.length > 0 ? h.tracks : MOCK_HACKATHON.tracks;
  const judges = h.judges && h.judges.length > 0 ? h.judges : MOCK_HACKATHON.judges;
  const sponsors = h.sponsors && h.sponsors.length > 0 ? h.sponsors : MOCK_HACKATHON.sponsors;

  const totalPrizeSum =
    h.totalPrizes || prizes.reduce((s, p) => s + (p.amount || 0), 0);

  const tabs = [
    { id: 'overview', label: 'Overview & Tracks', icon: Layers },
    { id: 'rounds', label: 'Rounds & Timeline', icon: Clock },
    { id: 'prizes', label: 'Prizes & Sponsors', icon: Trophy },
    { id: 'rules', label: 'Rules & Eligibility', icon: Shield },
    { id: 'judges', label: 'Judges', icon: Award },
    { id: 'venue', label: 'Venue & Contact', icon: MapPin },
  ];

  return (
    <div className="pt-12 pl-14 sm:pl-16 pr-4 sm:pr-8 pb-16 min-h-screen bg-default-bg font-space">
      <div className="max-w-[1240px] mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 size={18} />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Back Link */}
        <div className="mb-4 pt-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-darker-blue transition-colors cursor-pointer bg-white/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-2xs"
          >
            <ArrowLeft size={13} />
            Back to Hackathons
          </button>
        </div>

        {/* ─── Hero Header Card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-sm mb-6 relative">
          {/* Cover Banner */}
          <div className="relative h-64 sm:h-72 md:h-80 w-full overflow-hidden bg-slate-900">
            <img
              src={h.banner || MOCK_HACKATHON.banner}
              alt={h.eventName}
              className="w-full h-full object-cover opacity-90"
            />
            {/* Dark glass gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                {h.status === 'ONGOING' ? '🟢 Ongoing' : h.status === 'COMPLETED' ? 'Finished' : 'Upcoming'}
              </span>
              <span className="bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {h.mode ? h.mode.charAt(0) + h.mode.slice(1).toLowerCase() : 'Hybrid'}
              </span>
              {h.paid ? (
                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Paid ({formatCurrency(h.feeAmount)})
                </span>
              ) : (
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Free Entry
                </span>
              )}
            </div>

            {/* Bottom Hero Info */}
            <div className="absolute bottom-5 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 z-10">
              <div className="flex items-start sm:items-center gap-4">
                {/* Logo badge */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-lg border-2 border-white/80 shrink-0 overflow-hidden flex items-center justify-center">
                  {h.logo ? (
                    <img src={h.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-2xl">
                      🦅
                    </div>
                  )}
                </div>

                {/* Event Name & Subtitle */}
                <div className="text-white">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
                    {h.eventName}
                  </h1>
                  <p className="text-xs sm:text-sm text-lime-300 font-semibold mt-0.5 max-w-2xl">
                    {h.theme}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Landmark size={13} className="text-white/90" />
                      {h.organizingBody}
                    </span>
                    {h.address && (
                      <span className="flex items-center gap-1 font-medium truncate max-w-xs text-white/70">
                        <MapPin size={13} />
                        {h.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons on banner */}
              <div className="flex items-center gap-2 self-start md:self-end">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? 'Link Copied!' : 'Share'}
                </button>

                <button
                  type="button"
                  onClick={handleRegisterClick}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5
                    ${isRegistered
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-white text-darker-blue hover:bg-slate-100 active:scale-95'
                    }`}
                >
                  {isRegistered ? (
                    <>
                      <CheckCircle2 size={15} /> Participant Hub →
                    </>
                  ) : (
                    <>
                      {h.paid ? `Register (${formatCurrency(h.feeAmount)})` : 'Register for Free'} <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 bg-white border-t border-gray-100">
            <div className="p-3.5 sm:p-4 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Prize Pool</span>
              <p className="text-lg sm:text-xl font-extrabold text-dark-green mt-0.5">
                {formatCurrency(totalPrizeSum)}
              </p>
            </div>
            <div className="p-3.5 sm:p-4 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Team Size</span>
              <p className="text-lg sm:text-xl font-extrabold text-darker-blue mt-0.5">
                {h.teamMinSize} - {h.teamMaxSize} Members
              </p>
            </div>
            <div className="p-3.5 sm:p-4 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registrations</span>
              <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-0.5">
                {h.registeredTeamsCount ?? 78} Teams
              </p>
            </div>
            <div className="p-3.5 sm:p-4 text-center">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registration Closes</span>
              <p className="text-sm sm:text-base font-extrabold text-red-500 mt-1">
                {formatDate(h.registrationCloses)}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Tabs Navigation Bar ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-1.5 border border-gray-200/80 shadow-xs mb-6 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer
                  ${active
                    ? 'bg-darker-blue text-white shadow-xs'
                    : 'text-gray-600 hover:text-darker-blue hover:bg-gray-100/70'
                  }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── Main Content Grid: 2 Columns ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tab Details (2 cols wide on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* TAB 1: OVERVIEW & TRACKS */}
            {activeTab === 'overview' && (
              <>
                {/* About Hackathon */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                  <h2 className="text-lg font-bold text-darker-blue mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-500" />
                    About the Hackathon
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed font-alef whitespace-pre-line">
                    {h.description || MOCK_HACKATHON.description}
                  </p>

                  {h.problemStatementPdfUrl && h.problemStatementPdfUrl !== '#' && (
                    <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText size={20} className="text-darker-blue" />
                        <div>
                          <p className="text-xs font-bold text-darker-blue">Official Problem Statement PDF</p>
                          <p className="text-[11px] text-gray-500">Download official challenge document and rubrics</p>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:3000/api/hackathons/${id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-darker-blue text-white text-xs font-semibold hover:bg-dark-blue flex items-center gap-1 cursor-pointer"
                      >
                        Download PDF <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Tracks & Themes */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                  <h2 className="text-lg font-bold text-darker-blue mb-4 flex items-center gap-2">
                    <Layers size={18} className="text-indigo-600" />
                    Hackathon Tracks & Challenges
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tracks.map((track, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 hover:border-darker-blue/30 hover:shadow-xs transition-all"
                      >
                        <div className="w-8 h-8 rounded-xl bg-darker-blue/10 text-darker-blue flex items-center justify-center font-bold text-xs mb-2">
                          0{idx + 1}
                        </div>
                        <h3 className="text-sm font-bold text-darker-blue leading-snug">{track.title}</h3>
                        <p className="text-xs text-gray-600 font-alef mt-1.5 leading-relaxed">
                          {track.description || 'Propose an end-to-end prototype tackling this challenge domain.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                {h.techStackRestrictions && h.techStackRestrictions.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <h2 className="text-lg font-bold text-darker-blue mb-3 flex items-center gap-2">
                      <Code size={18} className="text-emerald-600" />
                      Recommended & Allowed Tech Stacks
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {h.techStackRestrictions.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: ROUNDS & TIMELINE */}
            {activeTab === 'rounds' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                <h2 className="text-lg font-bold text-darker-blue mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  Rounds Breakdown & Evaluation Criteria
                </h2>

                <div className="space-y-6">
                  {rounds.map((round, idx) => (
                    <div
                      key={round._id || idx}
                      className="relative pl-8 pb-6 last:pb-0 border-l-2 border-darker-blue/20 last:border-l-transparent"
                    >
                      {/* Step Circle Indicator */}
                      <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-darker-blue text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {round.roundNumber || idx + 1}
                      </div>

                      <div className="bg-slate-50/70 rounded-2xl p-4 border border-gray-200/60">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h3 className="text-sm font-bold text-darker-blue">{round.roundName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {round.roundType || 'SUBMISSION'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            Opens: {formatDateTime(round.roundOpens)}
                          </span>
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <Clock size={12} />
                            Closes: {formatDateTime(round.roundCloses)}
                          </span>
                          {round.maxTeamsAdvancing && (
                            <span className="text-emerald-700 font-semibold">
                              Top {round.maxTeamsAdvancing} Teams Advance
                            </span>
                          )}
                        </div>

                        {/* Criteria list */}
                        {round.criterias && round.criterias.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/60">
                            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                              Judging Criteria & Weightage
                            </p>
                            <div className="space-y-2">
                              {round.criterias.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="flex items-start justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-gray-100"
                                >
                                  <div>
                                    <p className="font-bold text-darker-blue">{c.name}</p>
                                    <p className="text-[11px] text-gray-500 font-alef">{c.description}</p>
                                  </div>
                                  <span className="shrink-0 font-bold text-dark-green bg-green-50 px-2 py-0.5 rounded-md">
                                    {c.weight}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: PRIZES & SPONSORS */}
            {activeTab === 'prizes' && (
              <div className="space-y-6">
                {/* Prizes Grid */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                  <h2 className="text-lg font-bold text-darker-blue mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    Prizes & Rewards ({formatCurrency(totalPrizeSum)})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prizes.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-amber-900">{p.title}</span>
                            <span className="text-base font-extrabold text-amber-600">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-alef leading-relaxed">
                            {p.description || 'Awarded for exceptional execution and scoring.'}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-amber-200/50 flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold">
                          <CheckCircle2 size={12} /> Certificate + Trophy + Goodies
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sponsors Showcase */}
                {sponsors.map && sponsors.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                    <h2 className="text-lg font-bold text-darker-blue mb-4 flex items-center gap-2">
                      <Building2 size={18} className="text-blue-600" />
                      Sponsors & Partners
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {sponsors.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-gray-100 bg-slate-50 flex flex-col items-center justify-center text-center"
                        >
                          <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-gray-200/70 flex items-center justify-center font-bold text-darker-blue text-sm mb-2">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-xs font-bold text-darker-blue">{s.name}</p>
                          {s.websiteUrl && (
                            <a
                              href={s.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              Visit Website <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RULES & ELIGIBILITY */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                  <h2 className="text-lg font-bold text-darker-blue mb-4 flex items-center gap-2">
                    <Shield size={18} className="text-emerald-600" />
                    Participation Guidelines & Eligibility
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Who Can Participate?
                      </p>
                      <p className="text-sm font-bold text-darker-blue">
                        {h.eligibility === 'OPEN_TO_ALL'
                          ? 'Open to All Developers & Enthusiasts Worldwide'
                          : h.eligibility === 'ACROSS_UNIVERSITIES'
                          ? 'University & College Students Across All Accredited Institutions'
                          : h.eligibility === 'WORKING_PROFESSIONALS'
                          ? 'Working Professionals & Tech Practitioners'
                          : 'University Students'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Team Formation Guidelines
                      </p>
                      <p className="text-xs text-gray-700 font-alef leading-relaxed">
                        Teams must consist of a minimum of <strong>{h.teamMinSize}</strong> and a maximum of{' '}
                        <strong>{h.teamMaxSize}</strong> members. Cross-specialization teams (developers, designers,
                        product minds) are highly encouraged. Every member must be registered on the platform.
                      </p>
                    </div>

                    {h.plagiarismPolicyEnabled && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                        <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-1">
                          <AlertCircle size={15} /> Plagiarism & Original Code Policy
                        </div>
                        <p className="text-xs text-rose-700 font-alef leading-relaxed">
                          All project code commits must be written during the hacking period. Open source libraries
                          and publicly accessible APIs are permitted, but preexisting closed-source projects will lead
                          to immediate disqualification by the automated AI scrutiny system.
                        </p>
                      </div>
                    )}

                    {h.cocDocumentUrl && h.cocDocumentUrl !== '#' && (
                      <div className="pt-2">
                        <a
                          href={h.cocDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-darker-blue font-bold underline"
                        >
                          Read Full Code of Conduct Document <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: JUDGES */}
            {activeTab === 'judges' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                <h2 className="text-lg font-bold text-darker-blue mb-4 flex items-center gap-2">
                  <Award size={18} className="text-purple-600" />
                  Jury Panel & Mentors
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {judges.map((judge, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-gray-100 bg-slate-50 flex items-start gap-3.5"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
                        {judge.name ? judge.name.slice(0, 2).toUpperCase() : 'JD'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-darker-blue">{judge.name}</h3>
                        <p className="text-xs text-purple-700 font-semibold">{judge.designation || 'Eminent Judge'}</p>
                        <p className="text-xs text-gray-500 font-alef mt-1 leading-snug">
                          {judge.bio || 'Distinguished industry expert providing technical mentorship and project evaluation.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: VENUE & CONTACT */}
            {activeTab === 'venue' && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-darker-blue mb-2 flex items-center gap-2">
                  <MapPin size={18} className="text-red-500" />
                  Venue & Organizer Details
                </h2>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Event Location</p>
                  <p className="text-sm font-bold text-darker-blue mb-1">
                    {h.address || (h.mode === 'ONLINE' ? 'Virtual / Online Event' : 'Main Auditorium, Sekai University')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Mode: <strong>{h.mode}</strong> (Timezone: {h.timeZone || 'Asia/Kolkata'})
                  </p>

                  {h.mapLink && (
                    <a
                      href={h.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                    >
                      Open Google Maps Location <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                  <Building2 size={24} className="text-darker-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Organizing Committee</p>
                    <p className="text-sm font-bold text-darker-blue">{h.organizingBody}</p>
                    <p className="text-xs text-gray-600 font-alef mt-1">
                      For any questions regarding rules, team disputes, or sponsorship inquiries, reach out through the
                      official platform hub.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Action Card & Important Milestones */}
          <div className="space-y-6">
            {/* Primary Action Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  <Radio size={12} className="animate-pulse" />
                  Registrations Active
                </span>
              </div>

              {/* Big CTA */}
              <button
                type="button"
                onClick={handleRegisterClick}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mb-3
                  ${isRegistered
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-darker-blue text-white hover:bg-dark-blue active:scale-98'
                  }`}
              >
                {isRegistered ? (
                  <>
                    <CheckCircle2 size={16} /> Open Participant Hub →
                  </>
                ) : (
                  <>
                    {h.paid ? `Register (${formatCurrency(h.feeAmount)})` : 'Register for Free'} <ChevronRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-gray-500 font-alef mb-5">
                {isRegistered
                  ? 'Your participation is confirmed. Prepare your repositories for Round 1!'
                  : h.paid
                  ? `Registration Fee: ${formatCurrency(h.feeAmount)} • Form a team or join with an invite code`
                  : 'Free entry • Form a team or join with an invite code'}
              </p>

              <hr className="border-gray-100 mb-5" />

              {/* Important Timeline Dates Summary */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-darker-blue mb-3 flex items-center gap-1.5">
                <Calendar size={14} className="text-darker-blue" />
                Key Milestones
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Registration Opens</span>
                  <span className="font-bold text-gray-800">{formatDate(h.registrationOpens)}</span>
                </div>
                <div className="flex items-center justify-between text-red-500">
                  <span className="font-medium">Registration Closes</span>
                  <span className="font-extrabold">{formatDate(h.registrationCloses)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Hacking Starts</span>
                  <span className="font-bold text-gray-800">{formatDate(h.hackingStartsAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Hacking Ends</span>
                  <span className="font-bold text-gray-800">{formatDate(h.hackingEndsAt)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="font-medium">Results Announced</span>
                  <span className="font-extrabold">{formatDate(h.resultAnnouncementDate)}</span>
                </div>
              </div>

              <hr className="border-gray-100 my-5" />

              {/* Share & Invite friends */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Spread the word</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-xs font-bold text-darker-blue hover:text-dark-blue cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-200/60"
                >
                  <Share2 size={12} />
                  {copied ? 'Copied URL!' : 'Share Hackathon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal Form */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        hackathon={h}
        onRegistrationSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};

export default HackathonDetail;

