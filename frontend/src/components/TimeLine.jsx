import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const Timeline = ({
  onNext,
  onBack,
  initialData = {},
  saving = false,
}) => {
  const [dateError, setDateError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      registrationOpens: "",
      registrationCloses: "",
      hackingStartsAt: "",
      hackingEndsAt: "",
      resultAnnouncementDate: "",
      timeZone: "Asia/Kolkata",
    },
  });

  // Convert stored dates into the format datetime-local expects.
  const toLocalInput = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return typeof value === "string" ? value.slice(0, 16) : "";
    }

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  useEffect(() => {
    reset({
      registrationOpens: toLocalInput(initialData.registrationOpens),
      registrationCloses: toLocalInput(initialData.registrationCloses),
      hackingStartsAt: toLocalInput(initialData.hackingStartsAt),
      hackingEndsAt: toLocalInput(initialData.hackingEndsAt),
      resultAnnouncementDate: toLocalInput(
        initialData.resultAnnouncementDate
      ),
      timeZone: initialData.timeZone || "Asia/Kolkata",
    });
  }, [initialData, reset]);

  const onSubmit = async (values) => {
    setDateError("");

    const regOpen = new Date(values.registrationOpens);
    const regClose = new Date(values.registrationCloses);
    const resAnnounce = new Date(values.resultAnnouncementDate);

    if (regOpen >= regClose) {
      setDateError("Registration closing date must be after registration opening date.");
      return;
    }

    if (regClose > resAnnounce) {
      setDateError("Result announcement date must be on or after registration closes.");
      return;
    }

    if (values.hackingStartsAt && values.hackingEndsAt) {
      const hackStart = new Date(values.hackingStartsAt);
      const hackEnd = new Date(values.hackingEndsAt);
      if (hackStart >= hackEnd) {
        setDateError("Hacking end date must be after hacking start date.");
        return;
      }
    }

    if (onNext) {
      await onNext(values);
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
        <h2 className="text-2xl font-semibold">Timeline</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set the important dates and times for your hackathon.
        </p>
      </div>

      {dateError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {dateError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Registration Opens <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            {...register("registrationOpens", {
              required: "Registration opening date is required",
            })}
            className={inputClass}
          />
          {errors.registrationOpens && (
            <p className="mt-1 text-sm text-red-500">
              {errors.registrationOpens.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Registration Closes <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            {...register("registrationCloses", {
              required: "Registration closing date is required",
            })}
            className={inputClass}
          />
          {errors.registrationCloses && (
            <p className="mt-1 text-sm text-red-500">
              {errors.registrationCloses.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Hacking Starts At
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <input
            type="datetime-local"
            {...register("hackingStartsAt")}
            className={inputClass}
          />
          {errors.hackingStartsAt && (
            <p className="mt-1 text-sm text-red-500">
              {errors.hackingStartsAt.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Hacking Ends At
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>
          <input
            type="datetime-local"
            {...register("hackingEndsAt")}
            className={inputClass}
          />
          {errors.hackingEndsAt && (
            <p className="mt-1 text-sm text-red-500">
              {errors.hackingEndsAt.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Result Announcement Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            {...register("resultAnnouncementDate", {
              required: "Result announcement date is required",
            })}
            className={inputClass}
          />
          {errors.resultAnnouncementDate && (
            <p className="mt-1 text-sm text-red-500">
              {errors.resultAnnouncementDate.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Time Zone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Asia/Kolkata"
            {...register("timeZone", {
              required: "Time zone is required",
            })}
            className={inputClass}
          />
          {errors.timeZone && (
            <p className="mt-1 text-sm text-red-500">
              {errors.timeZone.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
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
          {saving ? "Saving..." : "Save and Next"}
        </button>
      </div>
    </form>
  );
};

export default Timeline;
