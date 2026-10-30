import React, { useEffect, useState } from "react";
import {
  FormStepper,
  BasicDetails,
  TimeLine,
  Rules,
  Rounds,
  PrizesSponsors,
  Payments,
  Judges,
  ReviewPublish,
} from "../../components/componentsIndex.js";

import hackathonService from "../../backend/hackathon.js";

const unwrap = (response) => {
  let result = response;

  for (let i = 0; i < 3 && result && typeof result === "object"; i++) {
    if (result.draft && typeof result.draft === "object") {
      result = result.draft;
    } else if (result.hackathon && typeof result.hackathon === "object") {
      result = result.hackathon;
    } else if (result.data !== undefined) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
};

const getDraftId = (draft) =>
  draft?._id || draft?.id || draft?.draftId || null;

const getCloudinaryUrl = (response) => {
  const result = unwrap(response);

  const url =
    result?.secure_url ||
    result?.url ||
    result?.data?.secure_url ||
    result?.data?.url;

  if (typeof url !== "string" || !url.startsWith("http")) {
    throw new Error(
      "Upload succeeded, but no Cloudinary URL was found in the response."
    );
  }

  return url;
};

const CreateHackathon = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [draftId, setDraftId] = useState(null);
  const [draftData, setDraftData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publishedHackathon, setPublishedHackathon] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const initializeDraft = async () => {
      try {
        setError("");
        let draft = null;

        try {
          const response = await hackathonService.getLatestDraft();
          const candidate = unwrap(response);
          const candidateId = getDraftId(candidate);

          if (candidateId) {
            // Fetch full populated draft
            try {
              const fullDraftRes = await hackathonService.getDraftById(candidateId);
              draft = unwrap(fullDraftRes);
            } catch {
              draft = candidate;
            }
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.warn("Could not check latest draft:", err);
          }
        }

        if (!draft) {
          const response = await hackathonService.createDraft();
          const newDraft = unwrap(response);
          const newId = getDraftId(newDraft);

          if (newId) {
            try {
              const fullRes = await hackathonService.getDraftById(newId);
              draft = unwrap(fullRes);
            } catch {
              draft = newDraft;
            }
          } else {
            draft = newDraft;
          }
        }

        const id = getDraftId(draft);

        if (!id) {
          throw new Error("The API response did not contain a draft ID.");
        }

        if (!cancelled) {
          setDraftId(id);
          setDraftData(draft);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            err.message ||
            "Could not initialize the draft."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  // Step 0: Basic Details
  const handleBasicDetailsNext = async (values) => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let bannerUrl = draftData.banner || "";
      let logoUrl = draftData.logo || "";

      const bannerFile = values.banner?.[0];
      const logoFile = values.logo?.[0];

      if (bannerFile) {
        const response = await hackathonService.uploadFile(bannerFile, "banners");
        bannerUrl = getCloudinaryUrl(response);
      }

      if (logoFile) {
        const response = await hackathonService.uploadFile(logoFile, "logos");
        logoUrl = getCloudinaryUrl(response);
      }

      if (!bannerUrl) {
        throw new Error("Please select a banner image.");
      }

      const payload = {
        eventName: values.eventName.trim(),
        theme: values.theme.trim(),
        mode: values.mode.toUpperCase(),
        banner: bannerUrl,
        logo: logoUrl || undefined,
        address: values.address?.trim() || "",
        mapLink: values.mapLink?.trim() || "",
        organizingBody: values.organizingBody.trim(),
        shortDescription: values.shortDescription?.trim() || "",
        description: values.description.trim(),
        expectedTeamsCount: Number(values.expectedTeamsCount) || 10,
      };

      const res = await hackathonService.saveDraftStep(
        draftId,
        "BASIC_DETAILS",
        payload
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
        ...payload,
      }));

      setCurrentStep(1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save Basic Details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Timeline
  const handleTimelineNext = async (values) => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        registrationOpens: values.registrationOpens,
        registrationCloses: values.registrationCloses,
        hackingStartsAt: values.hackingStartsAt ? values.hackingStartsAt : undefined,
        hackingEndsAt: values.hackingEndsAt ? values.hackingEndsAt : undefined,
        resultAnnouncementDate: values.resultAnnouncementDate,
        timeZone: values.timeZone ? values.timeZone.trim() : "Asia/Kolkata",
      };

      const res = await hackathonService.saveDraftStep(
        draftId,
        "TIMELINE",
        payload
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
        ...payload,
      }));

      setCurrentStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save Timeline."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Rules & Eligibility
  const handleRulesNext = async (payload) => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await hackathonService.saveDraftStep(
        draftId,
        "RULES_ELIGIBILITY",
        payload
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
        ...payload,
      }));

      setCurrentStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save Rules and Guidelines."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 3: Rounds
  const handleRoundsNext = async (payload) => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await hackathonService.saveDraftStep(
        draftId,
        "ROUNDS",
        payload
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
        rounds: updated?.rounds || payload.rounds,
      }));

      setCurrentStep(4);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save Rounds configuration."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 4: Prizes & Sponsors
  const handlePrizesSponsorsNext = async (payload) => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await hackathonService.saveDraftStep(
        draftId,
        "PRIZES_SPONSORS",
        payload
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
        ...payload,
      }));

      setCurrentStep(5);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save Prizes and Sponsors."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 5: Payments
  const handlePaymentsNext = async (payload) => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await hackathonService.saveDraftStep(
        draftId,
        "PAYMENTS",
        payload
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
        ...payload,
      }));

      setCurrentStep(6);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not save Payment settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 6: Judges
  const handleJudgesNext = async () => {
    if (!draftId) {
      setError("Draft is not ready. Please try again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await hackathonService.saveDraftStep(
        draftId,
        "JUDGES",
        {}
      );
      const updated = unwrap(res);

      setDraftData((prev) => ({
        ...prev,
        ...updated,
      }));

      setCurrentStep(7);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not proceed to Review."
      );
    } finally {
      setSaving(false);
    }
  };

  // Step 7: Publish
  const handlePublish = async () => {
    if (!draftId) {
      setError("Draft is not ready.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await hackathonService.publishHackathon(draftId);
      const published = unwrap(res);
      setPublishedHackathon(published);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to publish hackathon. Please check that all required fields are complete."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center font-space">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent mb-4" />
          <p className="text-gray-600">Loading your hackathon draft...</p>
        </div>
      </div>
    );
  }

  if (!draftId) {
    return (
      <div className="mx-auto max-w-xl p-10 text-center">
        <p className="text-red-600 mb-4">{error || "Could not find or create draft."}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-black px-5 py-2.5 text-white hover:bg-gray-800 transition cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 lg:px-20 max-w-7xl mx-auto">
      <div className="font-space mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Create a New Hackathon
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure rounds, rubrics, timeline, and prizes. Draft auto-saves at each step.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <FormStepper
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          stepProgress={draftData.stepProgress || {}}
        />

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 md:p-10 shadow-xs">
          {currentStep === 0 && (
            <BasicDetails
              initialData={draftData}
              onNext={handleBasicDetailsNext}
              saving={saving}
            />
          )}

          {currentStep === 1 && (
            <TimeLine
              initialData={draftData}
              onNext={handleTimelineNext}
              onBack={() => setCurrentStep(0)}
              saving={saving}
            />
          )}

          {currentStep === 2 && (
            <Rules
              initialData={draftData}
              onNext={handleRulesNext}
              onBack={() => setCurrentStep(1)}
              saving={saving}
            />
          )}

          {currentStep === 3 && (
            <Rounds
              initialData={draftData}
              onNext={handleRoundsNext}
              onBack={() => setCurrentStep(2)}
              saving={saving}
            />
          )}

          {currentStep === 4 && (
            <PrizesSponsors
              initialData={draftData}
              onNext={handlePrizesSponsorsNext}
              onBack={() => setCurrentStep(3)}
              saving={saving}
            />
          )}

          {currentStep === 5 && (
            <Payments
              initialData={draftData}
              onNext={handlePaymentsNext}
              onBack={() => setCurrentStep(4)}
              saving={saving}
            />
          )}

          {currentStep === 6 && (
            <Judges
              draftId={draftId}
              initialData={draftData}
              onNext={handleJudgesNext}
              onBack={() => setCurrentStep(5)}
              saving={saving}
            />
          )}

          {currentStep === 7 && (
            <ReviewPublish
              draftId={draftId}
              draftData={draftData}
              onPublish={handlePublish}
              onBack={() => setCurrentStep(6)}
              onEditStep={(step) => setCurrentStep(step)}
              publishing={saving}
              publishedHackathon={publishedHackathon}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateHackathon;
