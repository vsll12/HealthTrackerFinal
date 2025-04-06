import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "https://localhost:7094"; // Match your backend URL

function DashboardCard10() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set()); // Track sent requests

  useEffect(() => {
    const fetchNonFriends = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/api/friends/non-friends`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch non-friends');
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNonFriends();
  }, [navigate]);

  const sendFollowRequest = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/friends/follow/${userId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log(`Follow request sent to user ${userId}`);
        setSentRequests((prev) => new Set(prev).add(userId)); // Mark as sent
        setUsers((prev) => prev.filter((user) => user.id !== userId)); // Remove from list
      } else {
        console.error('Failed to send follow request');
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
    }
  };

  return (
    <div className="col-span-full xl:col-span-6 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Users to Follow</h2>
      </header>
      <div className="p-3">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            {/* Table header */}
            <thead className="text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Name</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Action</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm divide-y divide-gray-100 dark:divide-gray-700/60">
              {loading ? (
                <tr>
                  <td colSpan="2" className="p-2 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="2" className="p-2 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="2" className="p-2 text-center text-gray-500 dark:text-gray-400">
                    No users available to follow
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="p-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 shrink-0 mr-2 sm:mr-3">
                          <div className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-100 font-medium">
                            {user.userName[0]}
                          </div>
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-100">{user.userName}</div>
                      </div>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <button
                        onClick={() => sendFollowRequest(user.id)}
                        disabled={sentRequests.has(user.id)}
                        className={`btn text-xs px-3 py-1 rounded ${
                          sentRequests.has(user.id)
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {sentRequests.has(user.id) ? 'Requested' : 'Follow'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardCard10;