import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Video, MessageSquare, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
}

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
          className="bg-slate-100 rounded-lg p-3 max-w-[80%] break-words"
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
}> = ({ toggleCamera, isCameraOn, onSendMessage, messages }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
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
              />
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
}> = ({ toggleCamera, onSendMessage, messages }) => {
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
      </div>
    </div>
  );
};

const ChatInterface: React.FC = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-400 via-slate-200 to-white flex items-center justify-center p-4">
      <div className="h-[600px] w-[800px] bg-white shadow-lg rounded-lg p-6">
        <div className="h-full">
          {isCameraOn ? (
            <VideoInterface
              toggleCamera={toggleCamera}
              isCameraOn={isCameraOn}
              onSendMessage={handleSendMessage}
              messages={messages}
            />
          ) : (
            <TextInterface
              toggleCamera={toggleCamera}
              onSendMessage={handleSendMessage}
              messages={messages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
