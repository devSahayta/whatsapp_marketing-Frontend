import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const exportCampaignPdf = ({ campaign, stats, messages }) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Campaign Report", 14, 20);

  doc.setFontSize(11);
  doc.text(`Campaign Name: ${campaign.campaign_name}`, 14, 30);
  doc.text(`Status: ${campaign.status}`, 14, 36);
  doc.text(
    `Scheduled At: ${new Date(campaign.scheduled_at).toLocaleString("en-IN")}`,
    14,
    42,
  );

  // Summary table
  doc.setFontSize(13);
  doc.text("Summary", 14, 54);

  autoTable(doc, {
    startY: 58,
    head: [["Total", "Sent", "Delivered", "Read", "Failed"]],
    body: [
      [stats.total, stats.sent, stats.delivered, stats.read, stats.failed],
    ],
    theme: "grid",
  });

  // Messages table
  const startY = doc.lastAutoTable.finalY + 14;

  doc.setFontSize(13);
  doc.text("Message Details", 14, startY);

  autoTable(doc, {
    startY: startY + 4,
    head: [["Name", "Phone", "Status", "Sent At"]],
    body: messages.map((m) => [
      m.contact_name || "-",
      m.phone_number,
      m.status,
      m.sent_at ? new Date(m.sent_at).toLocaleString("en-IN") : "-",
    ]),
    styles: { fontSize: 9 },
    theme: "striped",
  });

  doc.save(`${campaign.campaign_name}-report.pdf`);
};
