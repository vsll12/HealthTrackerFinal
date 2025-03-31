import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LineChart from '../../charts/LineChart01';
import { chartAreaGradient } from '../../charts/ChartjsConfig';
import EditMenu from '../../components/DropdownEditMenu';

// Import utilities
import { adjustColorOpacity, getCssVariable } from '../../utils/Utils';

// Optional: Import Axios if you decide to use it for making HTTP requests
import axios from 'axios';

function DashboardCard02() {
  const [chartData, setChartData] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);  // Store selected days
  const [values, setValues] = useState([]);  // Store values for selected days
  const [error, setError] = useState('');  // Error state for validation

  // Available days of the week
  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];

  // Function to fetch existing chart data from API
  const fetchChartData = async () => {
    try {
      const response = await axios.get('https://localhost:7094/api/ChartData');
      const data = response.data;

      const formattedData = {
        labels: data.map(item => item.dayOfWeek),
        datasets: [
          {
            data: data.map(item => item.value1),
            fill: true,
            backgroundColor: function (context) {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              return chartAreaGradient(ctx, chartArea, [
                { stop: 0, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0) },
                { stop: 1, color: adjustColorOpacity(getCssVariable('--color-violet-500'), 0.2) },
              ]);
            },
            borderColor: getCssVariable('--color-violet-500'),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointBackgroundColor: getCssVariable('--color-violet-500'),
            pointHoverBackgroundColor: getCssVariable('--color-violet-500'),
            pointBorderWidth: 0,
            pointHoverBorderWidth: 0,
            clip: 20,
            tension: 0.2,
          },
        ],
      };

      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Fetch chart data on component mount
  useEffect(() => {
    fetchChartData();
  }, []);

  // Handle selection of days
  const handleDaySelect = (event) => {
    const { value } = event.target;
    if (!selectedDays.includes(value)) {
      setSelectedDays([...selectedDays, value]);
      setValues([...values, '']); // Add empty value for the new day
    } else {
      setError('This day is already selected.');
    }
  };

  // Handle value input for a selected day
  const handleValueChange = (index, event) => {
    const updatedValues = [...values];
    updatedValues[index] = event.target.value;
    setValues(updatedValues);
  };

  // Handle form submission to save data to API
  const handleSubmit = async () => {
    if (selectedDays.length === 0 || values.some(val => val === '')) {
      setError('Please select all days and input values.');
      return;
    }

    const data = {
      DaysOfWeek: selectedDays,
      Values: values,
    };

    try {
      const response = await axios.post('https://localhost:7094/api/ChartData', data);
      console.log('Data saved successfully:', response.data);
      fetchChartData();  // Refresh the chart data
    } catch (error) {
      console.error('Error saving chart data:', error);
    }
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <div className="px-5 pt-5">
        <header className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Acme Advanced</h2>
          {/* Menu button */}
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
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Sales</div>
        <div className="flex items-start">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mr-2">$17,489</div>
          <div className="text-sm font-medium text-red-700 px-1.5 bg-red-500/20 rounded-full">-14%</div>
        </div>
      </div>

      {/* Day Selection and Value Input Form */}
      <div className="px-5 py-5">
        <div className="mb-4">
          <label className="font-semibold text-gray-600">Select Days:</label>
          <select
            className="block w-full mt-2 border border-gray-300 rounded-lg p-2"
            onChange={handleDaySelect}
          >
            <option value="">Select a day</option>
            {daysOfWeek.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {selectedDays.length > 0 && (
          <div className="mb-4">
            <label className="font-semibold text-gray-600">Enter Values:</label>
            {selectedDays.map((day, index) => (
              <div key={index} className="flex items-center mb-2">
                <span className="w-1/4">{day}</span>
                <input
                  type="number"
                  value={values[index]}
                  onChange={(event) => handleValueChange(index, event)}
                  className="w-3/4 border border-gray-300 rounded-lg p-2"
                  placeholder="Enter value"
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="mt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white p-2 rounded-lg w-full"
          >
            Submit Data
          </button>
        </div>
      </div>

      {/* Chart built with Chart.js 3 */}
      <div className="grow max-sm:max-h-[128px] max-h-[128px]">
        {/* Only render the chart if chartData is available */}
        {chartData ? (
          <LineChart data={chartData} width={389} height={128} />
        ) : (
          <p>Loading chart data...</p>
        )}
      </div>
    </div>
  );
}

export default DashboardCard02;
