
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Play, Pause, File, Image as ImageIcon, Video, Music, Mic, Volume2 } from 'lucide-react';

interface MessageAttachmentProps {
  url: string;
  type: string;
  name: string;
  size: number;
  isOwnMessage?: boolean;
}

const MessageAttachment = ({ url, type, name, size, isOwnMessage = false }: MessageAttachmentProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  if (type.startsWith('image/')) {
    return (
      <div className="relative group">
        <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
          <img 
            src={url} 
            alt={name} 
            className="w-full max-w-sm h-auto max-h-80 object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => window.open(url, '_blank')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full w-9 h-9 p-0 shadow-lg border-0"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className={`mt-2 px-1 text-xs ${
          isOwnMessage ? 'text-blue-100/80' : 'text-gray-500'
        }`}>
          <span className="truncate">{name} • {formatFileSize(size)}</span>
        </div>
      </div>
    );
  }

  if (type.startsWith('video/')) {
    return (
      <div className="group">
        <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-black">
          <video 
            controls 
            className="w-full max-w-sm h-auto max-h-80 object-cover"
            src={url}
            style={{ maxHeight: '320px' }}
          />
        </div>
        <div className={`flex items-center justify-between mt-3 px-1 text-xs ${
          isOwnMessage ? 'text-blue-100/80' : 'text-gray-500'
        }`}>
          <span className="truncate mr-3 flex items-center">
            <Video className="h-3 w-3 mr-1" />
            {name} • {formatFileSize(size)}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className={`h-7 w-7 p-0 rounded-full ${
              isOwnMessage 
                ? 'text-blue-100 hover:text-white hover:bg-white/10' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (type.startsWith('audio/')) {
    return (
      <div className={`rounded-2xl p-5 max-w-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
        isOwnMessage 
          ? 'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm border border-white/10' 
          : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100'
      }`}>
        <div className="flex items-center space-x-4 mb-4">
          <div className={`p-3 rounded-full ${
            isOwnMessage 
              ? 'bg-gradient-to-br from-white/20 to-white/10' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          } shadow-lg`}>
            <Volume2 className={`h-5 w-5 ${
              isOwnMessage ? 'text-white' : 'text-white'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${
              isOwnMessage ? 'text-white' : 'text-gray-800'
            }`}>
              Voice Message
            </p>
            <p className={`text-xs ${
              isOwnMessage ? 'text-blue-100/70' : 'text-gray-500'
            }`}>
              {formatFileSize(size)}
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <audio controls className="w-full h-8" style={{ filter: isOwnMessage ? 'invert(1) hue-rotate(180deg)' : 'none' }}>
            <source src={url} type={type} />
          </audio>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className={`h-8 w-8 p-0 rounded-full ${
              isOwnMessage 
                ? 'text-blue-100 hover:text-white hover:bg-white/10' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-5 max-w-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
      isOwnMessage 
        ? 'bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm border border-white/10' 
        : 'bg-gradient-to-br from-gray-50 to-white border border-gray-100'
    }`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-full ${
          isOwnMessage 
            ? 'bg-gradient-to-br from-white/20 to-white/10' 
            : 'bg-gradient-to-br from-gray-200 to-gray-300'
        } shadow-md`}>
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${
            isOwnMessage ? 'text-white' : 'text-gray-800'
          }`}>
            {name}
          </p>
          <p className={`text-xs ${
            isOwnMessage ? 'text-blue-100/70' : 'text-gray-500'
          }`}>
            {formatFileSize(size)}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDownload}
          className={`h-9 w-9 p-0 rounded-full ${
            isOwnMessage 
              ? 'text-blue-100 hover:text-white hover:bg-white/10' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageAttachment;
