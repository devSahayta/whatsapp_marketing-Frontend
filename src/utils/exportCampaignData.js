import * as XLSX from "xlsx";

const HEADERS = [
  "Contact Name",
  "Phone",
  "Status",
  "Sent At",
  "Delivered At",
  "Read At",
  "Failed At",
  "Error Code",
  "Error Message",
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "";

const toRows = (messages = []) =>
  messages.map((m) => ({
    "Contact Name": m.contact_name ?? "",
    Phone: m.phone_number ?? "",
    Status: m.status ?? "",
    "Sent At": formatDate(m.sent_at),
    "Delivered At": formatDate(m.delivered_at),
    "Read At": formatDate(m.read_at),
    "Failed At": formatDate(m.failed_at),
    "Error Code": m.error_code ?? "",
    "Error Message": m.error_message ?? "",
  }));

const buildFileName = (campaign, suffix, ext) => {
  const base = (campaign?.campaign_name || "campaign")
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim();
  return `${base}${suffix ? `-${suffix}` : ""}.${ext}`;
};

const buildSheet = (messages) => {
  // Phone numbers stay strings, so Excel won't turn them into 9.2E+09.
  const sheet = XLSX.utils.json_to_sheet(toRows(messages), {
    header: HEADERS,
  });
  sheet["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 48 },
  ];
  return sheet;
};

export const exportCampaignExcel = ({ campaign, messages, suffix }) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildSheet(messages), "Messages");
  XLSX.writeFile(workbook, buildFileName(campaign, suffix, "xlsx"));
};

export const exportCampaignCsv = ({ campaign, messages, suffix }) => {
  const csv = XLSX.utils.sheet_to_csv(buildSheet(messages));
  // The BOM makes Excel read the file as UTF-8, so Hindi or other non-Latin names display correctly.
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildFileName(campaign, suffix, "csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
