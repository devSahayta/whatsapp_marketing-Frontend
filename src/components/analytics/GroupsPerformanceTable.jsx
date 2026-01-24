// components/analytics/GroupsPerformanceTable.jsx

import React from "react";
import { Folder, Users, MessageSquare, TrendingUp } from "lucide-react";

const GroupsPerformanceTable = ({ data }) => {
  if (!data || !data.groups || data.groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="text-center">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No groups found for this date range</p>
        </div>
      </div>
    );
  }

  const getResponseRateColor = (rate) => {
    if (rate >= 70) return "text-green-600 bg-green-50";
    if (rate >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getResponseRateBarColor = (rate) => {
    if (rate >= 70) return "bg-green-500";
    if (rate >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "bg-green-100 text-green-700 border-green-200",
      paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
      completed: "bg-gray-100 text-gray-700 border-gray-200",
    };

    return statusConfig[status] || statusConfig.active;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Folder className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Groups Performance
            </h3>
            <p className="text-sm text-gray-500">
              {data.total} {data.total === 1 ? "group" : "groups"} found
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-4 h-4" />
                  Contacts
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Response Rate
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.groups.map((group, index) => (
              <tr
                key={group.group_id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {/* Group Name */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {group.group_name}
                    </p>
                    {group.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                </td>

                {/* Contacts */}
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                    {group.contact_count}
                  </span>
                </td>

                {/* Messages */}
                <td className="px-6 py-4 text-center">
                  <div className="space-y-1">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
                      {group.message_count}
                    </span>
                    <p className="text-xs text-gray-500">
                      {group.admin_messages}↓ {group.user_messages}↑
                    </p>
                  </div>
                </td>

                {/* Response Rate */}
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${getResponseRateBarColor(
                            group.response_rate
                          )} transition-all duration-500`}
                          style={{ width: `${group.response_rate}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-sm font-semibold px-2 py-1 rounded ${getResponseRateColor(
                          group.response_rate
                        )}`}
                      >
                        {group.response_rate}%
                      </span>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                      group.status
                    )}`}
                  >
                    {group.status.charAt(0).toUpperCase() +
                      group.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Total Contacts:</span>
            <span className="text-gray-900 font-semibold">
              {data.groups.reduce((sum, g) => sum + g.contact_count, 0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="font-medium">Total Messages:</span>
            <span className="text-gray-900 font-semibold">
              {data.groups.reduce((sum, g) => sum + g.message_count, 0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-medium">Avg Response Rate:</span>
            <span className="text-gray-900 font-semibold">
              {Math.round(
                data.groups.reduce((sum, g) => sum + g.response_rate, 0) /
                  data.groups.length
              )}
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupsPerformanceTable;