import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowUp, Square } from "lucide-react"; 
import { FaMicrophone } from "react-icons/fa"; 
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onVoiceMessage: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecorder = ({
  onVoiceMessage,
  disabled,
  className,
}: VoiceRecorderProps) => {
  const {
    isRecording,
    isProcessing,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecording();

  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    setShowRecordingUI(isRecording || isProcessing);
  }, [isRecording, isProcessing]);

  // Fake audio bars for visual feedback
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAudioLevels((prev) => prev.map(() => Math.random() * 100));
      }, 120);
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
      <div className="flex items-center gap-2 h-12 px-2 bg-white border border-gray-200 rounded-lg shadow-md transition-all duration-500 animate-in fade-in">
        {/* Cancel */}
        <Button
          onClick={handleCancel}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-[#455560] rounded-full transition"
          disabled={isProcessing}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Mic status + visualizer */}
        <div className="flex-1 flex items-center gap-2">
          {/* Mic Icon */}
          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                isRecording
                  ? "bg-[#455560] text-white animate-pulse"
                  : "bg-[#455560] text-white"
              )}
            >
              {isRecording ? (
                <FaMicrophone className="w-4 h-4" /> 
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </div>

            {/* Ripple effect while recording */}
            {isRecording && (
              <span className="absolute inline-flex h-full w-full rounded-full border border-[#455560] animate-ping opacity-60"></span>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            {isRecording && (
              <div className="flex items-center gap-2 text-xs font-medium text-[#455560]">
                <span>Recording</span>
                <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">
                  {formatTime(recordingTime)}
                </span>
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-[#455560] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <span className="text-[#455560]">Processing...</span>
              </div>
            )}

            {/* Equalizer bars */}
            {isRecording && (
              <div className="flex items-end gap-0.5 h-4">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="bg-[#455560] rounded-full transition-all duration-150 ease-out"
                    style={{
                      width: '2px',
                      height: `${Math.max(2, (level / 100) * 16)}px`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stop / Send */}
        <Button
          onClick={handleStopAndSend}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-gray-100 transition"
          disabled={isProcessing}
        >
          {isRecording ? (
            <Square className="w-4 h-4" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  // Idle Mic button (compact)
  return (
    <button
      onClick={handleStartRecording}
      disabled={disabled}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-black hover:bg-gray-100 transition",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label="Start recording"
    >
      <FaMicrophone className="w-3 h-3 sm:h-3 sm:w-3" /> {/* ✅ Idle state mic updated */}
    </button>
  );
};
