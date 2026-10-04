import React from 'react'
import { useForm } from 'react-hook-form'

const Timeline = ({ onNext, onBack }) => {

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            registrationOpens: '',
            registrationCloses: '',
            hackingStartsAt: '',
            hackingEndsAt: '',
            resultAnnouncementDate: '',
            timeZone: ''
        }
    })

    const onSubmit = (data) => {
        console.log(data)

        if (onNext) {
            onNext(data)
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-4xl mx-auto"
        >

            {/* Heading */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold">
                    Timeline
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Set the important dates and times for your hackathon.
                </p>
            </div>


            {/* Registration Opens */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Registration Opens
                </label>

                <input
                    type="datetime-local"
                    {...register('registrationOpens', {
                        required: 'Registration opening date is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.registrationOpens && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.registrationOpens.message}
                    </p>
                )}
            </div>


            {/* Registration Closes */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Registration Closes
                </label>

                <input
                    type="datetime-local"
                    {...register('registrationCloses', {
                        required: 'Registration closing date is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.registrationCloses && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.registrationCloses.message}
                    </p>
                )}
            </div>


            {/* Hacking Starts */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Hacking Starts At
                </label>

                <input
                    type="datetime-local"
                    {...register('hackingStartsAt', {
                        required: 'Hacking start date is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.hackingStartsAt && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.hackingStartsAt.message}
                    </p>
                )}
            </div>


            {/* Hacking Ends */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Hacking Ends At
                </label>

                <input
                    type="datetime-local"
                    {...register('hackingEndsAt', {
                        required: 'Hacking end date is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.hackingEndsAt && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.hackingEndsAt.message}
                    </p>
                )}
            </div>


            {/* Result Announcement */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Result Announcement Date
                </label>

                <input
                    type="datetime-local"
                    {...register('resultAnnouncementDate', {
                        required: 'Result announcement date is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.resultAnnouncementDate && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.resultAnnouncementDate.message}
                    </p>
                )}
            </div>


            {/* Time Zone */}
            <div className="mb-8">
                <label className="block mb-2 text-sm font-medium">
                    Time Zone
                </label>

                <input
                    type="text"
                    placeholder="e.g. Asia/Kolkata"
                    {...register('timeZone', {
                        required: 'Time zone is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.timeZone && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.timeZone.message}
                    </p>
                )}
            </div>


            {/* Navigation */}
            <div className="flex justify-between">

                <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                    Back
                </button>

                <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition"
                >
                    Next
                </button>

            </div>

        </form>
    )
}

export default Timeline
