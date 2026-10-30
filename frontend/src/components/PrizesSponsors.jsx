import React, { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Award, Building } from "lucide-react";
import hackathonService from "../backend/hackathon.js";

const DEFAULT_PRIZES = [
  {
    title: "1st Place - Grand Winner",
    type: "CASH",
    amount: 50000,
    description: "Cash prize, trophy, and winner certificates for the overall best project.",
  },
  {
    title: "2nd Place - Runner Up",
    type: "CASH",
    amount: 25000,
    description: "Cash prize and certificates for second place.",
  },
];

const PrizesSponsors = ({
  initialData = {},
  onNext,
  onBack,
  saving = false,
}) => {
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [sponsors, setSponsors] = useState([]);
  const [error, setError] = useState("");
  const [uploadingLogos, setUploadingLogos] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialData.prizes) && initialData.prizes.length > 0) {
      setPrizes(
        initialData.prizes.map((p) => ({
          title: p.title || "",
          type: (p.type || "CASH").toUpperCase(),
          amount: p.amount ?? 0,
          description: p.description || "",
        }))
      );
    }

    if (Array.isArray(initialData.sponsors) && initialData.sponsors.length > 0) {
      setSponsors(
        initialData.sponsors.map((s) => ({
          name: s.name || "",
          logoFile: null,
          logoUrl: s.logoUrl || "",
          websiteUrl: s.websiteUrl || "",
        }))
      );
    }
  }, [initialData]);

  // Prize handlers
  const addPrize = () => {
    setPrizes([
      ...prizes,
      {
        title: "",
        type: "CASH",
        amount: 10000,
        description: "",
      },
    ]);
  };

  const removePrize = (index) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index, field, value) => {
    const updated = [...prizes];
    updated[index] = {
      ...updated[index],
      [field]: field === "amount" ? Number(value) || 0 : value,
    };
    setPrizes(updated);
  };

  // Sponsor handlers
  const addSponsor = () => {
    setSponsors([
      ...sponsors,
      {
        name: "",
        logoFile: null,
        logoUrl: "",
        websiteUrl: "",
      },
    ]);
  };

  const removeSponsor = (index) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const updateSponsor = (index, field, value) => {
    const updated = [...sponsors];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSponsors(updated);
  };

  const totalPrizePool = prizes.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate prizes if any exist
    for (let i = 0; i < prizes.length; i++) {
      if (!prizes[i].title?.trim()) {
        setError(`Prize ${i + 1} must have a title.`);
        return;
      }
    }

    // Validate sponsors if any exist
    for (let i = 0; i < sponsors.length; i++) {
      if (!sponsors[i].name?.trim()) {
        setError(`Sponsor ${i + 1} must have a name.`);
        return;
      }
    }

    try {
      setUploadingLogos(true);

      // Upload newly selected sponsor logos
      const processedSponsors = await Promise.all(
        sponsors.map(async (s) => {
          let logoUrl = s.logoUrl || "";
          if (s.logoFile) {
            const res = await hackathonService.uploadFile(s.logoFile, "sponsors");
            logoUrl =
              res?.data?.url ||
              res?.data?.secure_url ||
              res?.url ||
              res?.secure_url ||
              logoUrl;
          }
          return {
            name: s.name.trim(),
            logoUrl,
            websiteUrl: s.websiteUrl?.trim() || "",
          };
        })
      );

      const formattedPrizes = prizes
        .filter((p) => p.title && p.title.trim())
        .map((p) => ({
          title: p.title.trim(),
          amount: Number(p.amount) || 0,
          type: (p.type || "CASH").toUpperCase(),
          description: p.description?.trim() || "",
        }));

      if (onNext) {
        await onNext({
          prizes: formattedPrizes,
          sponsors: processedSponsors,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to save prizes and sponsors."
      );
    } finally {
      setUploadingLogos(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black";

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Prizes & Sponsors
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Highlight what participants can win and recognize the organizations supporting your event.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* ================= PRIZES ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-gray-700" /> Prizes & Bounties
            </h3>
            {totalPrizePool > 0 && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Total Pool: ₹{totalPrizePool.toLocaleString()}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={addPrize}
            className="flex items-center gap-1 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 transition cursor-pointer"
          >
            <Plus size={14} /> Add Prize
          </button>
        </div>

        {prizes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No prizes added yet. Click &quot;Add Prize&quot; to define prizes or rewards for winners.
          </div>
        ) : (
          <div className="space-y-4">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-5 transition"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Prize #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prize Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1st Place, Best AI Project, Best Beginner Hack"
                        value={prize.title}
                        onChange={(e) => updatePrize(index, "title", e.target.value)}
                        className={`${inputClass} bg-white text-sm`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Prize Type
                      </label>
                      <select
                        value={prize.type}
                        onChange={(e) => updatePrize(index, "type", e.target.value)}
                        className={`${inputClass} bg-white text-sm`}
                      >
                        <option value="CASH">Cash Reward</option>
                        <option value="VOUCHER">Voucher / Credits</option>
                        <option value="TROPHY">Trophy / Goodies</option>
                        <option value="OTHER">Other / Swag</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Amount / Value (₹) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 50000"
                          value={prize.amount}
                          onChange={(e) => updatePrize(index, "amount", e.target.value)}
                          className={`${inputClass} bg-white text-sm pl-8`}
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                        <span className="ml-1 text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cash plus direct interview with sponsors"
                        value={prize.description}
                        onChange={(e) => updatePrize(index, "description", e.target.value)}
                        className={`${inputClass} bg-white text-sm`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= SPONSORS ================= */}
      <section className="mt-10 space-y-4 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-700" /> Sponsors & Partners
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Optional: Add organizations or partners supporting the hackathon.
            </p>
          </div>

          <button
            type="button"
            onClick={addSponsor}
            className="flex items-center gap-1 rounded-lg border border-black bg-white px-3 py-2 text-xs font-medium text-black hover:bg-gray-100 transition cursor-pointer"
          >
            <Plus size={14} /> Add Sponsor
          </button>
        </div>

        {sponsors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500 text-sm">
            No sponsors added. If you have sponsors or community partners, click &quot;Add Sponsor&quot;.
          </div>
        ) : (
          <div className="space-y-4">
            {sponsors.map((sponsor, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Sponsor #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSponsor(index)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sponsor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google Cloud, GitHub"
                      value={sponsor.name}
                      onChange={(e) => updateSponsor(index, "name", e.target.value)}
                      className={`${inputClass} bg-white text-sm`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={sponsor.websiteUrl}
                      onChange={(e) => updateSponsor(index, "websiteUrl", e.target.value)}
                      className={`${inputClass} bg-white text-sm`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sponsor Logo
                    </label>
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs hover:border-black transition">
                      <Upload className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate">
                        {sponsor.logoFile
                          ? sponsor.logoFile.name
                          : sponsor.logoUrl
                          ? "Logo uploaded (replace)"
                          : "Upload Logo Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          updateSponsor(index, "logoFile", e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={saving || uploadingLogos}
          className="rounded-lg border border-gray-300 px-6 py-3 transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
        >
          Back
        </button>

        <button
          type="submit"
          disabled={saving || uploadingLogos}
          className="rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {uploadingLogos ? "Uploading Logos..." : saving ? "Saving..." : "Save and Next"}
        </button>
      </div>
    </form>
  );
};

export default PrizesSponsors;
