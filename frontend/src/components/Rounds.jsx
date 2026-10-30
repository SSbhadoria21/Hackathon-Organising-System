import React, { useEffect, useState } from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";

const DEFAULT_CRITERIAS = [
  {
    name: "Innovation & Impact",
    weight: 40,
    description: "Novelty, creativity and potential real-world impact of the solution.",
  },
  {
    name: "Technical Execution",
    weight: 40,
    description: "Code quality, architecture, technical depth and implementation completeness.",
  },
  {
    name: "UI/UX & Presentation",
    weight: 20,
    description: "Design clarity, user experience, and effectiveness of demonstration.",
  },
];

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value.slice(0, 16) : "";
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const createDefaultRound = (roundNumber, defaultOpens, defaultCloses) => ({
  roundName: roundNumber === 1 ? "Idea & Project Submission" : `Round ${roundNumber}`,
  roundNumber,
  roundType: roundNumber === 1 ? "SUBMISSION" : "PROTOTYPE",
  roundOpens: toLocalInput(defaultOpens) || "",
  roundCloses: toLocalInput(defaultCloses) || "",
  maxTeamsAdvancing: 10,
  aiWeightage: 0.4,
  scoreThreshold: 0,
  criterias: DEFAULT_CRITERIAS.map((c) => ({ ...c })),
  quizQuestions: [
    {
      question: "Which of the following is a primary consideration in system scalability?",
      options: ["Horizontal partitioning", "CSS styling", "Color palette", "Font hierarchy"],
      correctIndex: 0,
      marks: 5,
      timeLimitSeconds: 60,
    },
  ],
});

