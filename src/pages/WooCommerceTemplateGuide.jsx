// src/pages/WooCommerceTemplateGuide.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Image,
  RefreshCw,
  Sparkles,
  Zap,
  ShoppingCart,
} from "lucide-react";
import { createTemplate } from "../api/templates";
import {
  getWooConnections,
  getWooAutomations,
  createWooAutomation,
  getWaAccountId,
  getPlaceholderHandle,
} from "../api/woocommerce";
import useAuthUser from "../hooks/useAuthUser";
import {
  showError,
  showSuccess,
  showLoading,
  dismissToast,
} from "../utils/toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_META = {
  "order.created": { label: "Order placed", emoji: "🛍️", dot: "#378ADD" },
  "order.shipped": { label: "Order shipped", emoji: "🚚", dot: "#1D9E75" },
  "order.completed": { label: "Order delivered", emoji: "✅", dot: "#BA7517" },
  "order.cancelled": { label: "Order cancelled", emoji: "❌", dot: "#E24B4A" },
  "order.refunded": { label: "Order refunded", emoji: "💰", dot: "#888780" },
  "cart.abandoned": { label: "Cart recovery", emoji: "🛒", dot: "#7C3AED" },
};

const ORDER_TABS = [
  "order.created",
  "order.shipped",
  "order.completed",
  "order.cancelled",
  "order.refunded",
];
const ALL_TABS = [...ORDER_TABS, "cart.abandoned"];

const VAR_MAP = {
  billing_full_name: { label: "Customer name", example: "Raj Kumar" },
  order_number: { label: "Order number", example: "1001" },
  total: { label: "Order total", example: "₹1299.00" },
  item_names: { label: "Item names", example: "Blue T-Shirt, Black Cap" },
  payment_method: { label: "Payment method", example: "Razorpay" },
  cart_total: { label: "Cart total", example: "₹3699.00" },
};

