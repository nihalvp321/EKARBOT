
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Mic, X, Image, FileText, Video } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSendMessage: (text: string) => void;
  onSendFiles: (files: File[], caption?: string) => void;
  onSendVoice: (audioBlob: Blob) => void;
  disabled?: boolean;
}

const WhatsAppMessageInput = ({
  value,
  onChange,
  onSendMessage,
  onSendFiles,
  onSendVoice,
  disabled = false
}: WhatsAppMessageInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [caption, setCaption] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting voice recording...');
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Try different MIME types for better compatibility
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm', audioBitsPerSecond: 128000 };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4', audioBitsPerSecond: 128000 };
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing audio...');
        console.log('Total chunks collected:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/webm' 
          });
          console.log('Created audio blob:', blob.size, 'bytes', 'type:', blob.type);
          
          if (blob.size > 100) { // Minimum viable audio size
            onSendVoice(blob);
          } else {
            console.error('Audio blob too small:', blob.size, 'bytes');
            toast.error('Recording too short - please try again');
          }
        } else {
          console.error('No audio chunks collected');
          toast.error('No audio recorded - please try again');
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Recording failed');
        setIsRecording(false);
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
        setIsRecording(true);
        setRecordingTime(0);
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      };

      // Start recording with smaller timeslice for more frequent data capture
      mediaRecorder.start(100); // Capture every 100ms
      
      console.log('Recording started with MIME type:', mediaRecorder.mimeType);
      console.log('Recording state:', mediaRecorder.state);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  }, [onSendVoice]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder stop called');
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const handleMouseDown = () => {
    if (disabled || isRecording) return;
    longPressTimerRef.current = setTimeout(() => {
      startRecording();
    }, 200);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log('Files selected:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    if (files.length > 0) {
      setSelectedFiles(files);
      setShowFilePreview(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendFiles = () => {
    console.log('Sending files with caption:', caption);
    onSendFiles(selectedFiles, caption);
    setSelectedFiles([]);
    setCaption('');
    setShowFilePreview(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSendMessage(value);
      }
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showFilePreview) {
    return (
      <div className="p-4 border-t bg-white">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Send {selectedFiles.length} file(s)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowFilePreview(false);
                setSelectedFiles([]);
                setCaption('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedFiles.slice(0, 3).map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-sm">
                {getFileIcon(file.type)}
                <span className="truncate max-w-32">{file.name}</span>
              </div>
            ))}
            {selectedFiles.length > 3 && (
              <div className="bg-gray-100 rounded-lg p-2 text-sm">
                +{selectedFiles.length - 3} more
              </div>
            )}
          </div>

          <Textarea
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mb-3 min-h-[60px]"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowFilePreview(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendFiles} className="bg-slate-600 hover:bg-slate-700">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t bg-white">
      {isRecording && (
        <div className="mb-3 p-3 bg-red-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 font-medium">Recording... {formatTime(recordingTime)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopRecording}
            className="text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          size="sm"
          className="p-2 rounded-full hover:bg-gray-100 flex-shrink-0"
          disabled={disabled || isRecording}
        >
          <Paperclip className="h-5 w-5 text-gray-600" />
        </Button>

        <div className="flex-1">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={handleKeyPress}
            className="min-h-[40px] max-h-32 py-2 px-3 rounded-2xl border-gray-300 resize-none"
            disabled={disabled || isRecording}
            rows={1}
          />
        </div>

        {value.trim() ? (
          <Button
            onClick={() => onSendMessage(value)}
            disabled={disabled}
            className="p-2 rounded-full bg-slate-600 hover:bg-slate-700 min-w-[40px] h-[40px] flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            disabled={disabled}
            className={`p-2 rounded-full min-w-[40px] h-[40px] flex-shrink-0 ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-slate-600 hover:bg-slate-700'
            }`}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessageInput;
