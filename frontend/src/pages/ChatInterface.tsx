import React, { useState, useRef, useEffect } from 'react';
import { SendHorizonal, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
interface HistoryItem {
  role: 'user' | 'assistant'; // Use 'assistant' for agent responses
  content: string;
  // We will *not* send image data back in history for simplicity now
  // Potentially add image info later if needed by backend/agents
}
// --- CORRECTED AGENTS ARRAY ---
// Use the actual names sent by the backend API
const AGENTS = [
  {
    key: "issue_detector", // Use a key for internal React usage if needed
    name: "Property Issue Detector", // MUST MATCH backend Agent name
    color: "bg-red-600",            // Example color
    border: "border-red-600",
    text: "text-red-600"
  },
  {
    key: "faq_expert",
    name: "Tenancy Agreement Expert", // MUST MATCH backend Agent name
    color: "bg-green-600",         // Example color
    border: "border-green-600",
    text: "text-green-600"
  },
  {
    key: "triage", // Optional: Add if you want to show the triage agent temporarily
    name: "Real Estate Query Triage Agent", // MUST MATCH backend Agent name
    color: "bg-yellow-500",        // Example color
    border: "border-yellow-500",
    text: "text-yellow-500"
  }
  // Add other agents if you have more
];
// --- END OF CORRECTION ---


// Helper to find agent info by name (API returns "Property Issue Detector", etc.)
function agentByName(name?: string) {
  if (!name) return undefined;
  // This comparison is case-sensitive and exact string match
  return AGENTS.find(ag => ag.name === name);
}

interface Message {
  id: number | string;
  text: string;
  sender: 'user' | 'agent';
  image?: string;
  isStreaming?: boolean;
  agentName?: string; // This will store the name like "Property Issue Detector"
}

const API_STREAM_URL = 'http://localhost:8000/api/multiagent/stream/'; // Ensure this is correct

const ChatStreamInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // State holds the *found* agent object (with colors etc.) or null
  const [activeAgent, setActiveAgent] = useState<typeof AGENTS[0] | null>(null); // Correct type

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selectedImage);
    } else {
      setImagePreview(null);
    }
  }, [selectedImage]);

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend && !selectedImage) return;

    // --- Prepare history ---
    const historyToSend: HistoryItem[] = messages
      .filter(msg => !msg.isStreaming && msg.text) // Exclude streaming/empty placeholders
      .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant', // Map 'agent' to 'assistant'
          // For user messages that had an image, just send the text part for history
          content: msg.text,
      }));
    // console.log("Sending History:", historyToSend); // Debug log

    // --- Add user message to local state ---
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      text: textToSend,
      sender: 'user',
      image: imagePreview || undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    const imageToSend = selectedImage; // Keep a reference
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsLoading(true);
    setActiveAgent(null);

    // --- Add agent placeholder to local state ---
    const agentId = `agent-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: agentId,
        text: '',
        sender: 'agent',
        isStreaming: true,
        agentName: undefined
      }
    ]);

    // --- Prepare FormData ---
    const formData = new FormData();
    formData.append('text', textToSend); // Current user text
    if (imageToSend) {
        formData.append('image', imageToSend); // Current user image
    }
    // Add history as a JSON string
    formData.append('history', JSON.stringify(historyToSend));

    let eventSource: EventSource | null = null; // Using EventSource for cleaner SSE handling

    try {
        const response = await fetch(API_STREAM_URL, {
            method: 'POST',
            body: formData,
            // Important: Don't set Content-Type header manually for FormData
            // headers: { 'Content-Type': 'multipart/form-data' } // Browser sets this with boundary
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        if (!response.body) {
            throw new Error("Empty response body from stream.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let isDone = false;
        let buffer = '';
        let fullText = '';
        let agentNameFromServer: string | undefined;

        while (!isDone) {
            const { value, done } = await reader.read();
            isDone = done;

            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const event of lines) {
                    if (event.startsWith('event: end')) {
                        console.log("Received end event");
                        isDone = true;
                        break;
                    }

                    if (event.startsWith('data: ')) {
                        try {
                            const jsonData = event.substring(6);
                            const data = JSON.parse(jsonData);

                            // --- Agent Name Handling (No changes needed here) ---
                            if (data.agent && !agentNameFromServer) {
                                agentNameFromServer = data.agent;
                                const foundAgent = agentByName(data.agent);
                                console.log(`Agent identified: ${data.agent}`, foundAgent);
                                setActiveAgent(foundAgent || null);
                                setMessages(prev =>
                                    prev.map(m =>
                                        m.id === agentId ? { ...m, agentName: data.agent } : m
                                    )
                                );
                            }

                            // --- Delta Handling (No changes needed here) ---
                            if (data.delta) {
                                fullText += data.delta;
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === agentId
                                            ? { ...m, text: fullText, agentName: agentNameFromServer }
                                            : m
                                    )
                                );
                            }
                        } catch (parseError) {
                            console.error("Error parsing SSE data:", parseError, "Data:", event);
                        }
                    }
                }
            }
        }

        // --- Final buffer processing (No changes needed here) ---
        if (buffer.startsWith('data: ')) {
           try {
                const data = JSON.parse(buffer.substring(6));
                 if (data.delta) {
                     fullText += data.delta;
                     setMessages((prev) =>
                         prev.map((m) =>
                             m.id === agentId
                                 ? { ...m, text: fullText, agentName: agentNameFromServer }
                                 : m
                         )
                     );
                 }
           } catch (e) { console.error("Error parsing final buffer:", e, buffer) }
        }

        console.log("Stream finished.");
        setMessages(prev =>
            prev.map((m) =>
                m.id === agentId ? { ...m, isStreaming: false } : m
            )
        );

    } catch (e: any) {
        // ... error handling ...
        console.error("Error during SSE fetch:", e);
        setMessages(prev => [
            ...prev.filter((m) => m.id !== agentId), // Remove placeholder
            {
                id: `error-${Date.now()}`,
                text: `Error: ${e.message || "Could not get response from the agent."}`,
                sender: 'agent',
                agentName: undefined
            }
        ]);
    } finally {
        setIsLoading(false);
        // Clear selections again just in case something failed mid-process
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        // Reset active agent display if stream ends or errors out
         // setActiveAgent(null); // Keep the last active agent displayed? Or clear? User choice. Let's keep it displayed.
    }
};


  // --- UI Handlers (Unchanged) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputText(e.target.value);
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) { // Prevent send while loading
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleImageUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Main Render (Mostly Unchanged, check message styling logic) ---
  return (
    <div className="relative min-h-screen flex justify-center items-center bg-gray-100">
      <div className="flex flex-col h-[80vh] w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Real Estate Assistant</h2>
            <p className="text-sm text-gray-500">Ask about property issues or tenancy questions. You can send images too.</p>
          </div>
          <div>
            {activeAgent ? ( // activeAgent state now holds the full agent object
              <div className="flex items-center space-x-2">
                <span className={`inline-block w-3 h-3 rounded-full border-2 ${activeAgent.color} ${activeAgent.border} animate-pulse`}></span>
                <span className={`text-xs font-bold uppercase tracking-wide ${activeAgent.text}`}>
                  {activeAgent.name} ACTIVE
                </span>
              </div>
            ) : (
               isLoading ? // Show a generic loading indicator if loading but agent not yet identified
                <span className="text-xs text-gray-400 font-semibold italic flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin"/> Connecting...
                </span>
               :
                <span className="text-xs text-gray-400 font-semibold italic">
                    No agent active
                </span>
            )}
          </div>
        </div>
        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg) => {
            // Find the agent styling based on the name stored in the message
            const agentStyleInfo = agentByName(msg.agentName);
            return (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  p-3 rounded-lg max-w-2xl shadow-sm          // Use slightly smaller shadow
                  ${msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-lg' // Standard user bubble
                      : agentStyleInfo // Agent bubble: Use found style info
                        ? `${agentStyleInfo.color} bg-opacity-10 text-gray-800 ${agentStyleInfo.border} border-l-4`
                        : 'bg-gray-200 text-gray-800 border-l-4 border-gray-300' // Default/fallback agent style
                  }
                  ${msg.isStreaming ? 'opacity-90' : ''}      // Subtle opacity for streaming
                  transition-opacity duration-300            // Smooth transition when streaming stops
                `}>
                  {msg.image && (
                    <img src={msg.image} alt="User upload" className="max-w-xs max-h-48 rounded mb-2 border" />
                  )}
                  {msg.sender === 'agent' ? (
                    <div className="prose prose-sm max-w-none"> {/* Use prose-sm for smaller text, max-w-none */}
                      <ReactMarkdown
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          a: ({ node, ...props }) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
                          ),
                          // Add other component overrides if needed
                        }}
                      >
                        {String(msg.text || (msg.isStreaming ? "" : "..."))}
                       </ReactMarkdown>
                      {msg.isStreaming && (
                         <span className="inline-block w-2 h-2 ml-1 bg-blue-500 rounded-full animate-pulse align-middle"></span> // Simple pulse dot
                      )}
                    </div>
                  ) : (
                    // Ensure user text wraps correctly
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Area (Unchanged) */}
        <div className="p-4 border-t bg-gray-50">
           {/* Image Preview (Unchanged) */}
          {imagePreview && (
            <div className="mb-2 relative w-24 h-24 border rounded p-1 bg-white">
              <img src={imagePreview} alt="Selected preview" className="w-full h-full object-cover rounded" />
              <button
                onClick={removeSelectedImage}
                className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                aria-label="Remove image"
              >
                <X size={14} strokeWidth={3}/>
              </button>
            </div>
          )}
           {/* Input Row (Unchanged) */}
          <div className="flex items-center border rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-200">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleImageUploadClick}
              className="p-2 text-gray-500 hover:text-blue-600 focus:outline-none mr-2 disabled:opacity-50"
              aria-label="Attach image"
              tabIndex={-1}
              type="button"
              disabled={isLoading}
            >
              <ImageIcon size={20} />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={isLoading ? "Agent is responding..." : "Type your message or describe the image..."}
              className="flex-1 p-2 border-none focus:outline-none focus:ring-0 text-sm bg-transparent"
              disabled={isLoading}
              aria-label="Message input"
            />
            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
              className={`p-2 rounded-md text-white ${
                isLoading || (!inputText.trim() && !selectedImage)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1'
              } transition-colors duration-200 ml-2`}
              aria-label="Send message"
              type="button"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <SendHorizonal size={20} />}
            </button>
          </div>
        </div>
      </div>
      {/* Custom spin animation (Unchanged) */}
      <style>{`
        .animate-spin-slow {
          animation: spin 1.7s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .prose :where(pre):not(:where([class~="not-prose"] *)) { // Fix for code block background in dark mode if needed
            background-color: #f3f4f6; // Example: Light gray background
            color: #1f2937;           // Example: Dark text
        }
      `}</style>
    </div>
  );
};

export default ChatStreamInterface;