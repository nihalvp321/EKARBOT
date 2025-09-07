import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, X, Send, Square, MicOff, Volume2 } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onVoiceMessage: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecorder = ({ onVoiceMessage, disabled, className }: VoiceRecorderProps) => {
  const { isRecording, isProcessing, recordingTime, startRecording, stopRecording, cancelRecording } = useVoiceRecording();
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    setShowRecordingUI(isRecording || isProcessing);
  }, [isRecording, isProcessing]);

  // Simulate audio levels for visual feedback
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAudioLevels(prev => prev.map(() => Math.random() * 100));
      }, 150);
      return () => clearInterval(interval);
    } else {
      setAudioLevels([0, 0, 0, 0, 0]);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopAndSend = async () => {
    const transcribedText = await stopRecording();
    if (transcribedText) {
      onVoiceMessage(transcribedText);
    }
    setShowRecordingUI(false);
  };

  const handleCancel = () => {
    cancelRecording();
    setShowRecordingUI(false);
  };

  if (showRecordingUI) {
    return (
      <div className="flex items-center gap-3 h-16 px-4 bg-gradient-to-r from-red-50 via-pink-50 to-red-50 rounded-2xl border-2 border-red-200 shadow-xl backdrop-blur-sm transition-all duration-500 animate-in slide-in-from-right-5">
        {/* Cancel Button */}
        <Button
          onClick={handleCancel}
          variant="ghost"
          size="icon"
          className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all duration-200 hover:scale-110"
          disabled={isProcessing}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Recording Visualization */}
        <div className="flex items-center gap-3 flex-1">
          {/* Microphone Icon with Animation */}
          <div className="relative">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
              isRecording 
                ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50" 
                : "bg-blue-500"
            )}>
              {isRecording ? (
                <Mic className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white animate-spin" />
              )}
            </div>
            
            {/* Pulse rings for recording */}
            {isRecording && (
              <>
                <div className="absolute inset-0 w-10 h-10 border-2 border-red-400 rounded-full animate-ping opacity-60"></div>
                <div className="absolute inset-0 w-10 h-10 border-2 border-red-300 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
              </>
            )}
          </div>

          {/* Status and Visualizer */}
          <div className="flex flex-col gap-1">
            {/* Status Text */}
            <div className="flex items-center gap-2">
              {isRecording && (
                <>
                  <span className="text-sm font-semibold text-red-600">Recording</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    {formatTime(recordingTime)}
                  </span>
                </>
              )}
              {isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-blue-600">Processing audio...</span>
                </div>
              )}
            </div>

            {/* Audio Level Visualizer */}
            {isRecording && (
              <div className="flex items-end gap-0.5 h-6">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-red-500 to-pink-400 rounded-full transition-all duration-150 ease-out"
                    style={{
                      width: '3px',
                      height: `${Math.max(4, (level / 100) * 24)}px`,
                      opacity: 0.7 + (level / 100) * 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleStopAndSend}
          variant="ghost"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-xl transition-all duration-200 hover:scale-110",
            isRecording 
              ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 bg-orange-100" 
              : "text-green-600 hover:text-green-700 hover:bg-green-50 bg-green-100"
          )}
          disabled={isProcessing}
        >
          {isRecording ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleStartRecording}
      disabled={disabled}
      className={cn(
        "h-14 w-14 min-w-[56px] flex items-center justify-center rounded-xl shadow-lg transition-all duration-300 group relative overflow-hidden",
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-105 active:scale-95",
        className
      )}
      aria-label="Start voice recording"
    >
      {/* Background shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
      
      {/* Mic icon */}
      <Mic className={cn(
        "w-5 h-5 transition-all duration-200",
        disabled ? "opacity-50" : "group-hover:scale-110"
      )} />
      
      {/* Subtle pulse when enabled */}
      {!disabled && (
        <div className="absolute inset-0 rounded-xl border-2 border-green-400 opacity-0 group-hover:opacity-30 animate-ping"></div>
      )}
    </Button>
  );
};