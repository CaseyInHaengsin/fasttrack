import React, { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Camera, Upload, X } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarDataUrl: string) => void;
  onRemoveAvatar: () => void;
  theme: string;
}

export function AvatarUpload({ currentAvatar, onAvatarChange, onRemoveAvatar, theme }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isDarkTheme = theme === 'dark' || theme === 'midnight';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Create an image to resize it
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize to 200x200
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          
          // Calculate crop dimensions to maintain aspect ratio
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onAvatarChange(resizedDataUrl);
          setIsUploading(false);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
          isDarkTheme ? 'border-gray-600' : 'border-gray-200'
        } ${currentAvatar ? '' : isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-400'
            }`}>
              <Camera className="w-12 h-12" />
            </div>
          )}
        </div>
        
        {currentAvatar && (
          <button
            onClick={onRemoveAvatar}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : currentAvatar ? 'Change' : 'Upload'}
        </Button>
      </div>

      <p className={`text-xs text-center ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
        Upload a profile picture<br />
        Max 2MB, will be resized to 200x200
      </p>
    </div>
  );
}