import React, { useState } from 'react';

const Rules = () => {
  const [eligibility, setEligibility] = useState('');
  const [plagiarismEnabled, setPlagiarismEnabled] = useState(false);
  const [tracks, setTracks] = useState([
    {
      name: '',
      description: '',
    },
  ]);

  const addTrack = () => {
    setTracks([
      ...tracks,
      {
        name: '',
        description: '',
      },
    ]);
  };

  const removeTrack = (index) => {
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const updateTrack = (index, field, value) => {
    const updatedTracks = [...tracks];
    updatedTracks[index][field] = value;
    setTracks(updatedTracks);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Rules & Guidelines
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Define the rules, eligibility criteria and participation
          requirements for your hackathon.
        </p>
      </div>

      <div className="space-y-6">

        {/* Team Size */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Team Size Range
          </label>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              min="1"
              placeholder="Minimum team size"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />

            <input
              type="number"
              min="1"
              placeholder="Maximum team size"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Eligibility
          </label>

          <select
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
          >
            <option value="">Select eligibility</option>
            <option value="everyone">Open to Everyone</option>
            <option value="students">Students Only</option>
            <option value="college">College Students</option>
            <option value="school">School Students</option>
            <option value="professionals">Professionals</option>
          </select>
        </div>

        {/* Plagiarism Policy */}
        <div className="flex items-center justify-between rounded-lg border border-gray-300 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Plagiarism Policy
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Enable plagiarism detection for submissions
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPlagiarismEnabled(!plagiarismEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              plagiarismEnabled
                ? 'bg-gray-900'
                : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                plagiarismEnabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Code of Conduct */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Code of Conduct
          </label>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-gray-500 transition">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload Code of Conduct
              </p>

              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC or DOCX
              </p>
            </div>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
          </label>
        </div>

        {/* Tech Stack Restrictions */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Tech Stack Restrictions
          </label>

          <textarea
            rows="3"
            placeholder="Mention any restrictions on technologies, frameworks, APIs, etc."
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
          />
        </div>

        {/* Problem Statements */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Problem Statements
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Optional)
            </span>
          </label>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-gray-500 transition">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload Problem Statements
              </p>

              <p className="text-xs text-gray-500 mt-1">
                PDF, DOC or DOCX
              </p>
            </div>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
          </label>
        </div>

        {/* Tracks */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-800">
                Tracks
              </label>

              <p className="text-xs text-gray-500 mt-1">
                Add different tracks for participants to choose from.
              </p>
            </div>

            <button
              type="button"
              onClick={addTrack}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
            >
              + Add Track
            </button>
          </div>

          <div className="space-y-4">
            {tracks.map((track, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-300 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-800">
                    Track {index + 1}
                  </h3>

                  {tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrack(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Track name"
                    value={track.name}
                    onChange={(e) =>
                      updateTrack(
                        index,
                        'name',
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                  />

                  <textarea
                    rows="3"
                    placeholder="Track description"
                    value={track.description}
                    onChange={(e) =>
                      updateTrack(
                        index,
                        'description',
                        e.target.value
                      )
                    }
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Rules;
