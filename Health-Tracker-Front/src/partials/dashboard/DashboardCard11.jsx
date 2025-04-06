import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "https://localhost:7094"; // Match your backend URL

function DashboardCard11() {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/api/friends/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pending requests');
        }

        const data = await response.json();
        setPendingRequests(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, [navigate]);

  const acceptFollowRequest = async (friendshipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/friends/accept/${friendshipId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPendingRequests((prev) => prev.filter((req) => req.id !== friendshipId));
        console.log(`Friend request ${friendshipId} accepted`);
      } else {
        console.error('Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  return (
    <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Pending Friend Requests</h2>
      </header>
      <div className="px-5 py-3 grow">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : pendingRequests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No pending friend requests</p>
        ) : (
          <ul className="space-y-3">
            {pendingRequests.map((request) => (
              <li key={request.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 shrink-0 mr-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-100 font-medium">
                    {request.userName[0]}
                  </div>
                  <span className="text-gray-800 dark:text-gray-100 font-medium">{request.userName}</span>
                </div>
                <button
                  onClick={() => acceptFollowRequest(request.id)}
                  className="btn bg-green-500 text-white hover:bg-green-600 text-xs px-3 py-1 rounded"
                >
                  Accept
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardCard11;