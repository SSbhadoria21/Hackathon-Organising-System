import React, { useState } from 'react';

const PrizesSponsors = () => {
  const [prizes, setPrizes] = useState([
    {
      title: '',
      type: '',
      amount: '',
      description: '',
    },
  ]);

  const [sponsors, setSponsors] = useState([
    {
      logo: null,
      websiteUrl: '',
    },
  ]);

  // ---------------- PRIZES ----------------

  const addPrize = () => {
    setPrizes([
      ...prizes,
      {
        title: '',
        type: '',
        amount: '',
        description: '',
      },
    ]);
  };

  const removePrize = (index) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index, field, value) => {
    const updatedPrizes = [...prizes];

    updatedPrizes[index][field] = value;

    setPrizes(updatedPrizes);
  };

  // ---------------- SPONSORS ----------------

  const addSponsor = () => {
    setSponsors([
      ...sponsors,
      {
        logo: null,
        websiteUrl: '',
      },
    ]);
  };

  const removeSponsor = (index) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const updateSponsor = (index, field, value) => {
    const updatedSponsors = [...sponsors];

    updatedSponsors[index][field] = value;

    setSponsors(updatedSponsors);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Prizes & Sponsors
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Add the prizes and sponsors for your hackathon.
        </p>
      </div>

      <div className="space-y-10">

        {/* ================= PRIZES ================= */}

        <section>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Prizes
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Add prizes that participants can win.
              </p>
            </div>

            <button
              type="button"
              onClick={addPrize}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
            >
              + Add Prize
            </button>
          </div>

          <div className="space-y-4">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-300 p-5"
              >
                {/* Prize Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-800">
                    Prize {index + 1}
                  </h4>

                  {prizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrize(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prize Title
                    </label>

                    <input
                      type="text"
                      placeholder="e.g. Grand Prize"
                      value={prize.title}
                      onChange={(e) =>
                        updatePrize(
                          index,
                          'title',
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Type + Amount */}
                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prize Type
                      </label>

                      <select
                        value={prize.type}
                        onChange={(e) =>
                          updatePrize(
                            index,
                            'type',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
                      >
                        <option value="">
                          Select type
                        </option>

                        <option value="cash">
                          Cash
                        </option>

                        <option value="voucher">
                          Voucher
                        </option>

                        <option value="trophy">
                          Trophy
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. ₹50,000"
                        value={prize.amount}
                        onChange={(e) =>
                          updatePrize(
                            index,
                            'amount',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                      />
                    </div>

                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>

                    <textarea
                      rows="3"
                      placeholder="Describe what the winner will receive..."
                      value={prize.description}
                      onChange={(e) =>
                        updatePrize(
                          index,
                          'description',
                          e.target.value
                        )
                      }
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SPONSORS ================= */}

        <section>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sponsors
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Add organizations sponsoring your hackathon.
              </p>
            </div>

            <button
              type="button"
              onClick={addSponsor}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
            >
              + Add Sponsor
            </button>
          </div>

          <div className="space-y-4">
            {sponsors.map((sponsor, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-300 p-5"
              >

                {/* Sponsor Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-800">
                    Sponsor {index + 1}
                  </h4>

                  {sponsors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSponsor(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">

                  {/* Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sponsor Logo
                    </label>

                    <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center hover:border-gray-500 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Upload Sponsor Logo
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, JPEG or SVG
                        </p>
                      </div>

                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        onChange={(e) =>
                          updateSponsor(
                            index,
                            'logo',
                            e.target.files[0]
                          )
                        }
                      />
                    </label>
                  </div>

                  {/* Website URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>

                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={sponsor.websiteUrl}
                      onChange={(e) =>
                        updateSponsor(
                          index,
                          'websiteUrl',
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default PrizesSponsors;
