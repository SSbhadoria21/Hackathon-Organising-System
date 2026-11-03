import React, { useEffect, useState, useRef } from "react";
import { UserCheck, Trash2, Mail, AtSign, Shield, CheckCircle, Search, Loader2 } from "lucide-react";
import hackathonService from "../backend/hackathon.js";
import authService from "../backend/auth.js";

const unwrap = (response) => {
  let result = response;
  for (let i = 0; i < 3 && result && typeof result === "object"; i++) {
    if (result.data !== undefined) {
      result = result.data;
    } else {
      break;
    }
  }
  return result;
};

const Judges = ({
  draftId,
  initialData = {},
  onNext,
  onBack,
  saving = false,
}) => {
  const [judges, setJudges] = useState([]);
  const [loadingJudges, setLoadingJudges] = useState(true);
  const [inviteMode, setInviteMode] = useState("username"); // 'username' | 'email'

  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const suggestionBoxRef = useRef(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [accessType, setAccessType] = useState("FULL"); // 'FULL' | 'SPECIFIC_ROUNDS'
  const [selectedRoundIds, setSelectedRoundIds] = useState([]);

  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const availableRounds = Array.isArray(initialData.rounds)
    ? initialData.rounds
    : Array.isArray(initialData.roundIds)
    ? initialData.roundIds
    : [];

  // Fetch judges on mount
  useEffect(() => {
    let cancelled = false;
    const fetchJudges = async () => {
      if (!draftId) {
        setLoadingJudges(false);
        return;
      }
      try {
        const res = await hackathonService.getJudges(draftId);
        const data = unwrap(res);
        if (!cancelled && Array.isArray(data)) {
          setJudges(data);
        }
      } catch (err) {
        console.error("Failed to fetch judges:", err);
      } finally {
        if (!cancelled) setLoadingJudges(false);
      }
    };

    fetchJudges();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  // Debounced search for platform usernames
  useEffect(() => {
    if (inviteMode !== "username") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const clean = username.trim().replace(/^@/, '');
    if (!clean) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authService.searchUsers(clean);
        const data = unwrap(res);
        if (Array.isArray(data)) {
          setSuggestions(data);
          setShowSuggestions(true);
          setHighlightedIndex(-1);
        }
      } catch (err) {
        console.error("Search user error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [username, inviteMode]);

  // Click outside to close suggestion popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionBoxRef.current &&
        !suggestionBoxRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (user) => {
    setUsername(user.username);
    if (user.fullName && !fullName) {
      setFullName(user.fullName);
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectUser(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const toggleRoundSelection = (rId) => {
    setSelectedRoundIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (inviteMode === "username" && !username.trim()) {
      setError("Please enter a username to invite.");
      return;
    }

    if (inviteMode === "email" && !email.trim()) {
      setError("Please enter an email address to invite.");
      return;
    }

    if (accessType === "SPECIFIC_ROUNDS" && selectedRoundIds.length === 0) {
      setError("Please select at least one round for specific round access.");
      return;
    }

    setInviting(true);

    try {
      const payload = {
        accessType,
        roundIds: accessType === "SPECIFIC_ROUNDS" ? selectedRoundIds : undefined,
      };

      if (inviteMode === "username") {
        payload.targetUsername = username.trim().replace(/^@/, "");
      } else {
        payload.email = email.trim().toLowerCase();
        if (fullName.trim()) payload.name = fullName.trim();
      }

      const res = await hackathonService.inviteJudge(draftId, payload);
      const newJudge = unwrap(res);

      setJudges((prev) => [newJudge, ...prev]);
      setSuccessMsg(
        `Judge invitation sent successfully to ${
          inviteMode === "username" ? `@${payload.targetUsername}` : payload.email
        }!`
      );

      // Reset form
      setUsername("");
      setEmail("");
      setFullName("");
      setSelectedRoundIds([]);
      setAccessType("FULL");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to send judge invitation."
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveJudge = async (judgeId) => {
    if (!window.confirm("Are you sure you want to remove this judge?")) return;
    setError("");
    try {
      await hackathonService.removeJudge(draftId, judgeId);
      setJudges((prev) => prev.filter((j) => (j._id || j.id) !== judgeId));
      setSuccessMsg("Judge removed.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not remove judge."
      );
    }
  };

  const handleSaveStep = async (e) => {
    e.preventDefault();
    if (onNext) {
      await onNext();
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black";

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Judges & Evaluators
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Invite experts to score submissions. Judges receive private invites and can evaluate assigned rounds.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {/* Invite Judge Card */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-gray-700" /> Invite a Judge
        </h3>

        {/* Tab switch */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => {
              setInviteMode("username");
              setError("");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
              inviteMode === "username"
                ? "bg-black text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            <AtSign size={13} /> By Username
          </button>
          <button
            type="button"
            onClick={() => {
              setInviteMode("email");
              setError("");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
              inviteMode === "email"
                ? "bg-black text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Mail size={13} /> By Email Address
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          {inviteMode === "username" ? (
            <div className="relative" ref={suggestionBoxRef}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Platform Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                <input
                  type="text"
                  placeholder="Type an alphabet (e.g. rishika)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (!showSuggestions) setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className={`${inputClass} bg-white text-sm pl-8 pr-9`}
                  required
                  autoComplete="off"
                />
                {loadingSuggestions ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Loader2 size={15} className="animate-spin text-darker-blue" />
                  </div>
                ) : (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search size={14} />
                  </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && username.trim().replace(/^@/, '').length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in duration-150">
                  {loadingSuggestions && suggestions.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 size={13} className="animate-spin" /> Searching users...
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div>
                      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Suggested Users ({suggestions.length})
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {suggestions.map((user, idx) => {
                          const isHighlighted = idx === highlightedIndex;
                          return (
                            <li
                              key={user._id || user.username}
                              onClick={() => handleSelectUser(user)}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              className={`p-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                                isHighlighted ? 'bg-indigo-50/80 text-darker-blue' : 'hover:bg-gray-50'
                              }`}
                            >
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.username}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {(user.username || user.fullName || '?').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-gray-900 truncate">
                                    {user.fullName || user.username}
                                  </span>
                                  <span className="text-[11px] font-semibold text-indigo-600 shrink-0">
                                    @{user.username}
                                  </span>
                                </div>
                                {user.collegeOrCompany && (
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {user.collegeOrCompany}
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-md bg-gray-100">
                                Select
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3 text-xs text-gray-500 text-center">
                      No matching user found for &ldquo;{username.trim()}&rdquo;
                    </div>
                  )}
                </div>
              )}

              <p className="mt-1 text-xs text-gray-500">
                Type an alphabet or username to see instant suggestions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="judge@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} bg-white text-sm`}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Dr. Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`${inputClass} bg-white text-sm`}
                />
              </div>
            </div>
          )}

          {/* Access Scope */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Judging Access Permission
            </label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accessType"
                  value="FULL"
                  checked={accessType === "FULL"}
                  onChange={() => setAccessType("FULL")}
                />
                <span>Full Access (All rounds)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="accessType"
                  value="SPECIFIC_ROUNDS"
                  checked={accessType === "SPECIFIC_ROUNDS"}
                  onChange={() => setAccessType("SPECIFIC_ROUNDS")}
                />
                <span>Specific Rounds Only</span>
              </label>
            </div>

            {accessType === "SPECIFIC_ROUNDS" && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <p className="text-xs text-gray-500 mb-2">Select rounds this judge is assigned to:</p>
                {availableRounds.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No rounds found. Please configure rounds in step 4 first.
                  </p>
                ) : (
                  availableRounds.map((r, i) => {
                    const rId = String(r._id || r.id || i);
                    return (
                      <label key={rId} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRoundIds.includes(rId)}
                          onChange={() => toggleRoundSelection(rId)}
                        />
                        <span>
                          Round {r.roundNumber || i + 1}: {r.roundName || "Untitled"}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50 cursor-pointer"
            >
              {inviting ? "Sending Invitation..." : "Send Judge Invitation"}
            </button>
          </div>
        </form>
      </div>

      {/* Invited Judges List */}
      <section className="mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Invited Judges ({judges.length})
        </h3>

        {loadingJudges ? (
          <div className="py-6 text-center text-sm text-gray-500">
            Loading judges...
          </div>
        ) : judges.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No judges invited yet. You can invite judges now or continue and add judges later from hackathon management.
          </div>
        ) : (
          <div className="space-y-3">
            {judges.map((judge) => {
              const jId = judge._id || judge.id;
              const name =
                judge.userId?.fullName ||
                judge.name ||
                judge.username ||
                judge.email;
              const emailOrUsername =
                judge.userId?.username
                  ? `@${judge.userId.username}`
                  : judge.email || `@${judge.username}`;
              const status = judge.status || "INVITED";

              return (
                <div
                  key={jId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700 text-sm">
                      {name?.[0]?.toUpperCase() || "J"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-gray-500">{emailOrUsername}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : status === "DECLINED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {status}
                    </span>

                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {judge.accessType === "FULL" ? "Full Access" : "Specific Rounds"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveJudge(jId)}
                      className="text-gray-400 hover:text-red-600 transition cursor-pointer"
                      title="Remove judge"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleSaveStep}
          disabled={saving}
          className="rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : "Save and Next (Review)"}
        </button>
      </div>
    </div>
  );
};

export default Judges;
