import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, SendHorizonal, Image as ImageIcon, X } from 'lucide-react';
import api from '../api'; // Assuming api setup as shown previously

// Define the structure for a message
interface Message {
  id: number | string; // Use string for temporary client-side IDs
  text: string;
  sender: 'user' | 'agent';
  image?: string; // Optional: URL or base64 string for display
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Effect to create image preview
  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      setImagePreview(null);
    }
  }, [selectedImage]);

  const handleSendMessage = async () => {
    const textToSend = inputText.trim();
    if (!textToSend && !selectedImage) return; // Don't send empty messages

    const userMessage: Message = {
      id: `user-${Date.now()}`, // Temporary client-side ID
      text: textToSend,
      sender: 'user',
      image: imagePreview || undefined, // Include preview for immediate display
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setSelectedImage(null); // Clear image after adding to message list
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await api.sendMessageToChatbot(textToSend, selectedImage || undefined);

      // Assuming the backend response has a 'text' field for the agent's reply
      const agentMessage: Message = {
        id: `agent-${Date.now()}`, // Use a unique ID from response if available
        text: response.data.text || "Sorry, I couldn't process that.", // Adjust based on actual API response structure
        sender: 'agent',
      };
      setMessages(prevMessages => [...prevMessages, agentMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally add an error message to the chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Error: Could not get response from the agent.",
        sender: 'agent', // Display as if agent sent an error
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null); // Ensure image is cleared even on error
      setImagePreview(null);
      if (fileInputRef.current) { // Clear file input
            fileInputRef.current.value = '';
      }
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline on Enter
      handleSendMessage();
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
     if (fileInputRef.current) { // Clear file input
            fileInputRef.current.value = '';
        }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Real Estate Assistant</h2>
         <p className="text-sm text-gray-500">Ask about property issues (with images) or tenancy questions.</p>
      </div>

      {/* Message Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {/* Display image if present */}
               {message.image && (
                <img src={message.image} alt="User upload" className="max-w-xs max-h-48 rounded mb-2" />
              )}
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}
         {isLoading && (
          <div className="flex justify-start">
             <div className="p-3 rounded-lg bg-gray-200 text-gray-500 italic">
                Agent is typing...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Invisible element to scroll to */}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
         {/* Image Preview */}
         {imagePreview && (
          <div className="mb-2 relative w-24 h-24 border rounded p-1">
              <img src={imagePreview} alt="Selected preview" className="w-full h-full object-cover rounded" />
              <button
                 onClick={removeSelectedImage}
                 className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                 aria-label="Remove image"
              >
                 <X size={14} />
              </button>
          </div>
          )}
        <div className="flex items-center border rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*" // Accept only image files
            className="hidden" // Hide the default input
          />
          <button
            onClick={handleImageUploadClick}
            className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none mr-2"
            aria-label="Attach image"
          >
            <ImageIcon size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or describe the image..."
            className="flex-1 p-2 border-none focus:outline-none focus:ring-0 text-sm" // Adjusted padding and text size
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={(!inputText.trim() && !selectedImage) || isLoading} // Disable if no text/image or loading
            className={`p-2 rounded-md text-white ${isLoading || (!inputText.trim() && !selectedImage) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} transition-colors duration-200 ml-2`}
            aria-label="Send message"
          >
            <SendHorizonal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
