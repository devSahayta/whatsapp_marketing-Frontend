import { Navigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import useSubscription from "../hooks/useSubscription";

const SubscriptionGuard = ({ children }) => {
  const { userId, isAuthenticated, isLoading } = useAuthUser();
  const { loading, active, isExpired } = useSubscription(userId, {
    enabled: isAuthenticated && !isLoading,
  });

  if (isLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-100 shadow-sm px-8 py-6 text-center">
          <p className="text-base font-medium text-gray-900">
            Checking your subscription...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            This only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (!active && isExpired) return <Navigate to="/expired" replace />;

  if (!active) return <Navigate to="/pricing" replace />;

  return children;
};

export default SubscriptionGuard;
