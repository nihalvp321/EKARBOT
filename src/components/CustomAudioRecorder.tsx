import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomAudioRecorderProps {
  onRecordingComplete: (audioUrl: string, transcribedText: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CustomAudioRecorder: React.FC<CustomAudioRecorderProps> = ({
  onRecordingComplete,
  disabled,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });
    }
  };

  const uploadAndTranscribe = async () => {
    if (!audioBlob) {
      toast.error('No audio recording found');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting audio upload and transcription...');
      
      // Generate unique filename
      const filename = `recording_${Date.now()}.webm`;
      const filepath = `audio/${filename}`;

      console.log('Uploading to:', filepath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('developer-files')
        .upload(filepath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('developer-files')
        .getPublicUrl(filepath);

      console.log('Public URL:', publicUrl);

      // Convert audio to base64 for transcription
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          console.log('Converting audio for transcription...');
          const base64Audio = (reader.result as string).split(',')[1];
          
          console.log('Calling speech-to-text function...');
          // Call speech-to-text function
          const { data: transcriptionData, error: transcriptionError } = await supabase.functions
            .invoke('speech-to-text', {
              body: { audio: base64Audio }
            });

          if (transcriptionError) {
            console.error('Transcription error:', transcriptionError);
            throw new Error(`Transcription failed: ${transcriptionError.message}`);
          }

          console.log('Transcription result:', transcriptionData);
          const transcribedText = transcriptionData?.text || '';
          
          // Call the completion callback
          onRecordingComplete(publicUrl, transcribedText);
          
          // Reset state
          setAudioUrl(null);
          setAudioBlob(null);
          setRecordingTime(0);
          
          toast.success('Audio recorded and transcribed successfully!');
          
        } catch (error) {
          console.error('Error in transcription process:', error);
          // Still return the audio URL even if transcription fails
          onRecordingComplete(publicUrl, '');
          
          // Reset state
          setAudioUrl(null);
          setAudioBlob(null);
          setRecordingTime(0);
          
          toast.error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Error in upload process:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
        {!isRecording && !audioUrl && (
          <Button
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <div className="flex items-center gap-4">
            <Button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            </div>
            {/* Audio visualizer bars */}
            <div className="flex items-end gap-1 h-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-bounce"
                  style={{
                    height: `${Math.random() * 100 + 20}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className="flex items-center gap-4">
            <Button
              onClick={playRecording}
              variant="outline"
              disabled={isProcessing}
            >
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            <Button
              onClick={uploadAndTranscribe}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Save & Transcribe'}
            </Button>
            <Button
              onClick={() => {
                setAudioUrl(null);
                setAudioBlob(null);
                setRecordingTime(0);
              }}
              variant="outline"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <span className="text-sm text-muted-foreground">
              Duration: {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Processing audio...</span>
          </div>
        )}
      </div>
    </div>
  );
};