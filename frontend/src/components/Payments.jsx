import React, { useState } from 'react';

const Payments = () => {
  const [paid, setPaid] = useState(false);
  const [feeRound, setFeeRound] = useState('');

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Payments
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Configure registration fees and refund details for your
          hackathon.
        </p>
      </div>

      <div className="space-y-6">

        {/* Paid / Free */}
        <div className="flex items-center justify-between rounded-lg border border-gray-300 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-gray-800">
              Paid Participation
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Enable this if participants need to pay a registration fee.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaid(!paid)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              paid ? 'bg-gray-900' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                paid
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Conditional Payment Fields */}
        {paid && (
          <div className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-5">

            {/* Fee Before Round */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Fee Will Be Collected Before
              </label>

              <select
                value={feeRound}
                onChange={(e) => setFeeRound(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
              >
                <option value="">
                  Select round
                </option>

                <option value="registration">
                  Registration
                </option>

                <option value="idea-submission">
                  Idea Submission
                </option>

                <option value="shortlisting">
                  Shortlisting
                </option>

                <option value="final-round">
                  Final Round
                </option>

                <option value="hackathon">
                  Hackathon
                </option>
              </select>
            </div>

            {/* Fee Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Fee Amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ₹
                </span>

                <input
                  type="number"
                  min="0"
                  placeholder="Enter registration fee"
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-9 pr-4 outline-none focus:border-gray-500"
                />
              </div>
            </div>

          </div>
        )}

        {/* Refund Policy */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Refund Policy
          </label>

          <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition hover:border-gray-500">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Upload Refund Policy
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

      </div>
    </div>
  );
};

export default Payments;
