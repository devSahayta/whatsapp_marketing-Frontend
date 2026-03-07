import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";

const SubscriptionExpired = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-orange-50 px-4 py-14">
      <div className="max-w-xl mx-auto rounded-3xl bg-white border border-rose-100 shadow-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Subscription Expired
        </h1>
        <p className="text-gray-600 mb-7">
          Please renew your Samvaadik plan to continue accessing the platform.
        </p>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 bg-gradient-to-r from-rose-600 to-orange-500 text-white font-semibold hover:shadow-lg transition-all"
          onClick={() => navigate("/pricing")}
        >
          Renew Subscription
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