const TEMPLATES = {
  "order.created": {
    tip: "Fires the moment a customer places an order. Confirming instantly builds trust and reduces support queries.",
    options: [
      {
        id: "conf_image",
        name: "Confirmation with product photo",
        desc: "Shows the actual product image the customer ordered as the message header",
        badge: "With image",
        badgeColor: "#185FA5",
        badgeBg: "#E6F1FB",
        isImage: true,
        header: null,
        previewHeader: "Product image",
        body: "Hi {{1}}, your order #{{2}} has been placed successfully!\n\nAmount: {{3}}\nItems: {{4}}\n\nThank you for shopping with us!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "total", "item_names"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "₹1299.00",
          "{{4}}": "Blue T-Shirt, Black Cap",
        },
        apiName: "order_confirm_image_sv",
        exampleValues: ["Raj Kumar", "1001", "₹1299.00", "Blue T-Shirt x2"],
      },
      {
        id: "conf_simple",
        name: "Simple text confirmation",
        desc: "Clean, minimal order confirmation with key details — no image",
        badge: "Text only",
        badgeColor: "#5F5E5A",
        badgeBg: "#F1EFE8",
        isImage: false,
        header: "Order Confirmed",
        previewHeader: "Order Confirmed",
        body: "Hi {{1}}, your order #{{2}} has been placed successfully!\n\nAmount: {{3}}\nItems: {{4}}\n\nThank you for shopping with us!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "total", "item_names"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "₹1299.00",
          "{{4}}": "Blue T-Shirt, Black Cap",
        },
        apiName: "order_confirm_sv_v1",
        exampleValues: ["Raj Kumar", "1001", "₹1299.00", "Blue T-Shirt x2"],
      },
      {
        id: "conf_detailed",
        name: "Detailed confirmation",
        desc: "Includes payment method alongside order details",
        badge: "More info",
        badgeColor: "#0F6E56",
        badgeBg: "#E1F5EE",
        isImage: false,
        header: "Order Confirmed",
        previewHeader: "Order Confirmed",
        body: "Hi {{1}}, thank you for your order!\n\nOrder #{{2}}\nAmount: {{3}}\nItems: {{4}}\nPayment: {{5}}\n\nYour order is being processed.",
        footer: "Powered by Samvaadik",
        vars: [
          "billing_full_name",
          "order_number",
          "total",
          "item_names",
          "payment_method",
        ],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "₹1299.00",
          "{{4}}": "Blue T-Shirt, Black Cap",
          "{{5}}": "Razorpay",
        },
        apiName: "order_confirm_detail_sv_v1",
        exampleValues: [
          "Raj Kumar",
          "1001",
          "₹1299.00",
          "Blue T-Shirt x2",
          "Razorpay",
        ],
      },
    ],
  },
  "order.shipped": {
    tip: "Send this when you mark an order as Shipped. Reduces 'where is my order?' support tickets significantly.",
    options: [
      {
        id: "ship_simple",
        name: "Shipped notification",
        desc: "Tells the customer their order is on the way",
        badge: "Recommended",
        badgeColor: "#185FA5",
        badgeBg: "#E6F1FB",
        isImage: false,
        header: "Order Shipped",
        previewHeader: "Order Shipped",
        body: "Hi {{1}}, great news! Your order #{{2}} has been shipped!\n\nItems: {{3}}\n\nYour order is on its way. We will notify you once delivered.\n\nThank you! 🙏",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "item_names"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "Blue T-Shirt, Black Cap",
        },
        apiName: "order_ship_sv_v1",
        exampleValues: ["Raj Kumar", "1001", "Blue T-Shirt x2"],
      },
      {
        id: "ship_eta",
        name: "Shipped with order value",
        desc: "Includes order value — useful for high-value purchases",
        badge: "With value",
        badgeColor: "#0F6E56",
        badgeBg: "#E1F5EE",
        isImage: false,
        header: "Your Order Is On Its Way",
        previewHeader: "Your Order Is On Its Way",
        body: "Hi {{1}}, your order #{{2}} has been dispatched!\n\nItems: {{3}}\nOrder value: {{4}}\n\nExpected delivery within 3-5 business days.",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "item_names", "total"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "Blue T-Shirt, Black Cap",
          "{{4}}": "₹1299.00",
        },
        apiName: "order_ship_detail_sv_v1",
        exampleValues: ["Raj Kumar", "1001", "Blue T-Shirt x2", "₹1299.00"],
      },
    ],
  },
  "order.completed": {
    tip: "Fires when you mark an order as Completed. Best moment to ask for a review — the customer just received their product.",
    options: [
      {
        id: "del_image",
        name: "Delivered with product photo",
        desc: "Shows the delivered product image — most impactful for review requests",
        badge: "With image",
        badgeColor: "#185FA5",
        badgeBg: "#E6F1FB",
        isImage: true,
        header: null,
        previewHeader: "Product image",
        body: "Hi {{1}}, your order #{{2}} has been delivered!\n\nWe hope you love your purchase. Do share your feedback with us!\n\nThank you for shopping with us 🙏",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number"],
        previewVars: { "{{1}}": "Raj Kumar", "{{2}}": "1001" },
        apiName: "order_deliver_image_sv",
        exampleValues: ["Raj Kumar", "1001"],
      },
      {
        id: "del_review",
        name: "Delivered + review request",
        desc: "Confirms delivery and gently asks for feedback — text only",
        badge: "Text only",
        badgeColor: "#854F0B",
        badgeBg: "#FAEEDA",
        isImage: false,
        header: "Order Delivered",
        previewHeader: "Order Delivered",
        body: "Hi {{1}}, your order #{{2}} has been delivered successfully!\n\nWe hope you love your purchase. Do share your feedback with us!\n\nThank you for shopping with us 🙏",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number"],
        previewVars: { "{{1}}": "Raj Kumar", "{{2}}": "1001" },
        apiName: "order_deliver_sv_v1",
        exampleValues: ["Raj Kumar", "1001"],
      },
      {
        id: "del_simple",
        name: "Simple delivery notice",
        desc: "Clean confirmation with item list — just a warm close",
        badge: "Minimal",
        badgeColor: "#5F5E5A",
        badgeBg: "#F1EFE8",
        isImage: false,
        header: "Delivered",
        previewHeader: "Delivered",
        body: "Hi {{1}}, your order #{{2}} worth {{3}} has been delivered.\n\nItems: {{4}}\n\nHope you enjoy your purchase!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "total", "item_names"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "₹1299.00",
          "{{4}}": "Blue T-Shirt, Black Cap",
        },
        apiName: "order_deliver_simple_sv_v1",
        exampleValues: ["Raj Kumar", "1001", "₹1299.00", "Blue T-Shirt x2"],
      },
    ],
  },
  "order.cancelled": {
    tip: "Fires when an order is cancelled. Proactively notifying customers reduces frustration and gives them a clear path to contact support.",
    options: [
      {
        id: "can_standard",
        name: "Cancellation notice",
        desc: "Notifies customer with a support prompt — keeps the relationship warm",
        badge: "Recommended",
        badgeColor: "#A32D2D",
        badgeBg: "#FCEBEB",
        isImage: false,
        header: "Order Cancelled",
        previewHeader: "Order Cancelled",
        body: "Hi {{1}}, your order #{{2}} worth {{3}} has been cancelled.\n\nIf this was a mistake or you need help, please reach out to our support team.\n\nWe hope to serve you again soon!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "total"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "₹1299.00",
        },
        apiName: "order_cancel_sv_v1",
        exampleValues: ["Raj Kumar", "1001", "₹1299.00"],
      },
    ],
  },
  "order.refunded": {
    tip: "Fires when a refund is processed. Telling customers about refunds proactively builds trust and cuts down payment-related queries.",
    options: [
      {
        id: "ref_standard",
        name: "Refund initiated",
        desc: "Confirms refund with a clear timeline — sets the right expectation",
        badge: "Recommended",
        badgeColor: "#5F5E5A",
        badgeBg: "#F1EFE8",
        isImage: false,
        header: "Refund Initiated",
        previewHeader: "Refund Initiated",
        body: "Hi {{1}}, your refund for order #{{2}} of {{3}} has been successfully initiated.\n\nThe amount will be credited back within 5-7 business days.\n\nSorry for any inconvenience caused!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "order_number", "total"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "1001",
          "{{3}}": "₹1299.00",
        },
        apiName: "order_refund_sv_v1",
        exampleValues: ["Raj Kumar", "1001", "₹1299.00"],
      },
    ],
  },
  "cart.abandoned": {
    tip: "Sends a recovery message to customers who added items to cart and reached checkout but never completed the purchase. Runs automatically every 30 minutes.",
    options: [
      {
        id: "cart_image",
        name: "Cart recovery with product photo",
        desc: "Shows the abandoned product image — highest recovery rate",
        badge: "Recommended",
        badgeColor: "#7C3AED",
        badgeBg: "#F3F0FF",
        isImage: true,
        header: null,
        previewHeader: "Product image",
        body: "Hi {{1}}, you left something behind!\n\n🛒 Items: {{2}}\n💰 Total: {{3}}\n\nComplete your purchase before it sells out!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "item_names", "cart_total"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "Gold Mirror x1",
          "{{3}}": "₹3699.00",
        },
        apiName: "cart_recovery_image_sv",
        exampleValues: ["Raj Kumar", "Gold Mirror x1", "₹3699.00"],
        isCartRecovery: true,
        delayMinutes: 60,
      },
      {
        id: "cart_text",
        name: "Cart recovery text only",
        desc: "Simple text-based recovery message — works with any template",
        badge: "Text only",
        badgeColor: "#5F5E5A",
        badgeBg: "#F1EFE8",
        isImage: false,
        header: "You Left Something Behind",
        previewHeader: "You Left Something Behind",
        body: "Hi {{1}}, you left something in your cart!\n\n🛒 Items: {{2}}\n💰 Total: {{3}}\n\nComplete your purchase before it sells out!",
        footer: "Powered by Samvaadik",
        vars: ["billing_full_name", "item_names", "cart_total"],
        previewVars: {
          "{{1}}": "Raj Kumar",
          "{{2}}": "Gold Mirror x1",
          "{{3}}": "₹3699.00",
        },
        apiName: "cart_recovery_sv",
        exampleValues: ["Raj Kumar", "Gold Mirror x1", "₹3699.00"],
        isCartRecovery: true,
        delayMinutes: 60,
      },
    ],
  },
};

