import { useEffect, useState } from "react";

async function getMediaType(url) {
  const res = await fetch(url, { method: "HEAD" });
  return res.headers.get("content-type");
}

export default function MediaPreview({ mediaId, userId }) {
  const [mimeType, setMimeType] = useState(null);

  const previewUrl = `${
    import.meta.env.VITE_BACKEND_URL
  }/api/watemplates/media-proxy/${mediaId}?user_id=${userId}`;

  useEffect(() => {
    let mounted = true;

    getMediaType(previewUrl)
      .then((type) => mounted && setMimeType(type))
      .catch(() => mounted && setMimeType("unknown"));

    return () => (mounted = false);
  }, [previewUrl]);

  if (!mimeType) {
    return <div className="text-xs text-gray-400">Loading preview…</div>;
  }

  // IMAGE
  if (mimeType.startsWith("image/")) {
    return (
      <img src={previewUrl} alt="media" className="max-h-48 rounded mx-auto" />
    );
  }

  // VIDEO
  if (mimeType.startsWith("video/")) {
    return (
      <video src={previewUrl} controls className="max-h-48 rounded mx-auto" />
    );
  }

  // PDF
  if (mimeType === "application/pdf") {
    return (
      <iframe
        src={previewUrl}
        title="PDF preview"
        className="w-full h-64 rounded"
      />
    );
  }

  // OTHER FILES
  return (
    <a
      href={previewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 text-sm underline"
    >
      Download file
    </a>
  );
}
