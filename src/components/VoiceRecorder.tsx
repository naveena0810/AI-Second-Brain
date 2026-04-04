"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import ActionButton from "./ActionButton";
import GlassCard from "./GlassCard";

interface Props {
  onProcess: (transcript: string) => void;
  isProcessing: boolean;
}

export default function VoiceRecorder({ onProcess, isProcessing }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === "no-speech") return;
          
          if (event.error === "not-allowed") {
            console.warn("Microphone access denied.");
            setError("Microphone access denied. Please allow permissions.");
          } else {
            console.warn("Speech recognition error", event.error);
            setError(`Microphone error: ${event.error}`);
          }
          
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setError("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (error && !recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setError("");
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setError("");
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-8">
      <div className="flex flex-col items-center justify-center text-center space-y-8">
        
        {/* Glow Mic Button */}
        <div className="relative">
          {/* Animated glow background */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.5, scale: 1.5 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 rounded-full blur-2xl"
                style={{ background: "linear-gradient(135deg, var(--accent-tertiary), var(--accent-secondary))" }}
              />
            )}
          </AnimatePresence>
          
          <motion.button
            onClick={toggleRecording}
            disabled={!!(!recognitionRef.current && error) || isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ 
              background: isRecording ? "linear-gradient(135deg, var(--accent-tertiary), #E86B5A)" : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              color: "white" 
            }}
          >
            {isRecording ? <Square size={36} fill="white" /> : <Mic size={42} />}
          </motion.button>
        </div>

        <div className="h-6">
          {isRecording ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 font-bold text-sm tracking-widest uppercase" style={{ color: "var(--accent-tertiary)" }}>
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--accent-tertiary)" }} /> Recording...
            </motion.div>
          ) : (
            <span className="text-sm font-bold tracking-widest uppercase opacity-40" style={{ color: "var(--text-secondary)" }}>
              Click microphone to start
            </span>
          )}
        </div>
      </div>

      {error ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border border-red-100">
          <AlertCircle size={20} />
          {error}
        </motion.div>
      ) : null}

      {/* Transcript Box */}
      <GlassCard className="relative min-h-[220px] flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-50" style={{ color: "var(--text-secondary)" }}>
            <Mic size={14} /> Live Transcript
          </div>
          {transcript && !isRecording && (
            <button onClick={clearTranscript} className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--text-secondary)" }} title="Clear">
              <RefreshCcw size={16} />
            </button>
          )}
        </div>
        
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Start speaking and your thoughts will appear here..."
          className="flex-1 w-full bg-transparent resize-none outline-none font-medium leading-relaxed text-lg z-10 custom-scrollbar disabled:opacity-70"
          style={{ color: "var(--text-primary)" }}
          disabled={isRecording || isProcessing}
        />
        
        {!transcript && !isRecording && (
          <div className="absolute inset-0 top-16 flex items-center justify-center pointer-events-none opacity-10">
            <Mic size={48} />
          </div>
        )}
      </GlassCard>

      <div className="flex justify-center mt-8">
        <ActionButton 
          size="lg" 
          onClick={() => onProcess(transcript)} 
          disabled={!transcript.trim() || isRecording || isProcessing}
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Structuring thoughts...
            </>
          ) : (
            <>
              <SparklesIcon /> Convert to Brain Note
            </>
          )}
        </ActionButton>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
