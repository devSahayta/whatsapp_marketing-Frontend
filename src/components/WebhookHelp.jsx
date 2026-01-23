import { useState } from "react";

const WebhookHelp = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-indigo-600 font-semibold text-base focus:outline-none mx-auto "
      >
        <span className="text-lg">{open ? "▼" : "▶"}</span>
        How to connect Webhook?
      </button>

      {/* Expandable Content */}
      {open && (
        <div className="mt-4 p-6 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-800 leading-relaxed">
          {/* IMPORTANT NOTICE */}
          <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
            <p className="font-semibold mb-1">⚠️ Important</p>
            <p className="text-sm">
              Connecting the webhook is <b>mandatory</b>.
              <br />
              <b>
                Without this setup, you will NOT receive user messages or see
                conversations in the chat dashboard.
              </b>
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 mb-1">
            Step 1: Open Meta Webhooks
          </h4>
          <p className="mb-4">
            Go to <b>Meta Developers Dashboard</b> → Select your App →{" "}
            <b>WhatsApp</b> → <b>Configuration</b> → <b>Webhooks</b>
          </p>

          <h4 className="font-semibold text-gray-900 mb-1">
            Step 2: Set Callback URL
          </h4>
          <p className="mb-2">Paste the following URL:</p>
          <div className="mb-4 rounded-lg bg-white border px-4 py-2 font-mono text-xs text-gray-900">
            https://whatsapp-marketing-backend.vercel.app/api/webhooks/whatsapp
          </div>

          <h4 className="font-semibold text-gray-900 mb-1">
            Step 3: Set Verify Token
          </h4>
          <p className="mb-2">Enter text below (use the same text):</p>
          <div className="mb-4 rounded-lg bg-white border px-4 py-2 font-mono text-xs text-gray-900">
            sahaytaRSVP_whatsapp_bot_2025
          </div>

          <h4 className="font-semibold text-gray-900 mb-1">
            Step 4: Verify Webhook
          </h4>
          <p className="mb-4">
            Click <b>Verify and Save</b>. If successful, webhook will be
            verified.
          </p>

          <h4 className="font-semibold text-gray-900 mb-1">
            Step 5: Subscribe to Events
          </h4>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>
              <b>messages</b> – Receive incoming WhatsApp messages
            </li>
            <li>
              <b>message_template_status_update</b> – Template approval updates
            </li>
          </ul>

          <h4 className="font-semibold text-gray-900 mb-1">
            Step 6: Save & Test
          </h4>
          <p className="mb-4">
            Send a WhatsApp message to your business number and check your chat
            dashboard.
          </p>

          <hr className="my-4" />

          <p className="text-xs text-gray-500">
            ⚠️ Make sure your System User Token has{" "}
            <b>whatsapp_business_messaging</b> permission and your app is live.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebhookHelp;
