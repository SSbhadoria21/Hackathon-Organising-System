import React, { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Award,
  Globe,
  MapPin,
  Shield,
  Layers,
  ArrowRight,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatDate = (dateVal) => {
  if (!dateVal) return "Not set";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ReviewPublish = ({
  draftId,
  draftData = {},
  onPublish,
  onBack,
  onEditStep,
  publishing = false,
  publishedHackathon = null,
}) => {
  const [copied, setCopied] = useState(false);

  // Check validation rules for publishing
  const missingItems = [];

  if (!draftData.eventName || draftData.eventName.trim().length < 3) {
    missingItems.push({ step: 0, text: "Event Name (at least 3 characters)" });
  }
  if (!draftData.theme?.trim()) {
    missingItems.push({ step: 0, text: "Theme is required" });
  }
  if (!draftData.banner) {
    missingItems.push({ step: 0, text: "Banner image is required" });
  }
  if (!draftData.organizingBody?.trim()) {
    missingItems.push({ step: 0, text: "Organizing Body is required" });
  }
  if (!draftData.description || draftData.description.trim().length < 20) {
    missingItems.push({ step: 0, text: "Description (at least 20 characters)" });
  }
  if ((draftData.mode === "OFFLINE" || draftData.mode === "HYBRID") && !draftData.address) {
    missingItems.push({ step: 0, text: "Venue Address is required for Offline/Hybrid events" });
  }

  if (!draftData.registrationOpens) {
    missingItems.push({ step: 1, text: "Registration opening date is required" });
  }
  if (!draftData.registrationCloses) {
    missingItems.push({ step: 1, text: "Registration closing date is required" });
  }
  if (!draftData.resultAnnouncementDate) {
    missingItems.push({ step: 1, text: "Result announcement date is required" });
  }

  if (!draftData.cocDocumentUrl) {
    missingItems.push({ step: 2, text: "Code of Conduct URL or document is required" });
  }

  const rounds = Array.isArray(draftData.rounds)
    ? draftData.rounds
    : Array.isArray(draftData.roundIds)
    ? draftData.roundIds
    : [];

  if (rounds.length === 0) {
    missingItems.push({ step: 3, text: "At least 1 round must be configured" });
  }

  const isReadyToPublish = missingItems.length === 0;

  const totalPrizePool = (draftData.prizes || []).reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const handleCopyLink = () => {
    const slug = publishedHackathon?.slug || draftData.slug;
    const url = `${window.location.origin}/hackathon/${slug || draftId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If already published, show success screen
  if (publishedHackathon) {
    return (
      <div className="mx-auto w-full max-w-3xl text-center py-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle className="h-10 w-10" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 font-space">
          Hackathon Published Successfully! 🎉
        </h1>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          &quot;{publishedHackathon.eventName}&quot; is now live. Participants can register and judges can access their evaluation portals.
        </p>

        <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-gray-50 p-4 mb-8">
          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Public Event Slug</p>
          <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2">
            <span className="text-sm font-mono text-gray-800 truncate">
              {publishedHackathon.slug}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-xs font-medium text-black hover:text-gray-600 cursor-pointer"
            >
              <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/home"
            className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            Go to Home
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            Create Another Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Review & Publish
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Review all hackathon configurations before publishing to the platform.
        </p>
      </div>

      {/* Validation Banner */}
      {!isReadyToPublish ? (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-amber-800 mb-2">
            <AlertCircle className="h-5 w-5" /> Please complete these required items before publishing:
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
            {missingItems.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span>{item.text}</span>
                <button
                  type="button"
                  onClick={() => onEditStep && onEditStep(item.step)}
                  className="text-xs font-semibold underline text-amber-900 hover:text-black cursor-pointer"
                >
                  Edit Step {item.step + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <span>All required fields are completed! Your hackathon is ready to publish.</span>
        </div>
      )}

      {/* Preview Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-8">
        {/* Banner */}
        {draftData.banner && (
          <div className="relative h-48 w-full bg-gray-100 sm:h-64">
            <img
              src={draftData.banner}
              alt="Hackathon banner"
              className="h-full w-full object-cover"
            />
            {draftData.logo && (
              <img
                src={draftData.logo}
                alt="Logo"
                className="absolute bottom-4 left-6 h-16 w-16 rounded-xl border-2 border-white bg-white object-cover shadow-md"
              />
            )}
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Mode */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                {draftData.theme || "Hackathon"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-space">
                {draftData.eventName || "Untitled Hackathon"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Organized by <span className="font-medium text-black">{draftData.organizingBody || "Organizer"}</span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-black px-3.5 py-1 text-xs font-semibold text-white uppercase tracking-wider">
                {draftData.mode || "ONLINE"}
              </span>
              {totalPrizePool > 0 && (
                <span className="text-sm font-semibold text-emerald-700">
                  ₹{totalPrizePool.toLocaleString()} Prize Pool
                </span>
              )}
            </div>
          </div>

          {/* Key metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
            <div>
              <p className="text-gray-500 font-medium">Registration Deadline</p>
              <p className="font-semibold text-black mt-0.5">
                {formatDate(draftData.registrationCloses)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Team Size</p>
              <p className="font-semibold text-black mt-0.5">
                {draftData.teamMinSize || 1} - {draftData.teamMaxSize || 4} Members
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Participation</p>
              <p className="font-semibold text-black mt-0.5">
                {draftData.paid ? `Paid (₹${draftData.feeAmount})` : "Free Entry"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Rounds Configured</p>
              <p className="font-semibold text-black mt-0.5">
                {rounds.length} {rounds.length === 1 ? "Round" : "Rounds"}
              </p>
            </div>
          </div>

          {/* Description */}
          {draftData.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">About the Event</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {draftData.description}
              </p>
            </div>
          )}

          {/* Rounds Breakdown */}
          {rounds.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" /> Configured Rounds
              </h4>
              <div className="space-y-3">
                {rounds.map((round, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">Round {idx + 1}: {round.roundName}</span>
                      <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 font-mono text-[10px] text-gray-700">
                        {round.roundType}
                      </span>
                      <p className="text-gray-500 mt-1">
                        Closes: {formatDate(round.roundCloses)} • Max advancing: {round.maxTeamsAdvancing || 10}
                      </p>
                    </div>
                    <div className="text-right text-gray-500">
                      <span>{round.criterias?.length || 0} evaluation criteria</span>
                      <p className="text-gray-700 font-medium">{Math.round((round.aiWeightage || 0.4) * 100)}% AI Evaluation</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracks */}
          {Array.isArray(draftData.tracks) && draftData.tracks.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Event Tracks</h4>
              <div className="flex flex-wrap gap-2">
                {draftData.tracks.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-800"
                  >
                    <span className="font-semibold">{t.title}</span>
                    {t.description && <span className="text-gray-500 ml-1.5">— {t.description}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prizes */}
          {Array.isArray(draftData.prizes) && draftData.prizes.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Award className="h-4 w-4" /> Prizes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {draftData.prizes.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                    <p className="font-bold text-gray-900">{p.title}</p>
                    <p className="text-emerald-700 font-semibold text-sm mt-0.5">
                      ₹{Number(p.amount || 0).toLocaleString()}
                    </p>
                    {p.description && <p className="text-gray-500 mt-1 truncate">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation & Publish Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={publishing}
          className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={publishing || !isReadyToPublish}
          className="flex items-center gap-2 rounded-lg bg-black px-8 py-3.5 text-base font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-md"
        >
          {publishing ? "Publishing Hackathon..." : "Publish Hackathon Now"}
          {!publishing && <ArrowRight size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ReviewPublish;

