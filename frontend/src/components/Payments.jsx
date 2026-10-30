import React, { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import hackathonService from "../backend/hackathon.js";

const Payments = ({
  initialData = {},
  onNext,
  onBack,
  saving = false,
}) => {
  const [paid, setPaid] = useState(false);
  const [feeCollectedInRound, setFeeCollectedInRound] = useState(1);
  const [feeAmount, setFeeAmount] = useState(0);
  const [refundPolicyText, setRefundPolicyText] = useState(
    "Full refund if cancellation requested at least 48 hours before registration closes. Non-refundable thereafter."
  );
  const [refundPolicyFile, setRefundPolicyFile] = useState(null);
  const [error, setError] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (initialData.paid !== undefined) {
      setPaid(Boolean(initialData.paid));
    }
    if (initialData.feeCollectedInRound !== undefined) {
      setFeeCollectedInRound(Number(initialData.feeCollectedInRound) || 1);
    }
    if (initialData.feeAmount !== undefined) {
      setFeeAmount(Number(initialData.feeAmount) || 0);
    }
    if (initialData.refundPolicy) {
      setRefundPolicyText(initialData.refundPolicy);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (paid && Number(feeAmount) <= 0) {
      setError("Please specify a valid registration fee amount greater than 0 for paid hackathons.");
      return;
    }

    try {
      setUploadingDoc(true);
      let finalRefundPolicy = refundPolicyText.trim();

      if (refundPolicyFile) {
        const uploadRes = await hackathonService.uploadFile(
          refundPolicyFile,
          "documents"
        );
        const uploadedUrl =
          uploadRes?.data?.url ||
          uploadRes?.data?.secure_url ||
          uploadRes?.url ||
          uploadRes?.secure_url;
        if (uploadedUrl) {
          finalRefundPolicy = uploadedUrl;
        }
      }

      const payload = {
        paid: Boolean(paid),
        feeCollectedInRound: paid ? Number(feeCollectedInRound) || 1 : 1,
        feeAmount: paid ? Number(feeAmount) || 0 : 0,
        refundPolicy: finalRefundPolicy || undefined,
      };

      if (onNext) {
        await onNext(payload);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to save payment settings."
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
          Registration & Payments
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Decide whether your hackathon is free for participants or requires a registration fee.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Paid / Free Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-300 p-5">
          <div>
            <p className="text-base font-medium text-gray-900">
              Paid Registration
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Enable this if teams must pay an entry fee to participate.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaid(!paid)}
            className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${
              paid ? "bg-black" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                paid ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Conditional Payment Fields */}
        {paid ? (
          <div className="space-y-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Registration Fee Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={feeAmount || ""}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    className={`${inputClass} bg-white pl-9`}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Per team registration fee.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Fee Collected In Round Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={feeCollectedInRound}
                  onChange={(e) => setFeeCollectedInRound(e.target.value)}
                  className={`${inputClass} bg-white`}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Usually Round 1 (at registration time).
                </p>
              </div>
            </div>

            {/* Refund Policy */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Refund Policy Details
              </label>
              <textarea
                rows={3}
                placeholder="State your refund policy terms..."
                value={refundPolicyText}
                onChange={(e) => setRefundPolicyText(e.target.value)}
                className={`${inputClass} bg-white text-sm resize-none`}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            <span className="font-semibold">Free Entry Hackathon:</span> Participants can register and participate without any fee.
          </div>
        )}

        {/* Optional Upload Policy Document */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Upload Policy / Terms Document (Optional)
          </label>
          <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-6 text-center hover:border-black transition">
            <div className="flex flex-col items-center">
              <Upload className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {refundPolicyFile
                  ? refundPolicyFile.name
                  : "Upload PDF or DOC of Payment & Refund Guidelines"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, DOC or DOCX up to 10MB
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setRefundPolicyFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
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
          {uploadingDoc ? "Uploading..." : saving ? "Saving..." : "Save and Next"}
        </button>
      </div>
    </form>
  );
};

export default Payments;