const Rounds = ({
  initialData = {},
  onNext,
  onBack,
  saving = false,
}) => {
  const [rounds, setRounds] = useState([]);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = initialData.rounds || initialData.roundIds;
    if (Array.isArray(existing) && existing.length > 0 && typeof existing[0] === "object") {
      setRounds(
        existing.map((r, i) => ({
          roundName: r.roundName || `Round ${i + 1}`,
          roundNumber: r.roundNumber || i + 1,
          roundType: r.roundType || "SUBMISSION",
          roundOpens: toLocalInput(r.roundOpens),
          roundCloses: toLocalInput(r.roundCloses),
          maxTeamsAdvancing: r.maxTeamsAdvancing ?? 10,
          aiWeightage: r.aiWeightage ?? 0.4,
          scoreThreshold: r.scoreThreshold ?? 0,
          criterias:
            Array.isArray(r.criterias) && r.criterias.length > 0
              ? r.criterias.map((c) => ({
                  name: c.name || "",
                  weight: c.weight ?? 0,
                  description: c.description || "",
                }))
              : DEFAULT_CRITERIAS.map((c) => ({ ...c })),
          quizQuestions:
            Array.isArray(r.quizQuestions) && r.quizQuestions.length > 0
              ? r.quizQuestions.map((q) => ({
                  question: q.question || "",
                  options: Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
                  correctIndex: q.correctIndex ?? 0,
                  marks: q.marks ?? 5,
                  timeLimitSeconds: q.timeLimitSeconds ?? 60,
                }))
              : [],
        }))
      );
    } else {
      // Create Round 1 prefilled with hackathon timeline if available
      const defaultOpens = initialData.registrationCloses || initialData.registrationOpens;
      const defaultCloses = initialData.resultAnnouncementDate;
      setRounds([createDefaultRound(1, defaultOpens, defaultCloses)]);
    }
  }, [initialData]);

  const currentRound = rounds[activeRoundIndex] || rounds[0];

  const updateCurrentRound = (field, value) => {
    setRounds((prev) => {
      const copy = [...prev];
      copy[activeRoundIndex] = {
        ...copy[activeRoundIndex],
        [field]: value,
      };
      return copy;
    });
  };

  const addRound = () => {
    const newRoundNumber = rounds.length + 1;
    const prevRound = rounds[rounds.length - 1];
    const defaultOpens = prevRound?.roundCloses || initialData.registrationCloses;
    const defaultCloses = initialData.resultAnnouncementDate;
    const newRound = createDefaultRound(newRoundNumber, defaultOpens, defaultCloses);
    setRounds([...rounds, newRound]);
    setActiveRoundIndex(rounds.length);
  };

  const removeRound = (index) => {
    if (rounds.length <= 1) return;
    const updated = rounds
      .filter((_, i) => i !== index)
      .map((r, i) => ({
        ...r,
        roundNumber: i + 1,
      }));
    setRounds(updated);
    setActiveRoundIndex(Math.max(0, index - 1));
  };

  // Criteria actions
  const addCriteria = () => {
    const updatedCriterias = [
      ...(currentRound.criterias || []),
      { name: "", weight: 20, description: "" },
    ];
    updateCurrentRound("criterias", updatedCriterias);
  };

  const removeCriteria = (critIndex) => {
    const list = currentRound.criterias || [];
    if (list.length <= 1) return;
    updateCurrentRound("criterias", list.filter((_, i) => i !== critIndex));
  };

  const updateCriteria = (critIndex, field, value) => {
    const list = [...(currentRound.criterias || [])];
    list[critIndex] = {
      ...list[critIndex],
      [field]: field === "weight" ? Number(value) || 0 : value,
    };
    updateCurrentRound("criterias", list);
  };

  // Quiz actions
  const addQuestion = () => {
    const list = [
      ...(currentRound.quizQuestions || []),
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        marks: 5,
        timeLimitSeconds: 60,
      },
    ];
    updateCurrentRound("quizQuestions", list);
  };

  const removeQuestion = (qIndex) => {
    const list = currentRound.quizQuestions || [];
    if (list.length <= 1) return;
    updateCurrentRound("quizQuestions", list.filter((_, i) => i !== qIndex));
  };

  const updateQuestion = (qIndex, field, value) => {
    const list = [...(currentRound.quizQuestions || [])];
    list[qIndex] = {
      ...list[qIndex],
      [field]: value,
    };
    updateCurrentRound("quizQuestions", list);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const list = [...(currentRound.quizQuestions || [])];
    const opts = [...list[qIndex].options];
    opts[optIndex] = value;
    list[qIndex] = { ...list[qIndex], options: opts };
    updateCurrentRound("quizQuestions", list);
  };

  const totalCriteriaWeight = (currentRound?.criterias || []).reduce(
    (sum, c) => sum + (Number(c.weight) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!rounds || rounds.length === 0) {
      setError("Please configure at least one round.");
      return;
    }

    // Validate each round
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (!r.roundName?.trim()) {
        setError(`Round ${i + 1} must have a name.`);
        setActiveRoundIndex(i);
        return;
      }
      if (!r.roundOpens || !r.roundCloses) {
        setError(`Round ${i + 1} (${r.roundName}) must have start and end dates.`);
        setActiveRoundIndex(i);
        return;
      }
      if (new Date(r.roundOpens) >= new Date(r.roundCloses)) {
        setError(`Round ${i + 1} closing date must be after opening date.`);
        setActiveRoundIndex(i);
        return;
      }
      if (!r.criterias || r.criterias.length === 0) {
        setError(`Round ${i + 1} must have at least one evaluation criterion.`);
        setActiveRoundIndex(i);
        return;
      }
      for (let j = 0; j < r.criterias.length; j++) {
        if (!r.criterias[j].name?.trim()) {
          setError(`Criterion ${j + 1} in Round ${i + 1} must have a name.`);
          setActiveRoundIndex(i);
          return;
        }
      }
    }

    const formattedRounds = rounds.map((r, index) => ({
      roundName: r.roundName.trim(),
      roundNumber: index + 1,
      roundType: r.roundType,
      roundOpens: new Date(r.roundOpens),
      roundCloses: new Date(r.roundCloses),
      maxTeamsAdvancing: Number(r.maxTeamsAdvancing) || 10,
      aiWeightage: Number(r.aiWeightage) ?? 0.4,
      scoreThreshold: Number(r.scoreThreshold) || 0,
      criterias: r.criterias.map((c) => ({
        name: c.name.trim(),
        weight: Number(c.weight) || 0,
        description: (c.description || "Evaluation criterion").trim(),
      })),
      quizQuestions:
        r.roundType === "QUIZ"
          ? (r.quizQuestions || []).map((q) => ({
              question: q.question.trim(),
              options: q.options.map((o) => o.trim()),
              correctIndex: Number(q.correctIndex) || 0,
              marks: Number(q.marks) || 1,
              timeLimitSeconds: q.timeLimitSeconds ? Number(q.timeLimitSeconds) : undefined,
            }))
          : undefined,
    }));

    if (onNext) {
      await onNext({ rounds: formattedRounds });
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black";

  if (!currentRound) return null;

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Configure Rounds</h2>
        <p className="mt-1 text-sm text-gray-500">
          Build your hackathon stages. Configure submission formats, rubrics, and advancement rules.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Rounds Navigation Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        {rounds.map((round, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveRoundIndex(index)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer ${
              activeRoundIndex === index
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>Round {index + 1}: {round.roundName || "Untitled"}</span>
            {rounds.length > 1 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removeRound(index);
                }}
                className="ml-1 text-xs opacity-60 hover:opacity-100 cursor-pointer"
                title="Remove this round"
              >
                ✕
              </span>
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={addRound}
          className="flex items-center gap-1 rounded-lg border border-dashed border-gray-400 px-3 py-2 text-sm font-medium text-gray-700 hover:border-black hover:text-black transition cursor-pointer"
        >
          <Plus size={14} /> Add Next Round
        </button>
      </div>

      <div className="space-y-6">
        {/* Round Name & Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Round Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Idea Submission, Prototype Phase, Final Demo"
              value={currentRound.roundName}
              onChange={(e) => updateCurrentRound("roundName", e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Round Type <span className="text-red-500">*</span>
            </label>
            <select
              value={currentRound.roundType}
              onChange={(e) => updateCurrentRound("roundType", e.target.value)}
              className={`${inputClass} bg-white`}
            >
              <option value="SUBMISSION">Document / PPT Submission</option>
              <option value="PROTOTYPE">Prototype (GitHub + Live Demo)</option>
              <option value="PITCH">Pitch / Presentation</option>
              <option value="QUIZ">Timed Quiz / Assessment</option>
            </select>
          </div>
        </div>

        {/* Round Opens & Closes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Round Opens <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={currentRound.roundOpens}
              onChange={(e) => updateCurrentRound("roundOpens", e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Round Closes (Deadline) <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={currentRound.roundCloses}
              onChange={(e) => updateCurrentRound("roundCloses", e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Advancement & AI Weights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 pt-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Max Teams Advancing
            </label>
            <input
              type="number"
              min="1"
              value={currentRound.maxTeamsAdvancing}
              onChange={(e) => updateCurrentRound("maxTeamsAdvancing", e.target.value)}
              className={inputClass}
              placeholder="e.g. 10"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Top teams qualified for the next round.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              AI Evaluation Weight
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={currentRound.aiWeightage}
                onChange={(e) => updateCurrentRound("aiWeightage", e.target.value)}
                className={inputClass}
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {Math.round((currentRound.aiWeightage || 0) * 100)}% AI
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Human judge weight: {Math.round((1 - (currentRound.aiWeightage || 0)) * 100)}%
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Score Threshold (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={currentRound.scoreThreshold}
              onChange={(e) => updateCurrentRound("scoreThreshold", e.target.value)}
              className={inputClass}
              placeholder="0 (no minimum threshold)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum score needed to pass.
            </p>
          </div>
        </div>

        {/* ================= CRITERIA (RUBRIC) ================= */}
        <div className="border-t border-gray-200 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evaluation Rubric (Criteria)
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    totalCriteriaWeight === 100
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Total Weight: {totalCriteriaWeight}% {totalCriteriaWeight === 100 ? "✓" : "(Target: 100%)"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                These criteria guide both the AI evaluator and human judges.
              </p>
            </div>

            <button
              type="button"
              onClick={addCriteria}
              className="flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 transition cursor-pointer"
            >
              <Plus size={14} /> Add Criterion
            </button>
          </div>

          <div className="space-y-3">
            {(currentRound.criterias || []).map((crit, cIdx) => (
              <div
                key={cIdx}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">
                    Criterion {cIdx + 1}
                  </span>
                  {(currentRound.criterias || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriteria(cIdx)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Criterion Name (e.g. Technical Depth, UI/UX)"
                      value={crit.name}
                      onChange={(e) => updateCriteria(cIdx, "name", e.target.value)}
                      className={`${inputClass} bg-white text-sm`}
                      required
                    />
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Weight %"
                        value={crit.weight}
                        onChange={(e) => updateCriteria(cIdx, "weight", e.target.value)}
                        className={`${inputClass} bg-white text-sm pr-8`}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Describe what judges and AI should check for..."
                  value={crit.description}
                  onChange={(e) => updateCriteria(cIdx, "description", e.target.value)}
                  className={`${inputClass} bg-white text-sm resize-none`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ================= QUIZ QUESTIONS (IF TYPE QUIZ) ================= */}
        {currentRound.roundType === "QUIZ" && (
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quiz Questions</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Participants will answer these timed questions in Round {activeRoundIndex + 1}.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 transition cursor-pointer"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {(currentRound.quizQuestions || []).map((q, qIdx) => (
                <div key={qIdx} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Question {qIdx + 1}</span>
                    {(currentRound.quizQuestions || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Enter question text..."
                    value={q.question}
                    onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                    className={`${inputClass} bg-white text-sm mb-3`}
                    required
                  />

                  <div className="space-y-2 mb-3">
                    <span className="text-xs text-gray-500">Options (Select radio for correct answer):</span>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${activeRoundIndex}-${qIdx}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => updateQuestion(qIdx, "correctIndex", optIdx)}
                          className="h-4 w-4 cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          className={`${inputClass} bg-white text-sm py-2`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">Marks for correct answer</span>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => updateQuestion(qIdx, "marks", Number(e.target.value))}
                        className={`${inputClass} bg-white text-sm`}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Time limit (seconds)</span>
                      <input
                        type="number"
                        min="10"
                        value={q.timeLimitSeconds}
                        onChange={(e) => updateQuestion(qIdx, "timeLimitSeconds", Number(e.target.value))}
                        className={`${inputClass} bg-white text-sm`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
          type="submit"
          disabled={saving}
          className="rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving Rounds..." : "Save and Next"}
        </button>
      </div>
    </form>
  );
};

export default Rounds;
