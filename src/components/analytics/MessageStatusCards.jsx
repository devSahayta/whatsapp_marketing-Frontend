import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Send, CheckCircle, Eye, TrendingUp } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const getStatHint = (label, value, total) => {
  switch (label) {
    case "Sent":
      if (value === 0) return "No messages sent yet";
      if (value < 10) return "Getting started";
      return "Messages successfully sent";

    case "Delivered":
      if (!total || total === 0) return "Waiting for delivery";
      const deliveryRate = (value / total) * 100;
      if (deliveryRate < 50) return "Low delivery rate";
      if (deliveryRate < 80) return "Average delivery";
      return "High delivery success";

    case "Read":
      if (!total || total === 0) return "No reads yet";
      const readRate = (value / total) * 100;
      if (readRate < 30) return "Low engagement";
      if (readRate < 70) return "Moderate engagement";
      return "Healthy engagement";

    default:
      return "";
  }
};

/* Animation variants */
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const StatCard = ({
  label,
  value,
  total,
  icon: Icon,
  accent,
  index,
  isPercent = false,
}) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 250, damping: 20 }}
    className="
      relative overflow-hidden
      bg-white/80 backdrop-blur
      rounded-2xl p-5
      border border-gray-100
      shadow-md hover:shadow-xl
    "
  >
    {/* Accent bar */}
    <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />

    {/* Header */}
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{label}</p>

      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gray-100/80">
        <Icon className="h-5 w-5 text-gray-600 opacity-90" />
      </div>
    </div>

    <div className="mt-3 mb-4 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

    {/* Value */}
    <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
      <CountUp
        end={Number(value)}
        duration={1.2}
        decimals={isPercent ? 2 : 0}
      />
      {isPercent && "%"}
    </p>

    <div className="mt-3 mb-4 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

    <p className="mt-1 text-xs text-gray-400">
      {label === "Sent" && "Total messages sent"}
      {label === "Delivered" && "Reached users"}
      {label === "Read" && "Opened by users"}
    </p>

    {/* <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
      <TrendingUp className="h-3 w-3" />
      <span>Healthy engagement</span>
    </div> */}

    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
      <TrendingUp className="h-3 w-3" />
      <span>{getStatHint(label, value, total)}</span>
    </div>
  </motion.div>
);

const OpenRateCard = ({ value, index }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 250, damping: 20 }}
    className="
      relative overflow-hidden
      bg-white/90 backdrop-blur
      rounded-2xl p-5
      border border-gray-100
      shadow-sm hover:shadow-lg
    "
  >
    {/* Accent */}
    <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />

    <p className="text-sm font-medium text-gray-500 mb-4">Open Rate</p>

    <div className="h-28 w-28 mx-auto">
      <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl" />
      <CircularProgressbar
        value={value}
        text={`${value}%`}
        styles={buildStyles({
          textSize: "16px",
          pathColor: "#f59e0b", // amber
          textColor: "#111827", // gray-900
          trailColor: "#e5e7eb", // gray-200 (remaining)
          strokeLinecap: "round",
        })}
      />
    </div>

    <p className="mt-4 text-center text-xs text-gray-500">Delivered → Read</p>
  </motion.div>
);

const MessageStatusCards = ({ data }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      <StatCard
        label="Sent"
        value={data.sent}
        total={data.sent}
        icon={Send}
        accent="bg-blue-500"
        index={0}
      />

      <StatCard
        label="Delivered"
        value={data.delivered}
        total={data.sent}
        icon={CheckCircle}
        accent="bg-emerald-500"
        index={1}
      />

      <StatCard
        label="Read"
        value={data.read}
        total={data.sent}
        icon={Eye}
        accent="bg-violet-500"
        index={2}
      />

      {/* <StatCard
        label="Open Rate"
        value={data.open_rate}
        icon={TrendingUp}
        accent="bg-amber-500"
        index={3}
        isPercent
      /> */}

      <OpenRateCard value={data.open_rate} index={3} />
    </div>
  );
};

export default MessageStatusCards;