// ─── Phone Preview ────────────────────────────────────────────────────────────

function PhonePreview({ template }) {
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center px-4">
        <div className="text-2xl mb-2">👈</div>
        Select a template to preview
      </div>
    );
  }

  const renderBody = (body, previewVars) => {
    let remaining = body;
    for (const [token, value] of Object.entries(previewVars)) {
      remaining = remaining.replaceAll(token, `__HIGHLIGHT__${value}__END__`);
    }
    return remaining.split("\n").map((line, li) => {
      const segments = line.split(/(__HIGHLIGHT__|__END__)/);
      let isHighlight = false;
      const lineContent = segments.map((seg, si) => {
        if (seg === "__HIGHLIGHT__") {
          isHighlight = true;
          return null;
        }
        if (seg === "__END__") {
          isHighlight = false;
          return null;
        }
        if (isHighlight)
          return (
            <span key={si} style={{ color: "#BA7517", fontWeight: 500 }}>
              {seg}
            </span>
          );
        return <span key={si}>{seg}</span>;
      });
      return (
        <div key={li} style={{ minHeight: line === "" ? "0.5em" : undefined }}>
          {lineContent}
        </div>
      );
    });
  };

  return (
    <div
      style={{
        width: 190,
        margin: "0 auto",
        background: "#ECE5DD",
        borderRadius: 14,
        overflow: "hidden",
        border: "4px solid #1a1a1a",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 8,
            background: "#000",
            borderRadius: "0 0 5px 5px",
          }}
        />
      </div>
      <div style={{ background: "#ECE5DD", padding: 6, minHeight: 220 }}>
        <div
          style={{
            background: "#075E54",
            padding: "4px 6px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            margin: "-6px -6px 6px",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#128C7E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontSize: 7, color: "#fff", fontWeight: 500 }}>
              Samvaadik
            </div>
            <div style={{ fontSize: 5, color: "rgba(255,255,255,0.7)" }}>
              online
            </div>
          </div>
        </div>

        {template.isImage && (
          <div
            style={{
              background: "#CBD5E1",
              height: 65,
              margin: "-6px -6px 6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <div style={{ fontSize: 16 }}>🖼️</div>
            <div
              style={{
                fontSize: 6,
                color: "#475569",
                textAlign: "center",
                lineHeight: 1.4,
                fontWeight: 500,
              }}
            >
              {template.isCartRecovery
                ? "Abandoned product photo"
                : "Product photo"}
              <br />
              attached automatically
            </div>
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: "0 6px 6px 6px",
            padding: "5px 7px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          }}
        >
          {!template.isImage && (
            <div
              style={{
                fontWeight: 600,
                fontSize: 8,
                color: "#111",
                marginBottom: 2,
                paddingBottom: 2,
                borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              }}
            >
              {template.previewHeader}
            </div>
          )}
          <div style={{ fontSize: 8, lineHeight: 1.5, color: "#333" }}>
            {renderBody(template.body, template.previewVars)}
          </div>
          {template.isCartRecovery && (
            <div
              style={{
                marginTop: 4,
                paddingTop: 4,
                borderTop: "0.5px solid rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  background: "#E8F5E9",
                  border: "0.5px solid #A5D6A7",
                  borderRadius: 4,
                  padding: "2px 5px",
                  fontSize: 7,
                  color: "#2E7D32",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                Complete Purchase →
              </div>
            </div>
          )}
          <div
            style={{
              fontSize: 6,
              color: "#888",
              marginTop: 2,
              paddingTop: 2,
              borderTop: "0.5px solid rgba(0,0,0,0.08)",
            }}
          >
            {template.footer}
          </div>
          <div
            style={{
              textAlign: "right",
              fontSize: 5,
              color: "#888",
              marginTop: 1,
            }}
          >
            10:32 AM ✓✓
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Compact Stepper (mobile) ─────────────────────────────────────────────────

function MobileStepper({ tabs, active, connected, onSelect }) {
  const currentIdx = tabs.indexOf(active);
  const doneCount = tabs.filter((t) => !!connected[t]).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-700">Setup progress</p>
        <span className="text-xs text-slate-400">
          <span className="font-semibold text-slate-700">{doneCount}</span> /{" "}
          {tabs.length}
        </span>
      </div>
      <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(doneCount / tabs.length) * 100}%` }}
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((e) => {
          const isDone = !!connected[e];
          const isActive = active === e;
          const meta = EVENT_META[e];
          return (
            <button
              key={e}
              onClick={() => onSelect(e)}
              className="flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all"
              style={{
                background: isActive ? "#FFFBF5" : "transparent",
                border: isActive
                  ? "1px solid #BA7517"
                  : "1px solid transparent",
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{
                  background: isDone
                    ? "#1D9E75"
                    : isActive
                      ? "#BA7517"
                      : "#E2E8F0",
                  color: isDone || isActive ? "#fff" : "#94A3B8",
                }}
              >
                {isDone ? "✓" : meta.emoji}
              </div>
              <span
                className="text-xs leading-tight text-center"
                style={{
                  color: isDone ? "#0F6E56" : isActive ? "#854F0B" : "#94A3B8",
                  fontSize: 9,
                }}
              >
                {meta.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Desktop Stepper ──────────────────────────────────────────────────────────

function DesktopStepper({ tabs, active, connected, onSelect }) {
  const doneCount = tabs.filter((t) => !!connected[t]).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">Setup progress</p>
        <span className="text-xs text-slate-400">
          <span className="font-medium text-slate-700">{doneCount}</span> of{" "}
          {tabs.length} configured
        </span>
      </div>
      <div className="flex items-start">
        {tabs.map((e, i) => {
          const isDone = !!connected[e];
          const isActive = active === e;
          const lineLeftDone = i > 0 && !!connected[tabs[i - 1]];
          return (
            <React.Fragment key={e}>
              {i > 0 && (
                <div
                  className="flex-1 mt-5 transition-colors duration-300"
                  style={{
                    height: 2,
                    background: lineLeftDone ? "#1D9E75" : "#E2E8F0",
                  }}
                />
              )}
              <button
                onClick={() => onSelect(e)}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200"
                  style={{
                    background: isDone
                      ? "#1D9E75"
                      : isActive
                        ? "#fff"
                        : "#F8FAFC",
                    border: isDone
                      ? "2px solid #1D9E75"
                      : isActive
                        ? "2px solid #BA7517"
                        : "2px solid #E2E8F0",
                    color: isDone ? "#fff" : isActive ? "#BA7517" : "#94A3B8",
                    boxShadow: isActive
                      ? "0 0 0 4px rgba(186,117,23,0.1)"
                      : "none",
                  }}
                >
                  {isDone ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8l3.5 3.5L13 5"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="mt-2 text-center px-1">
                  <p
                    className="text-xs font-medium leading-tight"
                    style={{
                      color: isDone
                        ? "#0F6E56"
                        : isActive
                          ? "#854F0B"
                          : "#94A3B8",
                    }}
                  >
                    {EVENT_META[e].label}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color: isDone
                        ? "#1D9E75"
                        : isActive
                          ? "#BA7517"
                          : "#CBD5E1",
                    }}
                  >
                    {isDone
                      ? connected[e]?.isImage
                        ? "🖼️ Image"
                        : "Text"
                      : isActive
                        ? "In progress"
                        : "Pending"}
                  </p>
                </div>
              </button>
              {i < tabs.length - 1 && (
                <div
                  className="flex-1 mt-5 transition-colors duration-300"
                  style={{
                    height: 2,
                    background: isDone ? "#1D9E75" : "#E2E8F0",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="bg-slate-100 rounded-full h-1 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${(doneCount / tabs.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WooCommerceTemplateGuide() {
  const navigate = useNavigate();
  const { userId } = useAuthUser();

  const [activeTab, setActiveTab] = useState("order.created");
  const [selected, setSelected] = useState({});
  const [creating, setCreating] = useState({});
  const [connected, setConnected] = useState({});
  const [connection, setConnection] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [waAccountId, setWaAccountId] = useState(null);
  const [showPreview, setShowPreview] = useState(false); // mobile preview toggle
  const [checkoutUrl, setCheckoutUrl] = useState("");

  // Auto-fill when connection loads
  useEffect(() => {
    if (connection?.store_url) {
      setCheckoutUrl(`${connection.store_url}`);
    }
  }, [connection]);

  useEffect(() => {
    async function init() {
      try {
        const [connRes, autoRes] = await Promise.allSettled([
          getWooConnections(),
          getWooAutomations(),
        ]);
        if (connRes.status === "fulfilled")
          setConnection(connRes.value.data?.connections?.[0] || null);

        if (autoRes.status === "fulfilled") {
          const autos = autoRes.value.data?.automations || [];
          const map = {};
          autos.forEach((a) => {
            map[a.trigger_event] = {
              templateName: a.whatsapp_templates?.name || "Template",
              automationId: a.id,
              isActive: a.is_active,
              isImage: a.include_product_image,
            };
          });
          setConnected(map);
          if (autos[0]?.account_id) setWaAccountId(autos[0].account_id);
        }

        try {
          const acctRes = await getWaAccountId();
          if (acctRes.data?.wa_id) setWaAccountId(acctRes.data.wa_id);
        } catch {
          /* silent */
        }
      } catch {
        /* silent */
      } finally {
        setLoadingInit(false);
      }
    }
    init();
  }, []);

  const getSelectedTemplate = useCallback(
    (event) => {
      const opts = TEMPLATES[event]?.options || [];
      const idx = selected[event] ?? 0;
      return opts[idx] || opts[0] || null;
    },
    [selected],
  );

  const handleUseTemplate = async (event) => {
    if (!userId) {
      showError("Not authenticated");
      return;
    }
    const tpl = getSelectedTemplate(event);
    if (!tpl) return;

    // At the top of handleUseTemplate, after getting tpl:
    if (tpl.isCartRecovery && !checkoutUrl) {
      showError("Please enter your checkout URL for the button");
      return;
    }

    setCreating((p) => ({ ...p, [event]: true }));
    const timestamp = Date.now().toString().slice(-6);
    const templateName = `${tpl.apiName}_${timestamp}`;

    try {
      let components;

      if (tpl.isImage) {
        const handleToastId = showLoading(
          "Getting image placeholder from Meta...",
        );
        let headerHandle;
        try {
          const handleRes = await getPlaceholderHandle();
          headerHandle = handleRes.data?.header_handle;
          dismissToast(handleToastId);
          if (!headerHandle) throw new Error("No header handle returned");
        } catch (e) {
          dismissToast(handleToastId);
          showError(
            "Could not get image placeholder. Check your WhatsApp account connection.",
          );
          setCreating((p) => ({ ...p, [event]: false }));
          return;
        }
        components = [
          {
            type: "HEADER",
            format: "IMAGE",
            example: { header_handle: [headerHandle] },
          },
          {
            type: "BODY",
            text: tpl.body,
            example: { body_text: [tpl.exampleValues] },
          },
          { type: "FOOTER", text: tpl.footer },
        ];
      } else {
        components = [
          { type: "HEADER", format: "TEXT", text: tpl.header },
          {
            type: "BODY",
            text: tpl.body,
            example: { body_text: [tpl.exampleValues] },
          },
          { type: "FOOTER", text: tpl.footer },
        ];
      }

      // ✅ Add URL button for cart recovery templates
      if (tpl.isCartRecovery && checkoutUrl) {
        components.push({
          type: "BUTTONS",
          buttons: [
            {
              type: "URL",
              text: "Complete Purchase",
              url: checkoutUrl,
            },
          ],
        });
      }

      const createToastId = showLoading(
        tpl.isImage
          ? "Creating image template..."
          : "Creating template and submitting to Meta...",
      );

      const createRes = await createTemplate({
        user_id: userId,
        account_id: waAccountId,
        name: templateName,
        language: "en_US",
        category: tpl.isImage ? "MARKETING" : "UTILITY",
        parameter_format: "positional",
        components,
      });

      const wt_id = createRes?.data?.template?.wt_id;
      dismissToast(createToastId);

      if (connection && wt_id) {
        const autoToastId = showLoading("Setting up automation...");
        try {
          const template_variable_map = {};
          tpl.vars.forEach((f, i) => {
            template_variable_map[String(i + 1)] = f;
          });

          await createWooAutomation({
            connection_id: connection.id,
            wt_id,
            trigger_event: event,
            delay_minutes: tpl.isCartRecovery ? tpl.delayMinutes || 60 : 0,
            template_variable_map,
            include_product_image: tpl.isImage,
          });

          dismissToast(autoToastId);
          showSuccess(
            tpl.isCartRecovery
              ? `Cart recovery enabled! Messages will send ${tpl.delayMinutes || 60} minutes after abandonment.`
              : tpl.isImage
                ? `Image template created! Product photos will attach automatically.`
                : `Template created and automation set up for ${EVENT_META[event]?.label}!`,
          );
        } catch (autoErr) {
          dismissToast(autoToastId);
          showSuccess(
            "Template submitted to Meta! Set up the automation manually once approved.",
          );
        }
      } else {
        showSuccess("Template submitted to Meta for approval!");
      }

      setConnected((p) => ({
        ...p,
        [event]: { templateName, isActive: true, isImage: tpl.isImage },
      }));
    } catch (err) {
      const msg =
        err?.response?.data?.meta_error_detail?.error?.message ||
        err?.response?.data?.meta_error ||
        err?.response?.data?.error ||
        err.message;
      showError("Failed: " + (msg || "Unknown error"));
    } finally {
      setCreating((p) => ({ ...p, [event]: false }));
    }
  };

  const copyTemplateBody = (tpl) => {
    if (!tpl) return;
    navigator.clipboard
      .writeText(tpl.body)
      .then(() => showSuccess("Body text copied!"));
  };

  const allDone = ALL_TABS.every((e) => connected[e]);
  const doneCount = ALL_TABS.filter((e) => connected[e]).length;
  const currentData = TEMPLATES[activeTab];
  const currentTpl = getSelectedTemplate(activeTab);
  const isConnected = !!connected[activeTab];
  const isCreating = !!creating[activeTab];
  const isCartTab = activeTab === "cart.abandoned";

  if (loadingInit)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
        <span className="ml-2 text-sm text-slate-500">Loading...</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 px-3 sm:px-4 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* ── Header ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => navigate("/integrations/woocommerce")}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400 mb-0.5 hidden sm:block">
                  WooCommerce · Templates
                </p>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight">
                  Order notification templates
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed hidden sm:block">
                  Pick a template for each event. Image templates automatically
                  attach the product photo — no extra setup needed.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/template/create")}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex-shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Custom
            </button>
          </div>
        </div>

        {/* ── Progress stepper — responsive ── */}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-4 sm:py-5 shadow-sm">
          {/* Mobile stepper */}
          <div className="block sm:hidden">
            <MobileStepper
              tabs={ALL_TABS}
              active={activeTab}
              connected={connected}
              onSelect={setActiveTab}
            />
          </div>
          {/* Desktop stepper */}
          <div className="hidden sm:block">
            <DesktopStepper
              tabs={ALL_TABS}
              active={activeTab}
              connected={connected}
              onSelect={setActiveTab}
            />
          </div>
          {allDone && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              All {ALL_TABS.length} events configured — your store will send
              WhatsApp messages automatically.
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-2xl overflow-x-auto scrollbar-hide">
          {ALL_TABS.map((e) => {
            const meta = EVENT_META[e];
            const isCon = !!connected[e];
            const isActive = activeTab === e;
            const isCart = e === "cart.abandoned";
            return (
              <button
                key={e}
                onClick={() => setActiveTab(e)}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-3 text-xs font-medium border-b-2 -mb-px flex-shrink-0 transition-colors"
                style={{
                  borderBottomColor: isActive
                    ? isCart
                      ? "#7C3AED"
                      : "#BA7517"
                    : "transparent",
                  color: isActive
                    ? isCart
                      ? "#7C3AED"
                      : "#BA7517"
                    : isCon
                      ? "#0F6E56"
                      : "#64748b",
                  background: isActive ? "#FAFAF8" : "transparent",
                }}
              >
                <span className="text-sm">{meta.emoji}</span>
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="inline sm:hidden">
                  {meta.label.split(" ")[0]}
                </span>
                {isCon && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Main content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left — template picker */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tip */}
            <div
              className={`rounded-xl border px-4 py-3 text-xs leading-relaxed flex gap-2 ${isCartTab ? "bg-violet-50 border-violet-200 text-violet-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}
            >
              <span className="flex-shrink-0 mt-0.5">
                {isCartTab ? "🛒" : "💡"}
              </span>
              <span>{currentData.tip}</span>
            </div>

            {/* Connected banner */}
            {isConnected && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-2.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-medium">Automation active</span> — using{" "}
                  <code className="bg-white px-1 py-0.5 rounded text-emerald-700 break-all">
                    {connected[activeTab].templateName}
                  </code>
                  {connected[activeTab].isImage && (
                    <span className="ml-1.5 inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      🖼️ With image
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cart recovery info banner */}
            {isCartTab && !isConnected && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-800 leading-relaxed space-y-1">
                <p className="font-medium">How cart recovery works:</p>
                <p>
                  1. Customer adds items and reaches checkout but doesn't place
                  order
                </p>
                <p>
                  2. After 60 minutes, our system detects the abandoned cart
                </p>
                <p>
                  3. WhatsApp message is sent automatically with product image
                </p>
                <p>
                  4. When customer completes the order, status updates to
                  Recovered
                </p>
              </div>
            )}

            {/* Template options */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">
                  Choose a template
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isCartTab
                    ? "Image templates show the abandoned product photo — higher recovery rates"
                    : "Image templates attach the product photo automatically"}
                </p>
              </div>
              <div className="p-3 sm:p-4 space-y-3">
                {currentData.options.map((opt, idx) => {
                  const isSel = (selected[activeTab] ?? 0) === idx;
                  return (
                    <button
                      key={opt.id}
                      onClick={() =>
                        setSelected((p) => ({ ...p, [activeTab]: idx }))
                      }
                      className="w-full text-left rounded-xl border transition-all p-3 sm:p-3.5 flex gap-3"
                      style={{
                        borderColor: isSel
                          ? isCartTab
                            ? "#7C3AED"
                            : "#BA7517"
                          : "#E2E8F0",
                        background: isSel
                          ? isCartTab
                            ? "#FAF5FF"
                            : "#FFFBF5"
                          : "transparent",
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{
                            borderColor: isSel
                              ? isCartTab
                                ? "#7C3AED"
                                : "#BA7517"
                              : "#CBD5E1",
                          }}
                        >
                          {isSel && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                background: isCartTab ? "#7C3AED" : "#BA7517",
                              }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">
                            {opt.name}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{
                              background: opt.badgeBg,
                              color: opt.badgeColor,
                            }}
                          >
                            {opt.badge}
                          </span>
                          {opt.isImage && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600 flex items-center gap-0.5 flex-shrink-0">
                              <Image className="h-2.5 w-2.5" /> IMAGE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {opt.desc}
                        </p>
                        {opt.isCartRecovery && (
                          <p className="text-xs text-violet-600 mt-1 font-medium">
                            ⏱ Sends {opt.delayMinutes} min after abandonment
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => navigate("/template/create")}
                  className="w-full text-left rounded-xl border border-dashed border-slate-300 p-3 sm:p-3.5 flex gap-3 hover:border-slate-400 hover:bg-slate-50 transition-all"
                >
                  <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-slate-600">
                      Custom template
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Build your own in the Template builder
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 ml-auto flex-shrink-0 self-center" />
                </button>
              </div>
            </div>

            {/* Template structure */}
            {currentTpl && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">
                    Template structure
                  </p>
                  <button
                    onClick={() => copyTemplateBody(currentTpl)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100"
                  >
                    <Copy className="h-3 w-3" /> Copy body
                  </button>
                </div>
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Header
                    </p>
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                      {currentTpl.isImage ? (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Image className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="font-medium">
                            {currentTpl.isCartRecovery
                              ? "IMAGE — abandoned product photo attached automatically"
                              : "IMAGE — product photo attached automatically from order"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-700">
                          {currentTpl.header}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Body
                    </p>
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p
                        className="text-xs leading-relaxed text-slate-700"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {currentTpl.body}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                      Footer
                    </p>
                    <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400">
                        {currentTpl.footer}
                      </p>
                    </div>
                  </div>
                  {currentTpl.isCartRecovery && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                        Button
                      </p>
                      <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                        <p className="text-xs text-emerald-700 font-medium">
                          Complete Purchase → (URL button to checkout)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Variable mapping */}
            {currentTpl && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800">
                    Variable mapping
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filled automatically from the WooCommerce order at send time
                  </p>
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                  {currentTpl.vars.map((fieldName, idx) => {
                    const meta = VAR_MAP[fieldName] || {
                      label: fieldName,
                      example: "",
                    };
                    return (
                      <div
                        key={fieldName}
                        className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap sm:flex-nowrap"
                      >
                        <code
                          className="px-2 py-1 rounded-lg font-mono text-xs flex-shrink-0"
                          style={{ background: "#FAEEDA", color: "#854F0B" }}
                        >
                          {`{{${idx + 1}}}`}
                        </code>
                        <span className="text-slate-400 flex-shrink-0">→</span>
                        <span className="text-slate-700 font-medium">
                          {meta.label}
                        </span>
                        <span className="text-slate-400 sm:ml-auto flex-shrink-0 hidden sm:inline">
                          e.g. "{meta.example}"
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right — phone preview + action */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mobile preview toggle */}
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="w-full py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 flex items-center justify-center gap-2 lg:hidden"
            >
              {showPreview ? "Hide preview" : "Show WhatsApp preview"}
              <ChevronRight
                className={`h-3.5 w-3.5 transition-transform ${showPreview ? "rotate-90" : ""}`}
              />
            </button>

            <div
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 lg:sticky lg:top-5 ${showPreview ? "block" : "hidden lg:block"}`}
            >
              <p className="text-xs font-semibold text-slate-800 text-center mb-4">
                WhatsApp preview
              </p>

              <PhonePreview template={currentTpl} />

              {currentTpl && (
                <div className="mt-3 text-center text-xs">
                  {currentTpl.isImage ? (
                    <span className="text-blue-600 font-medium">
                      🖼️ Real{" "}
                      {currentTpl.isCartRecovery
                        ? "abandoned product"
                        : "product"}{" "}
                      image replaces placeholder at send time
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      <span style={{ color: "#BA7517" }}>Orange text</span> =
                      filled from order data
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleUseTemplate(activeTab)}
                  disabled={isCreating || !currentTpl}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isConnected
                      ? "#1D9E75"
                      : isCartTab
                        ? "#7C3AED"
                        : "#1a1a1a",
                  }}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : isConnected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Re-create
                      template
                    </>
                  ) : isCartTab ? (
                    <>
                      <ShoppingCart className="h-3.5 w-3.5" /> Enable cart
                      recovery
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" /> Use this template
                    </>
                  )}
                </button>

                {/* Checkout URL input — cart recovery only */}
                {isCartTab && (
                  <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">🔗</span>
                      <div>
                        <p className="text-xs font-medium text-violet-800">
                          Checkout URL for button
                        </p>
                        <p className="text-xs text-violet-600 mt-0.5 leading-relaxed">
                          This URL is added as a button in the WhatsApp message
                          so customers can tap to complete their purchase.
                        </p>
                      </div>
                    </div>
                    <input
                      type="url"
                      value={checkoutUrl}
                      onChange={(e) => setCheckoutUrl(e.target.value)}
                      placeholder="https://your-store.com/checkout"
                      className="w-full px-3 py-2 text-xs border border-violet-200 rounded-lg focus:outline-none focus:border-violet-400 bg-white"
                    />
                    <p className="text-xs text-violet-500">
                      Pre-filled from your store URL. Edit if your checkout page
                      is different.
                    </p>
                  </div>
                )}

                {/* Next tab button */}
                {(() => {
                  const idx = ALL_TABS.indexOf(activeTab);
                  const next = ALL_TABS[idx + 1];
                  if (!next) return null;
                  return (
                    <button
                      onClick={() => setActiveTab(next)}
                      className="w-full py-2.5 rounded-xl text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                    >
                      Next: {EVENT_META[next].emoji} {EVENT_META[next].label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  );
                })()}

                <button
                  onClick={() => navigate("/template/create")}
                  className="w-full py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> Create custom template
                  instead
                </button>
              </div>

              {!connection && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center leading-relaxed border border-slate-200">
                  <strong className="text-slate-700">
                    No store connected.
                  </strong>
                  <br />
                  Template will be created but automation won't be set up.{" "}
                  <button
                    onClick={() => navigate("/integrations/woocommerce")}
                    className="text-amber-600 underline"
                  >
                    Connect store first
                  </button>
                </div>
              )}

              {currentTpl && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">
                    Template name (Meta)
                  </p>
                  <code className="text-xs bg-slate-50 px-2 py-1.5 rounded-lg block text-slate-600 break-all border border-slate-200">
                    {currentTpl.apiName}_xxxxxx
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
