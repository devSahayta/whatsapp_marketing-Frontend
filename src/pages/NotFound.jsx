import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const NotFound = () => {
  return (
    <>
      <SEO title="Page not found" noindex />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-blue-600 mb-2">404</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Page not found
          </h1>
          <p className="text-gray-600 mb-8">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Go to home
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
