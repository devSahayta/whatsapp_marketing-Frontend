import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MessageDailyChart = ({ data }) => {
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
        Daily Message Performance
      </h3>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Legend />

            <Bar dataKey="Sent" fill="#6366f1" />
            <Bar dataKey="Delivered" fill="#22c55e" />
            <Bar dataKey="Read" fill="#facc15" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MessageDailyChart;
