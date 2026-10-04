
import React from 'react'
import { useForm } from 'react-hook-form'

const BasicDetails = ({ onNext }) => {

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        defaultValues: {
            eventName: '',
            theme: '',
            mode: '',
            banner: null,
            logo: null,
            address: '',
            mapLink: '',
            organisingBody: '',
            description: '',
            shortDescription: '',
            expectedTeamCount: ''
        }
    })

    const mode = watch('mode')

    const onSubmit = (data) => {
        console.log(data)

        // Send data to parent
        if (onNext) {
            onNext(data)
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-4xl mx-auto"
        >

            <div className="mb-8">
                <h2 className="text-2xl font-semibold">
                    Basic Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Tell us the basic information about your hackathon.
                </p>
            </div>


            {/* Event Name */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Event Name
                </label>

                <input
                    type="text"
                    placeholder="Enter event name"
                    {...register('eventName', {
                        required: 'Event name is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.eventName && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.eventName.message}
                    </p>
                )}
            </div>


            {/* Theme */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Theme
                </label>

                <input
                    type="text"
                    placeholder="e.g. AI for Social Good"
                    {...register('theme', {
                        required: 'Theme is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.theme && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.theme.message}
                    </p>
                )}
            </div>


            {/* Mode */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Mode
                </label>

                <select
                    {...register('mode', {
                        required: 'Please select the event mode'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black bg-white"
                >
                    <option value="">
                        Select mode
                    </option>

                    <option value="hybrid">
                        Hybrid
                    </option>

                    <option value="offline">
                        Offline
                    </option>

                    <option value="online">
                        Online
                    </option>
                </select>

                {errors.mode && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.mode.message}
                    </p>
                )}
            </div>


            {/* Banner */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Banner
                </label>

                <input
                    type="file"
                    accept="image/*"
                    {...register('banner', {
                        required: 'Banner is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />

                {errors.banner && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.banner.message}
                    </p>
                )}
            </div>


            {/* Logo */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Logo
                </label>

                <input
                    type="file"
                    accept="image/*"
                    {...register('logo', {
                        required: 'Logo is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />

                {errors.logo && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.logo.message}
                    </p>
                )}
            </div>


            {/* Address */}
            {(mode === 'hybrid' || mode === 'offline') && (
                <div className="mb-5">
                    <label className="block mb-2 text-sm font-medium">
                        Address
                    </label>

                    <input
                        type="text"
                        placeholder="Enter venue address"
                        {...register('address', {
                            required: 'Address is required for offline or hybrid events'
                        })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />

                    {errors.address && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.address.message}
                        </p>
                    )}
                </div>
            )}


            {/* Map Link */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Map Link
                </label>

                <input
                    type="text"
                    placeholder="Paste Google Maps link"
                    {...register('mapLink')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
            </div>


            {/* Organising Body */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Organising Body
                </label>

                <input
                    type="text"
                    placeholder="Enter organising body"
                    {...register('organisingBody', {
                        required: 'Organising body is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.organisingBody && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.organisingBody.message}
                    </p>
                )}
            </div>


            {/* Short Description */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Short Description
                </label>

                <input
                    type="text"
                    placeholder="A short summary of your hackathon"
                    {...register('shortDescription', {
                        required: 'Short description is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.shortDescription && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.shortDescription.message}
                    </p>
                )}
            </div>


            {/* Description */}
            <div className="mb-5">
                <label className="block mb-2 text-sm font-medium">
                    Description
                </label>

                <textarea
                    rows={7}
                    placeholder="Describe your hackathon in detail..."
                    {...register('description', {
                        required: 'Description is required'
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black resize-y"
                />

                {errors.description && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.description.message}
                    </p>
                )}
            </div>


            {/* Expected Team Count */}
            <div className="mb-8">
                <label className="block mb-2 text-sm font-medium">
                    Expected Team Count
                </label>

                <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    {...register('expectedTeamCount', {
                        required: 'Expected team count is required',
                        valueAsNumber: true,
                        min: {
                            value: 1,
                            message: 'Team count must be at least 1'
                        }
                    })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />

                {errors.expectedTeamCount && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.expectedTeamCount.message}
                    </p>
                )}
            </div>


            {/* Next */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800 transition"
                >
                    Next
                </button>
            </div>

        </form>
    )
}

export default BasicDetails

