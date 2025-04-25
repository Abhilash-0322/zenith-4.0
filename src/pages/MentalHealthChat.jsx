import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ChevronRight, HelpCircle, Book, X } from 'lucide-react';

const MentalHealthChat = () => {
  const [messages, setMessages] = useState([
    {
      type: 'system',
      content: 'Welcome to ZenHeaven Mental Health Support. How are you feeling today?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showResources, setShowResources] = useState(false);
  const [resourcesList, setResourcesList] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // User ID - in a real app, this would come from authentication
  const userId = "user-" + Math.random().toString(36).substring(2, 10);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Sample suggested questions
  const suggestedQuestions = [
    "I've been feeling anxious lately",
    "How can I improve my sleep?",
    "I'm having trouble focusing",
    "What are some mindfulness exercises?",
    "I feel overwhelmed with work"
  ];
  
  // Sample resources for the sidebar
  const generalResources = [
    { 
      name: "Breathing Techniques", 
      description: "Simple breathing exercises to reduce stress and anxiety",
      path: "/resources/breathing" 
    },
    { 
      name: "Sleep Improvement Guide", 
      description: "Tips and practices for better sleep quality",
      path: "/resources/sleep" 
    },
    { 
      name: "Meditation Basics", 
      description: "Introduction to meditation for beginners",
      path: "/resources/meditation" 
    },
    { 
      name: "Journaling Prompts", 
      description: "Thoughtful prompts to guide your reflection practice",
      path: "/resources/journal" 
    },
    { 
      name: "Crisis Resources", 
      description: "Important contacts for immediate support",
      path: "/resources/crisis" 
    }
  ];
  
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // API request to the mental health chatbot
      const response = await fetch('http://localhost:8000/mental-health/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          user_id: userId,
          session_id: sessionId
        }),
      });
      
      const data = await response.json();
      
      // Store session ID for continued conversation
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      
      // Store any recommended resources
      if (data.resources && data.resources.length > 0) {
        setResourcesList(data.resources);
        setShowResources(true);
      }
      
      // Add bot response to chat
      const botMessage = {
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        isEmergency: data.emergency_contact
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        type: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus back on input
      inputRef.current?.focus();
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };
  
  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };
  
  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-semibold text-indigo-900">Mental Health Support</h1>
            </div>
            <button 
              onClick={() => setShowResources(!showResources)}
              className="px-4 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg flex items-center transition-colors"
            >
              <Book className="h-4 w-4 mr-2" />
              Resources
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mb-4 px-1">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-lg rounded-2xl px-5 py-4 shadow-sm ${
                      message.type === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : message.type === 'system'
                          ? 'bg-gray-100 text-gray-700 border border-gray-200'
                          : message.isEmergency
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    {message.isEmergency && (
                      <div className="mb-2 flex items-center text-red-600">
                        <HelpCircle className="h-5 w-5 mr-1" />
                        <span className="font-semibold">Important Support Information</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-lg rounded-2xl px-5 py-4 bg-white border border-gray-200 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Suggested questions */}
          <div className="mb-6 overflow-x-auto whitespace-nowrap py-2 px-1 flex space-x-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 text-sm flex-shrink-0 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
          
          {/* Message input */}
          <div className="bg-white rounded-xl shadow-md p-3 border border-gray-200">
            <form onSubmit={handleSubmit} className="flex items-center">
              <input
                type="text"
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 border-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400 px-2 py-2"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`rounded-full p-2 ${
                  !inputMessage.trim() || isLoading
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } transition-colors`}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            <div className="mt-2 border-t border-gray-100 pt-2 px-2">
              <p className="text-xs text-gray-500">
                This is a supportive space. In case of emergency, please contact professional medical services or call your local emergency number.
              </p>
            </div>
          </div>
        </main>
        
        {/* Resources Sidebar */}
        <aside className={`bg-white border-l border-gray-200 w-80 flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out transform ${showResources ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:static right-0 top-0 bottom-0 z-10 shadow-lg lg:shadow-none`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-indigo-900">Resources</h2>
              <button onClick={() => setShowResources(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Recommended resources based on conversation */}
            {resourcesList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-indigo-600 mb-3">Recommended for You</h3>
                <div className="space-y-3">
                  {resourcesList.map((resource, index) => (
                    <a 
                      key={index}
                      href={resource.url || '#'}
                      className="block p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <h4 className="font-medium text-indigo-900">{resource.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{resource.type}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* General resources */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">General Resources</h3>
              <div className="space-y-3">
                {generalResources.map((resource, index) => (
                  <a 
                    key={index}
                    href={resource.path}
                    className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">{resource.name}</h4>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MentalHealthChat;