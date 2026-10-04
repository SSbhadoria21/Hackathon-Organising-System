import React, { useState } from 'react';

const Round = () => {
  const [roundType, setRoundType] = useState('SUBMISSION');

  const [criteria, setCriteria] = useState([
    {
      name: '',
      weight: '',
      description: '',
    },
  ]);

  const [quizQuestions, setQuizQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      marks: '',
      timeLimitSeconds: '',
    },
  ]);

  // ---------------- CRITERIA ----------------

  const addCriteria = () => {
    setCriteria([
      ...criteria,
      {
        name: '',
        weight: '',
        description: '',
      },
    ]);
  };

  const removeCriteria = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriteria = (index, field, value) => {
    const updated = [...criteria];
    updated[index][field] = value;
    setCriteria(updated);
  };

  // ---------------- QUIZ QUESTIONS ----------------

  const addQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        marks: '',
        timeLimitSeconds: '',
      },
    ]);
  };

  const removeQuestion = (index) => {
    setQuizQuestions(
      quizQuestions.filter((_, i) => i !== index)
    );
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...quizQuestions];

    updated[index][field] = value;

    setQuizQuestions(updated);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updated = [...quizQuestions];

    updated[questionIndex].options[optionIndex] = value;

    setQuizQuestions(updated);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Create Round
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Configure the round, evaluation criteria and advancement
          rules for your hackathon.
        </p>
      </div>

      <div className="space-y-6">

        {/* ================= BASIC DETAILS ================= */}

        <section className="space-y-5">

          <h3 className="text-lg font-semibold text-gray-900">
            Round Details
          </h3>

          {/* Round Name */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Round Name
            </label>

            <input
              type="text"
              placeholder="e.g. Idea Submission"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />
          </div>

          {/* Round Number + Type */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Round Number
              </label>

              <input
                type="number"
                min="1"
                placeholder="e.g. 1"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Round Type
              </label>

              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
              >
                <option value="SUBMISSION">
                  Submission
                </option>

                <option value="QUIZ">
                  Quiz
                </option>

                <option value="PROTOTYPE">
                  Prototype
                </option>

                <option value="PITCH">
                  Pitch
                </option>
              </select>
            </div>

          </div>

          {/* Round Opens / Closes */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Round Opens
              </label>

              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Round Closes
              </label>

              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

          </div>

          {/* Max Teams Advancing */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Maximum Teams Advancing
            </label>

            <input
              type="number"
              min="1"
              placeholder="Number of teams"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />
          </div>

        </section>

        {/* ================= AI & SCORING ================= */}

        <section className="border-t border-gray-200 pt-6 space-y-5">

          <h3 className="text-lg font-semibold text-gray-900">
            Scoring
          </h3>

          {/* AI Weightage */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              AI Weightage
            </label>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                placeholder="0.5"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />

              <span className="text-sm text-gray-500 whitespace-nowrap">
                0 - 1
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Weight assigned to AI-based evaluation.
            </p>
          </div>

          {/* Score Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Score Threshold
              <span className="ml-2 text-xs font-normal text-gray-500">
                (Optional)
              </span>
            </label>

            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 60"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />

            <p className="text-xs text-gray-500 mt-1">
              Minimum score required to qualify for the next round.
            </p>
          </div>

        </section>

        {/* ================= CRITERIA ================= */}

        <section className="border-t border-gray-200 pt-6">

          <div className="flex items-start justify-between mb-4">

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Evaluation Criteria
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Define how participants will be evaluated.
              </p>
            </div>

            <button
              type="button"
              onClick={addCriteria}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
            >
              + Add Criteria
            </button>

          </div>

          <div className="space-y-4">

            {criteria.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-300 p-5"
              >

                <div className="flex items-center justify-between mb-4">

                  <h4 className="text-sm font-medium text-gray-800">
                    Criteria {index + 1}
                  </h4>

                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriteria(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}

                </div>

                <div className="space-y-4">

                  {/* Name + Weight */}
                  <div className="grid grid-cols-2 gap-4">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>

                      <input
                        type="text"
                        placeholder="e.g. Innovation"
                        value={item.name}
                        onChange={(e) =>
                          updateCriteria(
                            index,
                            'name',
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight
                      </label>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 30"
                          value={item.weight}
                          onChange={(e) =>
                            updateCriteria(
                              index,
                              'weight',
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 outline-none focus:border-gray-500"
                        />

                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          %
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Description */}
                  <div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>

                    <textarea
                      rows="3"
                      placeholder="Describe what judges should look for..."
                      value={item.description}
                      onChange={(e) =>
                        updateCriteria(
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

        {/* ================= QUIZ QUESTIONS ================= */}

        {roundType === 'QUIZ' && (
          <section className="border-t border-gray-200 pt-6">

            <div className="flex items-start justify-between mb-4">

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Quiz Questions
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Add questions and configure their scoring.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                + Add Question
              </button>

            </div>

            <div className="space-y-5">

              {quizQuestions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-300 p-5"
                >

                  <div className="flex items-center justify-between mb-4">

                    <h4 className="text-sm font-medium text-gray-800">
                      Question {index + 1}
                    </h4>

                    {quizQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}

                  </div>

                  <div className="space-y-4">

                    {/* Question */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>

                      <textarea
                        rows="2"
                        placeholder="Enter your question..."
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(
                            index,
                            'question',
                            e.target.value
                          )
                        }
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                      />
                    </div>

                    {/* Options */}
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>

                      <div className="space-y-3">

                        {question.options.map(
                          (option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-3"
                            >

                              <input
                                type="radio"
                                name={`correct-${index}`}
                                checked={
                                  question.correctIndex ===
                                  optionIndex
                                }
                                onChange={() =>
                                  updateQuestion(
                                    index,
                                    'correctIndex',
                                    optionIndex
                                  )
                                }
                              />

                              <input
                                type="text"
                                placeholder={`Option ${
                                  optionIndex + 1
                                }`}
                                value={option}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                              />

                            </div>
                          )
                        )}

                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Select the radio button beside the correct answer.
                      </p>

                    </div>

                    {/* Marks + Time */}
                    <div className="grid grid-cols-2 gap-4">

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marks
                        </label>

                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={question.marks}
                          onChange={(e) =>
                            updateQuestion(
                              index,
                              'marks',
                              e.target.value
                            )
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            (Optional)
                          </span>
                        </label>

                        <div className="relative">

                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 60"
                            value={
                              question.timeLimitSeconds
                            }
                            onChange={(e) =>
                              updateQuestion(
                                index,
                                'timeLimitSeconds',
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 outline-none focus:border-gray-500"
                          />

                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            seconds
                          </span>

                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              ))}

            </div>

          </section>
        )}

      </div>
    </div>
  );
};

export default Round;
