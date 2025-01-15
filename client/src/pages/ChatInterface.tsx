import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  Video,
  MessageSquare,
  Send,
  Mic,
  StopCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { base64ToFloat32Array, float32ToPcm16 } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  type: "user" | "assistant";
}

interface Config {
  systemPrompt: string;
  voice: string;
  googleSearch: boolean;
  allowInterruptions: boolean;
}

interface AudioInput {
  source: MediaStreamAudioSourceNode;
  processor: ScriptProcessorNode;
  stream: MediaStream;
}

// Fix for AudioContext type
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"];

const ChatMessages: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-3 max-w-[80%] break-words ${
            message.type === "user" ? "bg-blue-100 ml-auto" : "bg-slate-100"
          }`}
        >
          <p className="text-slate-800">{message.text}</p>
          <span className="text-xs text-slate-500">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

const VideoInterface: React.FC<{
  toggleCamera: () => void;
  isCameraOn: boolean;
  onSendMessage: (message: string) => void;
  messages: Message[];
  config: Config;
  setConfig: (config: Config) => void;
  isStreaming: boolean;
  startStream: () => void;
  stopStream: () => void;
}> = ({
  toggleCamera,
  isCameraOn,
  onSendMessage,
  messages,
  config,
  setConfig,
  isStreaming,
  startStream,
  stopStream,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error("Unable to access the camera:", err);
      setError(
        "Unable to access camera/microphone. Please check your settings and permissions."
      );
    }
  };

  const stopCamera = (): void => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOn]);

  return (
    <div className="flex flex-col h-full">
      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={config.systemPrompt}
              onChange={(e) =>
                setConfig({ ...config, systemPrompt: e.target.value })
              }
              disabled={isStreaming}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-select">Voice</Label>
            <Select
              value={config.voice}
              onValueChange={(value) => setConfig({ ...config, voice: value })}
              disabled={isStreaming}
            >
              <SelectTrigger id="voice-select">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice} value={voice}>
                    {voice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="google-search"
              checked={config.googleSearch}
              onCheckedChange={(checked) =>
                setConfig({ ...config, googleSearch: checked as boolean })
              }
              disabled={isStreaming}
            />
            <Label htmlFor="google-search">Enable Google Search</Label>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCamera}
              className="flex items-center gap-2"
            >
              {isCameraOn ? (
                <Video className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {isCameraOn ? "End Video" : "Start Video"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {showChat ? "Hide Chat" : "Show Chat"}
            </Button>
          </div>

          <div className="flex-1 flex gap-4 min-h-0">
            <div
              className={`transition-all duration-300 ease-in-out ${
                showChat ? "w-1/2" : "w-full"
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover rounded-lg"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {showChat && (
              <div className="w-1/2 flex flex-col bg-white rounded-lg border">
                <ChatMessages messages={messages} />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-grow"
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={isStreaming ? "destructive" : "default"}
              onClick={() => (isStreaming ? stopStream() : startStream())}
            >
              {isStreaming ? (
                <StopCircle className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const TextInterface: React.FC<{
  toggleCamera: () => void;
  onSendMessage: (message: string) => void;
  messages: Message[];
  config: Config;
  setConfig: (config: Config) => void;
  isStreaming: boolean;
  startStream: () => void;
  stopStream: () => void;
}> = ({
  toggleCamera,
  onSendMessage,
  messages,
  config,
  setConfig,
  isStreaming,
  startStream,
  stopStream,
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={config.systemPrompt}
              onChange={(e) =>
                setConfig({ ...config, systemPrompt: e.target.value })
              }
              disabled={isStreaming}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice-select">Voice</Label>
            <Select
              value={config.voice}
              onValueChange={(value) => setConfig({ ...config, voice: value })}
              disabled={isStreaming}
            >
              <SelectTrigger id="voice-select">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice} value={voice}>
                    {voice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="google-search"
              checked={config.googleSearch}
              onCheckedChange={(checked) =>
                setConfig({ ...config, googleSearch: checked as boolean })
              }
              disabled={isStreaming}
            />
            <Label htmlFor="google-search">Enable Google Search</Label>
          </div>
        </CardContent>
      </Card>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 min-h-0">
          <MessageSquare className="h-12 w-12 text-slate-400" />
          <h2 className="text-xl font-semibold text-slate-700">
            Welcome to Chat
          </h2>
          <p className="text-slate-500 text-center">
            Start a conversation or switch to video chat
          </p>
          <Button
            variant="outline"
            onClick={toggleCamera}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Start Video Chat
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-700">Chat</h2>
            <Button
              variant="outline"
              onClick={toggleCamera}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Start Video
            </Button>
          </div>
          <ChatMessages messages={messages} />
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-grow"
        />
        <Button onClick={handleSend}>
          <Send className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={isStreaming ? "destructive" : "default"}
          onClick={() => (isStreaming ? stopStream() : startStream())}
        >
          {isStreaming ? (
            <StopCircle className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Config>({
    systemPrompt:
      "You are a friendly Gemini 2.0 model. Respond verbally in a casual, helpful tone.",
    voice: "Puck",
    googleSearch: true,
    allowInterruptions: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInputRef = useRef<AudioInput | null>(null);
  const clientId = useRef<string>(crypto.randomUUID());
  const audioBuffer: Float32Array[] = [];
  let isPlaying = false;

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const addMessage = (text: string, type: "user" | "assistant" = "user") => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      type,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "text",
          data: text,
        })
      );
      addMessage(text, "user");
    }
  };

  const startStream = async () => {
    wsRef.current = new WebSocket(
      `wss://twox2pac-backend.onrender.com/ws/${clientId.current}`
    );

    wsRef.current.onopen = async () => {
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: "config",
            config: config,
          })
        );

        await startAudioStream();
        if (isCameraOn) {
          startVideoStream();
        }
        setIsStreaming(true);
      }
    };

    wsRef.current.onmessage = async (event: MessageEvent) => {
      const response = JSON.parse(event.data);
      if (response.type === "audio") {
        const audioData = base64ToFloat32Array(response.data);
        playAudioData(audioData);
      } else if (response.type === "text") {
        addMessage(response.text, "assistant");
      }
    };

    wsRef.current.onerror = () => {
      setError("WebSocket error occurred");
      setIsStreaming(false);
    };

    wsRef.current.onclose = () => {
      setIsStreaming(false);
    };
  };

  const startAudioStream = async () => {
    try {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 16000,
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(
        512,
        1,
        1
      );

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = float32ToPcm16(inputData);
          const base64Data = btoa(
            String.fromCharCode(...new Uint8Array(pcmData.buffer))
          );
          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              data: base64Data,
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      audioInputRef.current = { source, processor, stream };
    } catch (err) {
      setError(
        `Failed to access microphone: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const startVideoStream = () => {
    if (!wsRef.current) return;

    const videoElement = document.querySelector("video");
    if (!videoElement) return;

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d");
    if (!context) return;

    const captureAndSendFrame = () => {
      if (!wsRef.current) return;

      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];

      wsRef.current.send(
        JSON.stringify({
          type: "image",
          data: base64Image,
        })
      );
    };

    // Capture and send frames every second
    const intervalId = setInterval(captureAndSendFrame, 1000);

    // Store the interval ID for cleanup
    return () => clearInterval(intervalId);
  };

  const stopStream = () => {
    if (audioInputRef.current) {
      const { source, processor, stream } = audioInputRef.current;
      source.disconnect();
      processor.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      audioInputRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsStreaming(false);
  };

  const playAudioData = async (audioData: Float32Array) => {
    audioBuffer.push(audioData);
    if (!isPlaying) {
      playNextInQueue();
    }
  };

  const playNextInQueue = async () => {
    if (!audioContextRef.current || audioBuffer.length === 0) {
      isPlaying = false;
      return;
    }

    isPlaying = true;
    const audioData = audioBuffer.shift();

    if (audioData) {
      const buffer = audioContextRef.current.createBuffer(
        1,
        audioData.length,
        24000
      );
      buffer.copyToChannel(audioData, 0);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        playNextInQueue();
      };
      source.start();
    }
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-400 via-slate-200 to-white flex items-center justify-center p-4">
      <div className="h-[1000px] w-[1400px] bg-white shadow-lg rounded-lg p-6">
        <div className="h-full">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isCameraOn ? (
            <VideoInterface
              toggleCamera={toggleCamera}
              isCameraOn={isCameraOn}
              onSendMessage={handleSendMessage}
              messages={messages}
              config={config}
              setConfig={setConfig}
              isStreaming={isStreaming}
              startStream={startStream}
              stopStream={stopStream}
            />
          ) : (
            <TextInterface
              toggleCamera={toggleCamera}
              onSendMessage={handleSendMessage}
              messages={messages}
              config={config}
              setConfig={setConfig}
              isStreaming={isStreaming}
              startStream={startStream}
              stopStream={stopStream}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
