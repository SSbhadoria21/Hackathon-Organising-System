import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Trophy, ArrowRight, Loader2, AlertCircle, Crown, CheckCircle2,
  Target, FileText, ChevronRight,
} from 'lucide-react';
import hackathonService from '../../backend/hackathon.js';

function formatDate(d) {
  if (!d) return 'TBA';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return 'TBA';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MyTeams = () => {
  const navigate = useNavigate();
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await hackathonService.getParticipations();
        const data = res?.data || res;
        const list = Array.isArray(data?.myParticipations)
          ? data.myParticipations
          : Array.isArray(data?.participations)
          ? data.participations
          : Array.isArray(data) ? data : [];
        setParticipations(list);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load your teams.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="pt-20 pl-16 min-h-screen bg-default-bg flex items-center justify-center font-space">
      <div className="text-center space-y-3">
        <Loader2 size={32} className="animate-spin text-darker-blue mx-auto" />
        <p className="text-xs font-semibold text-gray-500">Loading your teams...</p>
      </div>
    </div>
  );

  return (
    <div className="pt-14 pl-14 sm:pl-16 pr-4 sm:pr-8 pb-20 min-h-screen bg-default-bg font-space">
      <div className="max-w-5xl mx-auto space-y-6 mt-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-darker-blue" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">My Hackathon Teams</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darker-blue">Teams & Participations</h1>
          <p className="text-xs text-gray-500 font-alef mt-0.5">All hackathons you have participated in with your team history.</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && participations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-darker-blue">No Teams Yet</h3>
            <p className="text-xs text-gray-500 font-alef">You haven't joined or created any hackathon teams yet. Find a hackathon and register!</p>
            <button onClick={() => navigate('/home')}
              className="px-5 py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold shadow-md transition cursor-pointer inline-flex items-center gap-2">
              Browse Hackathons <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {participations.map((part, idx) => {
              const h = part.hackathon || {};
              const hId = h._id?.toString() || h.slug;
              const hStatus = h.lifecycleStatus || h.status || '';
              return (
                <div key={part.teamId || hId || idx} className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
                  {/* Banner strip */}
                  <div className="relative h-28 w-full bg-gradient-to-r from-darker-blue to-indigo-700 overflow-hidden">
                    {h.banner && <img src={h.banner} alt={h.eventName} className="w-full h-full object-cover opacity-60" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-5 right-5 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-lime-300 font-bold uppercase">{h.organizingBody}</p>
                        <h2 className="text-base font-extrabold text-white truncate">{h.eventName || 'Hackathon'}</h2>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${hStatus==='ONGOING'?'bg-emerald-400 text-emerald-950':hStatus==='COMPLETED'?'bg-purple-200 text-purple-900':hStatus==='DRAFT'?'bg-amber-200 text-amber-900':'bg-blue-100 text-blue-800'}`}>
                        {hStatus || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Team Info */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Team</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm">
                          {(part.teamName || 'T')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-darker-blue">{part.teamName || 'Your Team'}</p>
                          {part.isLeader && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                              <Crown size={9} /> Team Leader
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users size={11} /> {part.memberCount || part.members?.length || 1} members</span>
                        <span className="flex items-center gap-1"><FileText size={11} /> {part.submissionsCount ?? 0} submissions</span>
                      </div>
                      {part.paymentStatus === 'PENDING' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">⚠️ Payment Pending</span>
                      )}
                    </div>

                    {/* Hackathon Dates */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timeline</p>
                      <div className="space-y-1 text-xs text-gray-600 font-alef">
                        <p>📅 Reg. Closes: <strong>{formatDate(h.registrationCloses)}</strong></p>
                        <p>⚡ Hacking: <strong>{formatDate(h.hackingStartsAt)}</strong></p>
                        <p>🏁 Ends: <strong>{formatDate(h.hackingEndsAt)}</strong></p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {part.paymentStatus === 'PENDING' ? (
                        <button onClick={() => navigate(`/hackathon/${hId}/payment`, { state: { hackathon: h, team: { name: part.teamName } } })}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                          Complete Payment <ChevronRight size={13} />
                        </button>
                      ) : (
                        <button onClick={() => navigate(`/hackathon/${hId}/participate`)}
                          className="w-full py-2.5 rounded-xl bg-darker-blue hover:bg-dark-blue text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                          Go to Participation Hub <ArrowRight size={13} />
                        </button>
                      )}
                      <button onClick={() => navigate(`/hackathons/${hId}`)}
                        className="w-full py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer">
                        View Hackathon Page
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeams;