// src/components/campaigns/CarouselPreview.jsx
//
// Carousel card preview with minimal inline inputs — only for card buttons
// that actually contain a {{}} variable in their URL. Everything else
// (images, body text, static buttons) stays read-only. Body {{1}} (name)
// is NOT collected here — it's auto-filled with the recipient's name at
// send time by the scheduler, no input needed.

import { useState } from "react";
import { ImageIcon } from "lucide-react";

export default function CarouselPreview({ preview, userId, values, onChange }) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const setButtonValue = (cardIndex, btnIndex, val) => {
    if (!onChange) return;
    const cardKey = String(cardIndex);
    const btnKey = String(btnIndex);
    const currentCard = values?.[cardKey] || {};
    onChange({
      ...values,
      [cardKey]: { ...currentCard, [btnKey]: val },
    });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-blue-600" />
        Carousel Preview ({preview.cards.length} cards)
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {preview.cards.map((card) => (
          <CardPreview
            key={card.card_index}
            card={card}
            userId={userId}
            backendUrl={BACKEND_URL}
            cardValues={values?.[String(card.card_index)] || {}}
            onButtonChange={(btnIndex, val) =>
              setButtonValue(card.card_index, btnIndex, val)
            }
          />
        ))}
      </div>
    </div>
  );
}

function CardPreview({ card, userId, backendUrl, cardValues, onButtonChange }) {
  const [imgError, setImgError] = useState(false);

  const imageUrl = card.preview_image_url
    ? `${backendUrl}/api/watemplates/media-proxy-url?url=${encodeURIComponent(
        card.preview_image_url,
      )}&user_id=${userId}`
    : null;

  return (
    <div className="flex-shrink-0 w-56 bg-white border border-gray-300 rounded-xl overflow-hidden">
      <div className="h-32 bg-gray-100 flex items-center justify-center">
        {imageUrl && !imgError ? (
          card.header_format === "VIDEO" ? (
            <video
              src={imageUrl}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src={imageUrl}
              alt={`Card ${card.card_index + 1}`}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <div className="p-3 space-y-2">
        <p className="text-xs text-gray-500">Card {card.card_index + 1}</p>

        {card.body_text && (
          <p className="text-xs text-gray-700 line-clamp-2">{card.body_text}</p>
        )}

        {card.buttons.map((btn, btnIndex) => {
          const needsValue =
            btn.type === "URL" && btn.url && btn.url.includes("{{");

          if (!needsValue) {
            // Static button — quick_reply, phone_number, or a URL with no
            // variable — nothing to fill in, just display it.
            return (
              <div
                key={btnIndex}
                className="text-xs text-blue-600 border-t pt-2"
              >
                {btn.text}
              </div>
            );
          }

          return (
            <div key={btnIndex} className="border-t pt-2">
              <label className="block text-xs text-gray-500 mb-1">
                {btn.text} link value
              </label>
              <input
                type="text"
                value={cardValues[String(btnIndex)] || ""}
                onChange={(e) => onButtonChange(btnIndex, e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. product-slug or code"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
