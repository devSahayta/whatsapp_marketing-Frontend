"use client";

import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

const fields = [
  {
    name: "app_id",
    label: "App ID",
    placeholder: "Enter your Meta app ID",
  },
  {
    name: "waba_id",
    label: "WhatsApp Business Account ID",
    placeholder: "Enter your WABA ID",
  },
  {
    name: "phone_number_id",
    label: "Phone Number ID",
    placeholder: "Enter your phone number ID",
  },
  {
    name: "business_phone_number",
    label: "Business Phone Number",
    placeholder: "Enter your WhatsApp business number",
  },
  {
    name: "system_user_access_token",
    label: "System User Access Token",
    placeholder: "Paste the system user token",
    isTextArea: true,
  },
];

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-70";

const WhatsaapForm = ({
  mode,
  existingData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { user } = useKindeAuth();

  const [form, setForm] = useState({
    user_id: "",
    app_id: "",
    waba_id: "",
    phone_number_id: "",
    business_phone_number: "",
    system_user_access_token: "",
  });

  useEffect(() => {
    if (existingData) {
      setForm({
        user_id: existingData.user_id || "",
        app_id: existingData.app_id || "",
        waba_id: existingData.waba_id || "",
        phone_number_id: existingData.phone_number_id || "",
        business_phone_number: existingData.business_phone_number || "",
        system_user_access_token: existingData.system_user_access_token || "",
      });
    }
  }, [existingData]);

  useEffect(() => {
    if (user && mode === "create") {
      setForm((prev) => ({
        ...prev,
        user_id: user.id,
      }));
    }
  }, [user, mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/10">
          <img src="/images/meta.png" alt="Meta" className="h-8 w-8 object-contain" />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
            Account Setup
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === "create"
              ? "Connect WhatsApp Account"
              : "Update WhatsApp Account"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {mode === "create"
              ? "Add your Meta and WhatsApp credentials to activate templates, campaigns, and chat."
              : "Change these values only when your Meta configuration or credentials are updated."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.name}
              className={
                field.isTextArea
                  ? "md:col-span-2 flex flex-col gap-2"
                  : "flex flex-col gap-2"
              }
            >
              <span className="text-sm font-semibold text-slate-700">
                {field.label}
              </span>

              {field.isTextArea ? (
                <textarea
                  name={field.name}
                  rows={5}
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder={field.placeholder}
                  className={`${inputClassName} resize-y`}
                />
              ) : (
                <input
                  type="text"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder={field.placeholder}
                  className={inputClassName}
                />
              )}
            </label>
          ))}
        </div>

        <input type="hidden" name="user_id" value={form.user_id} />

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          {mode === "update" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-700 to-cyan-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-900/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
                ? "Create Account"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WhatsaapForm;
