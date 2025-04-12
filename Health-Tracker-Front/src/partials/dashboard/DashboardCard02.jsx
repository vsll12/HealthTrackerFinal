import React, { useState, useEffect } from "react";
import axios from "axios";

function DashboardCard02() {
  const [weeklyData, setWeeklyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCalories, setNewCalories] = useState("");
  const token = localStorage.getItem("token");

  const fetchWeeklyCalories = async () => {
    try {
      const response = await axios.get("https://localhost:7094/api/CaloriesChart", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      const weeklyAverage =
        data.length > 0 ? data.reduce((sum, day) => sum + day.calories, 0) / data.length : 0;

      setWeeklyData({
        calories: data,
        weeklyAverage,
        startDate: data[0]?.date,
        endDate: data[data.length - 1]?.date,
      });

      const today = new Date().toDateString();
      const todayEntry = data.find((day) => new Date(day.date).toDateString() === today);
      setNewCalories(todayEntry ? todayEntry.calories.toString() : "");
    } catch (err) {
      setError(err.response?.data || "Haftalık kalori verisi alınamadı.");
      console.error("Error fetching weekly calories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitCalories = async () => {
    if (!newCalories || isNaN(newCalories) || parseInt(newCalories) < 0) {
      setError("Lütfen geçerli bir kalori miktarı girin.");
      return;
    }

    try {
      const calories = parseInt(newCalories);
      await axios.post(
        "https://localhost:7094/api/CaloriesChart",
        { calories },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setError(null);
      fetchWeeklyCalories();
    } catch (err) {
      setError(err.response?.data || "Kalori miktarı kaydedilemedi.");
      console.error("Error submitting calories:", err);
    }
  };

  useEffect(() => {
    fetchWeeklyCalories();
  }, [token]);

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
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Haftalık Kalori Tüketimi</h2>
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
                {weeklyData.calories.map((day, index) => (
                  <li key={index} className="flex px-2">
                    <div
                      className={`w-9 h-9 rounded-full shrink-0 my-2 mr-3 ${
                        day.calories > 0 ? "bg-green-500" : "bg-gray-200"
                      }`}
                    >
                      <svg
                        className={`w-9 h-9 fill-current ${
                          day.calories > 0 ? "text-white" : "text-gray-400"
                        }`}
                        viewBox="0 0 36 36"
                      >
                        {day.calories > 0 ? (
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
                              day.calories > 0 ? "text-green-600" : "text-gray-800 dark:text-gray-100"
                            }`}
                          >
                            {day.calories} kcal
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
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
                          {weeklyData.weeklyAverage.toFixed(2)} kcal
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div className="mt-4 px-2 flex flex-col sm:flex-row items-center gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Bugün ({formatDate(new Date())})
              </div>
              <input
                type="number"
                value={newCalories}
                onChange={(e) => setNewCalories(e.target.value)}
                placeholder="Kalori miktarını girin"
                className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 w-32"
              />
              <button
                onClick={submitCalories}
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

export default DashboardCard02;