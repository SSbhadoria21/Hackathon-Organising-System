
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
} from "../../components/componentsIndex.js";

import hackathonService from "../../backend/hackathon.js";

const unwrap = (response) => {
  let result = response;

  for (let i = 0; i < 3 && result && typeof result === "object"; i++) {
    if (result.draft && typeof result.draft === "object") {
      result = result.draft;
    } else if (
      result.hackathon &&
      typeof result.hackathon === "object"
    ) {
      result = result.hackathon;
    } else if (result.data && typeof result.data === "object") {
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

  useEffect(() => {
    let cancelled = false;

    const initializeDraft = async () => {
      try {
        setError("");

        let draft = null;

        try {
          const response = await hackathonService.getLatestDraft();
          const candidate = unwrap(response);

          if (getDraftId(candidate)) {
            draft = candidate;
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            throw err;
          }
        }

        if (!draft) {
          const response = await hackathonService.createDraft();
          draft = unwrap(response);
        }

        const id = getDraftId(draft);

        if (!id) {
          throw new Error(
            "The API response did not contain a draft ID."
          );
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

      // Upload only newly selected files.
      if (bannerFile) {
        const response = await hackathonService.uploadFile(bannerFile);
        bannerUrl = getCloudinaryUrl(response);
      }

      if (logoFile) {
        const response = await hackathonService.uploadFile(logoFile);
        logoUrl = getCloudinaryUrl(response);
      }

      if (!bannerUrl) {
        throw new Error("Please select a banner image.");
      }

      if (!logoUrl) {
        throw new Error("Please select a logo image.");
      }

      const payload = {
        eventName: values.eventName.trim(),
        theme: values.theme.trim(),
        mode: values.mode.toUpperCase(),
        banner: bannerUrl,
        logo: logoUrl,
        address: values.address?.trim() || "",
        mapLink: values.mapLink?.trim() || "",
        organizingBody: values.organizingBody.trim(),
        shortDescription: values.shortDescription.trim(),
        description: values.description.trim(),
        expectedTeamsCount: Number(values.expectedTeamsCount),
      };

      await hackathonService.saveDraftStep(
        draftId,
        "BASIC_DETAILS",
        payload
      );

      setDraftData((previous) => ({
        ...previous,
        ...payload,
      }));

      setCurrentStep(1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not upload or save Basic Details."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-15 pl-20">Loading your draft...</div>;
  }

  if (!draftId) {
    return (
      <div className="p-15 pl-20">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-15 pl-20">
      <div className="font-space">
        <h1 className="text-3xl font-bold">
          Start Creating a New Hackathon
        </h1>
        <p className="text-sm text-gray-600">
          Start filling out the form and save as draft anytime!
        </p>
      </div>

      <div className="min-h-screen p-8">
        <div className="mx-auto max-w-5xl">
          <FormStepper
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-10">
            {currentStep === 0 && (
              <BasicDetails
                initialData={draftData}
                onNext={handleBasicDetailsNext}
                saving={saving}
              />
            )}

            {currentStep === 1 && <TimeLine />}
            {currentStep === 2 && <Rules />}
            {currentStep === 3 && <Rounds />}
            {currentStep === 4 && <PrizesSponsors />}
            {currentStep === 5 && <Payments />}
            {currentStep === 6 && <Judges />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathon;
