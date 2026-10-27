
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";

const BasicDetails = ({
  onNext,
  initialData = {},
  saving = false,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      eventName: "",
      theme: "",
      mode: "",
      banner: null,
      logo: null,
      address: "",
      mapLink: "",
      organizingBody: "",
      description: "",
      shortDescription: "",
      expectedTeamsCount: "",
    },
  });

  useEffect(() => {
    reset({
      eventName: initialData.eventName || "",
      theme: initialData.theme || "",
      mode: (initialData.mode || "").toLowerCase(),
      banner: null,
      logo: null,
      address: initialData.address || "",
      mapLink: initialData.mapLink || "",
      organizingBody:
        initialData.organizingBody ||
        initialData.organisingBody ||
        "",
      description: initialData.description || "",
      shortDescription: initialData.shortDescription || "",
      expectedTeamsCount:
        initialData.expectedTeamsCount ??
        initialData.expectedTeamCount ??
        "",
    });
  }, [initialData, reset]);

  const mode = watch("mode");

  const onSubmit = async (data) => {
    if (onNext) {
      await onNext(data);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-4xl"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Basic Details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us the basic information about your hackathon.
        </p>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Event Name
        </label>
        <input
          {...register("eventName", {
            required: "Event name is required",
          })}
          placeholder="Enter event name"
          className={inputClass}
        />
        {errors.eventName && (
          <p className="mt-1 text-sm text-red-500">
            {errors.eventName.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Theme
        </label>
        <input
          {...register("theme", {
            required: "Theme is required",
          })}
          placeholder="e.g. AI for Social Good"
          className={inputClass}
        />
        {errors.theme && (
          <p className="mt-1 text-sm text-red-500">
            {errors.theme.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Mode
        </label>
        <select
          {...register("mode", {
            required: "Please select the event mode",
          })}
          className={`${inputClass} bg-white`}
        >
          <option value="">Select mode</option>
          <option value="hybrid">Hybrid</option>
          <option value="offline">Offline</option>
          <option value="online">Online</option>
        </select>
        {errors.mode && (
          <p className="mt-1 text-sm text-red-500">
            {errors.mode.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Banner
        </label>

        {initialData.banner && (
          <img
            src={initialData.banner}
            alt="Current banner"
            className="mb-3 h-36 w-full rounded-lg object-cover"
          />
        )}

        <input
          type="file"
          accept="image/*"
          {...register("banner", {
            validate: (files) =>
              files?.length > 0 ||
              initialData.banner ||
              "Banner is required",
          })}
          className={inputClass}
        />

        {errors.banner && (
          <p className="mt-1 text-sm text-red-500">
            {errors.banner.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Logo
        </label>

        {initialData.logo && (
          <img
            src={initialData.logo}
            alt="Current logo"
            className="mb-3 h-24 w-24 rounded-lg object-cover"
          />
        )}

        <input
          type="file"
          accept="image/*"
          {...register("logo", {
            validate: (files) =>
              files?.length > 0 ||
              initialData.logo ||
              "Logo is required",
          })}
          className={inputClass}
        />

        {errors.logo && (
          <p className="mt-1 text-sm text-red-500">
            {errors.logo.message}
          </p>
        )}
      </div>

      {(mode === "hybrid" || mode === "offline") && (
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium">
            Address
          </label>
          <input
            {...register("address", {
              required:
                "Address is required for offline or hybrid events",
            })}
            placeholder="Enter venue address"
            className={inputClass}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-500">
              {errors.address.message}
            </p>
          )}
        </div>
      )}

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Map Link
        </label>
        <input
          type="url"
          {...register("mapLink")}
          placeholder="Paste Google Maps link"
          className={inputClass}
        />
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Organising Body
        </label>
        <input
          {...register("organizingBody", {
            required: "Organising body is required",
          })}
          placeholder="Enter organising body"
          className={inputClass}
        />
        {errors.organizingBody && (
          <p className="mt-1 text-sm text-red-500">
            {errors.organizingBody.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Short Description
        </label>
        <input
          {...register("shortDescription", {
            required: "Short description is required",
          })}
          placeholder="A short summary of your hackathon"
          className={inputClass}
        />
        {errors.shortDescription && (
          <p className="mt-1 text-sm text-red-500">
            {errors.shortDescription.message}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">
          Description
        </label>
        <textarea
          rows={7}
          {...register("description", {
            required: "Description is required",
          })}
          placeholder="Describe your hackathon in detail..."
          className={`${inputClass} resize-y`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium">
          Expected Team Count
        </label>
        <input
          type="number"
          min="1"
          {...register("expectedTeamsCount", {
            required: "Expected team count is required",
            valueAsNumber: true,
            min: {
              value: 1,
              message: "Team count must be at least 1",
            },
          })}
          placeholder="e.g. 50"
          className={inputClass}
        />
        {errors.expectedTeamsCount && (
          <p className="mt-1 text-sm text-red-500">
            {errors.expectedTeamsCount.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Uploading & Saving..." : "Save and Next"}
        </button>
      </div>
    </form>
  );
};

export default BasicDetails;
