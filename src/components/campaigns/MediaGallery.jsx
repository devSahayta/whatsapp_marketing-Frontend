// src/components/campaigns/MediaGallery.jsx
// Media gallery with actual image previews

import { useState, useEffect } from 'react';
import { Image, Video, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MediaGallery = ({ userId, accountId, onSelect, selectedMediaId }) => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (accountId) {
      fetchMediaList();
    }
  }, [accountId]);

  const fetchMediaList = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${BACKEND_URL}/api/media/list`, {
        params: { account_id: accountId }
      });
      
      setMediaList(response.data.data || []);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter media based on search query
  const filteredMedia = mediaList.filter(media =>
    media.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading media library...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchMediaList}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (mediaList.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No media uploaded yet</p>
        <p className="text-sm text-gray-500 mt-2">Upload your first image, video, or document</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Select from Library
        </h3>
        <span className="text-sm text-gray-500">
          {mediaList.length} {mediaList.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* ✅ Search bar (shown if more than 6 files) */}
      {mediaList.length > 6 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Image className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ✅ Show filtered count */}
      {searchQuery && (
        <p className="text-sm text-gray-600">
          Showing {filteredMedia.length} of {mediaList.length} files
        </p>
      )}

      {/* ✅ Scrollable container with max height */}
      <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No files match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((media) => (
              <MediaCard
                key={media.wmu_id}
                media={media}
                userId={userId}
                isSelected={selectedMediaId === media.media_id}
                onSelect={() => onSelect(media)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ✅ Show scroll hint if many images */}
      {filteredMedia.length > 12 && (
        <p className="text-sm text-gray-500 text-center pt-2 border-t">
          Scroll to see all {filteredMedia.length} files
        </p>
      )}
    </div>
  );
};

/* =====================================
   MEDIA CARD - Shows actual image preview
====================================== */

const MediaCard = ({ media, userId, isSelected, onSelect }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // ✅ Check if it's an image (image/png, image/jpeg, etc.)
    if (media.type && media.type.startsWith('image/')) {
      loadImagePreview();
    } else {
      setImageLoading(false);
    }
  }, [media]);

  const loadImagePreview = async () => {
    try {
      setImageLoading(true);
      
      // Get access token
      const tokenRes = await axios.get(`${BACKEND_URL}/api/waccount/get-waccount?user_id=${userId}`);
      const accessToken = tokenRes.data.data.system_user_access_token;
      
      // Step 1: Get WhatsApp media URL
      const response = await axios.get(
        `https://graph.facebook.com/v21.0/${media.media_id}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      
      const whatsappMediaUrl = response.data.url;
      
      // Step 2: Use proxy endpoint (same as template preview)
      const proxyUrl = `${BACKEND_URL}/api/watemplates/media-proxy-url?url=${encodeURIComponent(whatsappMediaUrl)}&user_id=${userId}`;
      
      setImageUrl(proxyUrl);
      setImageLoading(false);
    } catch (err) {
      console.error('Error loading image preview:', err);
      setImageError(true);
      setImageLoading(false);
    }
  };

  const getFileIcon = () => {
    if (media.type && media.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-600" />;
    }
    if (media.type && media.type.startsWith('video/')) {
      return <Video className="w-8 h-8 text-purple-600" />;
    }
    return <FileText className="w-8 h-8 text-green-600" />;
  };

  const getFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderPreview = () => {
    // ✅ For images (image/png, image/jpeg, etc.)
    if (media.type && media.type.startsWith('image/')) {
      if (imageLoading) {
        return (
          <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        );
      }

      if (imageError || !imageUrl) {
        return (
          <div className="w-full h-40 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
            <Image className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Preview unavailable</span>
          </div>
        );
      }

      // ✅ Show actual image
      return (
        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={media.file_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    // For videos and documents, show icon
    return (
      <div className="w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex flex-col items-center justify-center">
        {getFileIcon()}
        <span className="text-xs text-gray-600 mt-2 uppercase font-medium">
          {media.type.split('/')[0]}
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-xl border-2 transition-all duration-200
        ${isSelected 
          ? 'border-blue-600 bg-blue-50 shadow-lg scale-105' 
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-blue-600 rounded-full p-1">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Image preview */}
        {renderPreview()}

        {/* File info */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 truncate" title={media.file_name}>
            {media.file_name}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{getFileSize(media.size_bytes)}</span>
            <span className="capitalize">{media.type.split('/')[1]}</span>
          </div>
        </div>

        {/* Upload date */}
        <div className="text-xs text-gray-400">
          {new Date(media.uploaded_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;