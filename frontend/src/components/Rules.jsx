import React, { useEffect, useState } from "react";
import { Plus, Trash2, Upload, FileText, Check } from "lucide-react";
import hackathonService from "../backend/hackathon.js";

const DEFAULT_COC_URL = "https://hackcodeofconduct.org/";

const Rules = ({
  initialData = {},
  onNext,
  onBack,
  saving = false,
}) => {
  const [teamMinSize, setTeamMinSize] = useState(1);
  const [teamMaxSize, setTeamMaxSize] = useState(4);
  const [eligibility, setEligibility] = useState("OPEN_TO_ALL");
  const [allowedColleges, setAllowedColleges] = useState("");
  const [plagiarismEnabled, setPlagiarismEnabled] = useState(false);
  const [techStackRestrictions, setTechStackRestrictions] = useState("");

  // Code of conduct
  const [cocType, setCocType] = useState("url"); // 'url' | 'file' | 'default'
  const [cocUrl, setCocUrl] = useState(DEFAULT_COC_URL);
  const [cocFile, setCocFile] = useState(null);

  // Problem statement
  const [problemPdfUrl, setProblemPdfUrl] = useState("");
  const [problemPdfFile, setProblemPdfFile] = useState(null);

  // Tracks
  const [tracks, setTracks] = useState([
    { title: "General Track", description: "Open theme projects addressing real world challenges." },
  ]);

  const [formError, setFormError] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (initialData.teamMinSize !== undefined) {
      setTeamMinSize(initialData.teamMinSize || 1);
    }
    if (initialData.teamMaxSize !== undefined) {
      setTeamMaxSize(initialData.teamMaxSize || 4);
    }
    if (initialData.eligibility) {
      setEligibility(initialData.eligibility);
    }
    if (initialData.allowedColleges) {
      setAllowedColleges(
        Array.isArray(initialData.allowedColleges)
          ? initialData.allowedColleges.join(", ")
          : initialData.allowedColleges
      );
    }
    if (initialData.plagiarismPolicyEnabled !== undefined) {
      setPlagiarismEnabled(Boolean(initialData.plagiarismPolicyEnabled));
    }
    if (initialData.techStackRestrictions) {
      setTechStackRestrictions(
        Array.isArray(initialData.techStackRestrictions)
          ? initialData.techStackRestrictions.join(", ")
          : initialData.techStackRestrictions
      );
    }
    if (initialData.cocDocumentUrl) {
      setCocUrl(initialData.cocDocumentUrl);
      setCocType("url");
    }
    if (initialData.problemStatementPdfUrl) {
      setProblemPdfUrl(initialData.problemStatementPdfUrl);
    }
    if (Array.isArray(initialData.tracks) && initialData.tracks.length > 0) {
      setTracks(
        initialData.tracks.map((t) => ({
          title: t.title || t.name || "",
          description: t.description || "",
        }))
      );
    }
  }, [initialData]);

  // Track handlers
  const addTrack = () => {
    setTracks([...tracks, { title: "", description: "" }]);
  };

  const removeTrack = (index) => {
    if (tracks.length <= 1) return;
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const updateTrack = (index, field, value) => {
    const updated = [...tracks];
    updated[index][field] = value;
    setTracks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (Number(teamMinSize) < 1) {
      setFormError("Minimum team size must be at least 1.");
      return;
    }

    if (Number(teamMinSize) > Number(teamMaxSize)) {
      setFormError("Minimum team size cannot be greater than maximum team size.");
      return;
    }

    let finalCocUrl = cocUrl.trim();
    if (cocType === "default") {
      finalCocUrl = DEFAULT_COC_URL;
    }

    let finalProblemPdfUrl = problemPdfUrl.trim();

    try {
      setUploadingDoc(true);

      if (cocType === "file" && cocFile) {
        const uploadRes = await hackathonService.uploadFile(cocFile, "documents");
        const uploadedUrl =
          uploadRes?.data?.url ||
          uploadRes?.data?.secure_url ||
          uploadRes?.url ||
          uploadRes?.secure_url;
        if (!uploadedUrl) {
          throw new Error("Failed to upload Code of Conduct document.");
        }
        finalCocUrl = uploadedUrl;
      }

      if (problemPdfFile) {
        const uploadRes = await hackathonService.uploadFile(problemPdfFile, "documents");
        const uploadedUrl =
          uploadRes?.data?.url ||
          uploadRes?.data?.secure_url ||
          uploadRes?.url ||
          uploadRes?.secure_url;
        if (!uploadedUrl) {
          throw new Error("Failed to upload Problem Statement document.");
        }
        finalProblemPdfUrl = uploadedUrl;
      }

      if (!finalCocUrl) {
        finalCocUrl = DEFAULT_COC_URL;
      }

      const formattedTracks = tracks
        .filter((t) => t.title && t.title.trim())
        .map((t) => ({
          title: t.title.trim(),
          description: t.description ? t.description.trim() : "",
        }));

      const payload = {
        teamMinSize: Number(teamMinSize),
        teamMaxSize: Number(teamMaxSize),
        eligibility,
        allowedColleges: allowedColleges
          ? allowedColleges.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        plagiarismPolicyEnabled: plagiarismEnabled,
        cocDocumentUrl: finalCocUrl,
        techStackRestrictions: techStackRestrictions
          ? techStackRestrictions.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        problemStatementPdfUrl: finalProblemPdfUrl || undefined,
        tracks: formattedTracks.length > 0 ? formattedTracks : [{ title: "General", description: "" }],
      };

      if (onNext) {
        await onNext(payload);
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.message ||
        "Failed to save rules and guidelines."
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black";

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Rules & Guidelines
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Define the participation requirements, team size, eligibility, and tracks for your hackathon.
        </p>
      </div>

      {formError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {formError}
        </div>
      )}

      <div className="space-y-6">
        {/* Team Size */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Team Size Range <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs text-gray-500 mb-1">Minimum Members</span>
              <input
                type="number"
                min="1"
                max={teamMaxSize}
                value={teamMinSize}
                onChange={(e) => setTeamMinSize(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <span className="block text-xs text-gray-500 mb-1">Maximum Members</span>
              <input
                type="number"
                min={teamMinSize}
                value={teamMaxSize}
                onChange={(e) => setTeamMaxSize(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Eligibility <span className="text-red-500">*</span>
          </label>
          <select
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="OPEN_TO_ALL">Open to Everyone</option>
            <option value="UNIVERSITY_STUDENTS">University / College Students Only</option>
            <option value="ACROSS_UNIVERSITIES">Across Universities / Inter-College</option>
            <option value="WORKING_PROFESSIONALS">Working Professionals</option>
          </select>
        </div>

        {/* Allowed Colleges */}
        {(eligibility === "UNIVERSITY_STUDENTS" || eligibility === "ACROSS_UNIVERSITIES") && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Allowed Colleges / Universities
              <span className="ml-2 text-xs font-normal text-gray-500">
                (Optional, leave blank to allow all colleges)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. MIT, Stanford, IIT Bombay (comma-separated)"
              value={allowedColleges}
              onChange={(e) => setAllowedColleges(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {/* Plagiarism Policy Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-300 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Plagiarism & AI Code Policy
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Enable automated originality checks and plagiarism scanning on submissions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlagiarismEnabled(!plagiarismEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
              plagiarismEnabled ? "bg-black" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                plagiarismEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Code of Conduct */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-800">
              Code of Conduct <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCocType("default")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  cocType === "default" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Use Standard COC
              </button>
              <button
                type="button"
                onClick={() => setCocType("url")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  cocType === "url" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Provide Link
              </button>
              <button
                type="button"
                onClick={() => setCocType("file")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  cocType === "file" ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {cocType === "default" && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
              Using standard hackathon Code of Conduct (<a href={DEFAULT_COC_URL} target="_blank" rel="noreferrer" className="underline text-blue-600">hackcodeofconduct.org</a>).
            </div>
          )}

          {cocType === "url" && (
            <input
              type="url"
              placeholder="https://..."
              value={cocUrl}
              onChange={(e) => setCocUrl(e.target.value)}
              className={inputClass}
              required
            />
          )}

          {cocType === "file" && (
            <div className="space-y-2">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-black transition">
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {cocFile ? cocFile.name : "Select Code of Conduct file (PDF, DOCX)"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCocFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {cocUrl && !cocFile && (
                <p className="text-xs text-gray-500">
                  Current file: <a href={cocUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View current document</a>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tech Stack Restrictions */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Tech Stack Restrictions
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. React, Next.js, Python only, or No proprietary paid APIs (comma-separated)"
            value={techStackRestrictions}
            onChange={(e) => setTechStackRestrictions(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Problem Statements */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Problem Statement / Guideline Document
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="url"
              placeholder="Paste document URL (or upload on right)"
              value={problemPdfUrl}
              onChange={(e) => setProblemPdfUrl(e.target.value)}
              className={inputClass}
            />
            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-4 py-3 hover:border-black transition text-sm">
              <Upload className="h-4 w-4 text-gray-500 mr-2" />
              <span className="truncate">
                {problemPdfFile ? problemPdfFile.name : "Upload PDF/DOC"}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setProblemPdfFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Tracks */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-800">
                Hackathon Tracks / Themes
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Add tracks or problem statement categories for participants.
              </p>
            </div>
            <button
              type="button"
              onClick={addTrack}
              className="flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 transition cursor-pointer"
            >
              <Plus size={14} /> Add Track
            </button>
          </div>

          <div className="space-y-4">
            {tracks.map((track, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Track {index + 1}
                  </h4>
                  {tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrack(index)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Track Title (e.g. AI / ML, Web3, Healthcare, Open Innovation)"
                    value={track.title}
                    onChange={(e) => updateTrack(index, "title", e.target.value)}
                    className={`${inputClass} bg-white text-sm`}
                    required
                  />
                  <textarea
                    rows={2}
                    placeholder="Brief description or focus area for this track..."
                    value={track.description}
                    onChange={(e) => updateTrack(index, "description", e.target.value)}
                    className={`${inputClass} bg-white text-sm resize-none`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={saving || uploadingDoc}
          className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={saving || uploadingDoc}
          className="rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {uploadingDoc ? "Uploading Documents..." : saving ? "Saving..." : "Save and Next"}
        </button>
      </div>
    </form>
  );
};

export default Rules;
