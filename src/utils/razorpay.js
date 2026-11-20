// src/utils/razorpay.js
// Shared, singleton loader for the Razorpay checkout script so both the
// subscription flow and the credit top-up flow reuse the same <script> tag.

let razorpayPromise = null;

export const loadRazorpay = () => {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }
  if (!razorpayPromise) {
    razorpayPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayPromise = null; // allow a retry on the next click
        script.remove();
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  return razorpayPromise;
};
