// components/analytics/OverviewCards.jsx

import React from "react";
import { Users, UserPlus, MessageSquare, MessageCircle } from "lucide-react";

const OverviewCards = ({ data }) => {
  if (!data) return null;

  // Debug: Check what data we're receiving
  console.log("OverviewCards received data:", data);

  // Handle both direct overview data and nested data
  const overview = data.overview || data;
  const trends = overview.trends || {};

  console.log("Overview:", overview);
  console.log("Trends:", trends);

  const cards = [
    {
      title: "Total Groups",
      value: overview.total_groups,
      trend: `+${trends.groups_this_month || 0} this month`,
      icon: Users,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Total Contacts",
      value: overview.total_contacts,
      trend: `+${trends.contacts_today || 0} today`,
      icon: UserPlus,
      color: "green",
      gradient: "from-green-500 to-green-600",
      bgLight: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Total Messages",
      value: overview.total_messages,
      trend: `+${trends.messages_today || 0} today`,
      icon: MessageSquare,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Active Chats",
      value: overview.active_chats,
      trend: `${trends.chat_active_percentage || 0}% active`,
      icon: MessageCircle,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            {/* Icon Circle */}
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.bgLight} p-3 rounded-xl`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {card.title}
            </h3>

            {/* Value */}
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>

            {/* Trend */}
            <p className="text-sm text-gray-500">{card.trend}</p>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;