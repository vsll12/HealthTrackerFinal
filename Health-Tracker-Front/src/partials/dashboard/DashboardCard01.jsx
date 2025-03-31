import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LineChart from "../../charts/LineChart01";
import { chartAreaGradient } from "../../charts/ChartjsConfig";
import EditMenu from "../../components/DropdownEditMenu";
import axios from "axios";
import { adjustColorOpacity, getCssVariable } from "../../utils/Utils";

function DashboardCard01() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      data: [],
      fill: true,
      backgroundColor: function (context) {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        return chartAreaGradient(ctx, chartArea, [
          {
            stop: 0,
            color: adjustColorOpacity(getCssVariable("--color-violet-500"), 0),
          },
          {
            stop: 1,
            color: adjustColorOpacity(getCssVariable("--color-violet-500"), 0.2),
          },
        ]);
      },
      borderColor: getCssVariable("--color-violet-500"),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
      pointBackgroundColor: getCssVariable("--color-violet-500"),
      pointHoverBackgroundColor: getCssVariable("--color-violet-500"),
      pointBorderWidth: 0,
      pointHoverBorderWidth: 0,
      clip: 20,
      tension: 0.2,
    }],
  });
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await axios.get("https://localhost:7094/api/ChartData");
      const data = response.data;
      setChartData({
        labels: data.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [{
          ...chartData.datasets[0],
          data: data.map(item => item.value),
        }],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const addData = async () => {
    if (!inputValue) return;
  
    try {
      const response = await axios.post("http://localhost:7094/api/ChartData", { value: parseInt(inputValue) });
      console.log("Data added successfully:", response.data);
      setInputValue("");
      setShowInput(false);
      fetchChartData(); // Refresh the chart data
    } catch (error) {
      console.error("Error adding data:", error);
    }
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="flex justify-between items-start mb-2 px-5 pt-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Acme Plus
        </h2>
        <EditMenu align="right" className="relative inline-flex">
          <li>
            <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
              Option 1
            </Link>
          </li>
          <li>
            <Link className="font-medium text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 flex py-1 px-3" to="#0">
              Option 2
            </Link>
          </li>
          <li>
            <Link className="font-medium text-sm text-red-500 hover:text-red-600 flex py-1 px-3" to="#0">
              Remove
            </Link>
          </li>
        </EditMenu>
      </header>
      <div className="px-5">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">
          Sales
        </div>
        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">
            $24,780
          </div>
          <div className="text-sm font-medium text-green-700 px-1.5 bg-green-500/20 rounded-full">
            +49%
          </div>
        </div>
      </div>
      <div className="grow max-sm:max-h-[128px] xl:max-h-[128px]">
        <LineChart data={chartData} width={389} height={128} />
      </div>
      <div className="px-5 pb-5">
        <button
          onClick={() => setShowInput(!showInput)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md mb-2"
        >
          {showInput ? "Cancel" : "Add Data"}
        </button>
        {showInput && (
          <div className="mb-4 flex items-center gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter value"
              className="border px-2 py-1 rounded-md"
            />
            <button
              onClick={addData}
              className="bg-green-500 text-white px-4 py-1 rounded-md"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardCard01;