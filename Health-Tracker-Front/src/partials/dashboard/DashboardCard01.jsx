import React, { useState, useEffect } from "react";
import axios from "axios";

function DashboardCard01() {
  const [weeklyData, setWeeklyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSteps, setNewSteps] = useState("");
  const token = localStorage.getItem("token");

  const fetchWeeklySteps = async () => {
    try {
      const response = await axios.get("https://localhost:7094/api/StepsChart", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      const weeklyAverage =
        data.length > 0 ? data.reduce((sum, day) => sum + day.steps, 0) / data.length : 0;

      setWeeklyData({
        steps: data,
        weeklyAverage,
        startDate: data[0]?.date,
        endDate: data[data.length - 1]?.date,
      });

      // Set today's steps if available
      const today = new Date().toDateString();
      const todayEntry = data.find((day) => new Date(day.date).toDateString() === today);
      setNewSteps(todayEntry ? todayEntry.steps.toString() : "");
    } catch (err) {
      setError(err.response?.data || "Haftalık adım verisi alınamadı.");
      console.error("Error fetching weekly steps:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitSteps = async () => {
    if (!newSteps || isNaN(newSteps) || parseInt(newSteps) < 0) {
      setError("Lütfen geçerli bir adım sayısı girin.");
      return;
    }

    try {
      const steps = parseInt(newSteps);
      await axios.post(
        "https://localhost:7094/api/StepsChart",
        { steps },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setError(null);
      fetchWeeklySteps(); // Refresh data after submission
    } catch (err) {
      setError(err.response?.data || "Adım sayısı kaydedilemedi.");
      console.error("Error submitting steps:", err);
    }
  };

  useEffect(() => {
    fetchWeeklySteps();
  }, [token]);

  // Helper to format date as "DayOfWeek, DD MMM"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Haftalık Adım Takibi</h2>
      </header>
      <div className="p-3">
        {isLoading ? (
          <div className="text-center text-gray-500">Yükleniyor...</div>
        ) : error ? (
          <div className="text-center text-red-500">Hata: {error}</div>
        ) : weeklyData ? (
          <>
            <div>
              <header className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-xs font-semibold p-2">
                Bu Hafta ({formatDate(weeklyData.startDate)} -{" "}
                {formatDate(weeklyData.endDate)})
              </header>
              <ul className="my-1">
                {weeklyData.steps.map((day, index) => (
                  <li key={index} className="flex px-2">
                    <div
                      className={`w-9 h-9 rounded-full shrink-0 my-2 mr-3 ${
                        day.steps > 0 ? "bg-green-500" : "bg-gray-200"
                      }`}
                    >
                      <svg
                        className={`w-9 h-9 fill-current ${
                          day.steps > 0 ? "text-white" : "text-gray-400"
                        }`}
                        viewBox="0 0 36 36"
                      >
                        {day.steps > 0 ? (
                          <path d="M18.3 11.3l-1.4 1.4 4.3 4.3H11v2h10.2l-4.3 4.3 1.4 1.4L25 18z" />
                        ) : (
                          <path d="M21.477 22.89l-8.368-8.367a6 6 0 008.367 8.367zm1.414-1.413a6 6 0 00-8.367-8.367l8.367 8.367zM18 26a8 8 0 110-16 8 8 0 010 16z" />
                        )}
                      </svg>
                    </div>
                    <div className="grow flex items-center border-b border-gray-100 dark:border-gray-700/60 text-sm py-2">
                      <div className="grow flex justify-between">
                        <div className="self-center">
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {formatDate(day.date)}
                          </span>
                        </div>
                        <div className="shrink-0 self-start ml-2">
                          <span
                            className={`font-medium ${
                              day.steps > 0 ? "text-green-600" : "text-gray-800 dark:text-gray-100"
                            }`}
                          >
                            {day.steps.toLocaleString()} adım
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {/* Weekly Average */}
                <li className="flex px-2">
                  <div className="w-9 h-9 rounded-full shrink-0 bg-violet-500 my-2 mr-3">
                    <svg className="w-9 h-9 fill-current text-white" viewBox="0 0 36 36">
                      <path d="M18 10a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                    </svg>
                  </div>
                  <div className="grow flex items-center text-sm py-2">
                    <div className="grow flex justify-between">
                      <div className="self-center">
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          Haftalık Ortalama
                        </span>
                      </div>
                      <div className="shrink-0 self-start ml-2">
                        <span className="font-medium text-violet-600">
                          {weeklyData.weeklyAverage.toFixed(2)} adım
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Daily Step Input */}
            <div className="mt-4 px-2 flex flex-col sm:flex-row items-center gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Bugün ({formatDate(new Date())})
              </div>
              <input
                type="number"
                value={newSteps}
                onChange={(e) => setNewSteps(e.target.value)}
                placeholder="Adım sayısını girin"
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-32"
              />
              <button
                onClick={submitSteps}
                className="px-3 py-1 bg-violet-500 text-white rounded text-sm hover:bg-violet-600"
              >
                Kaydet
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">Veri bulunamadı.</div>
        )}
      </div>
    </div>
  );
}

export default DashboardCard01;