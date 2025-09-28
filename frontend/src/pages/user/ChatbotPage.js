import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  MessageCircle, 
  Lightbulb,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { chatbotAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(user?.id || 'anonymous');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get chatbot suggestions
  const { data: suggestionsData } = useQuery(
    'chatbot-suggestions',
    chatbotAPI.getSuggestions
  );

  // Get chatbot health
  const { data: healthData } = useQuery(
    'chatbot-health',
    chatbotAPI.getHealth
  );

  // Send message mutation
  const sendMessageMutation = useMutation(chatbotAPI.sendMessage, {
    onSuccess: (response) => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.response,
        timestamp: new Date(response.timestamp)
      };
      setMessages(prev => [...prev, botMessage]);
      setConversationId(response.conversationId);
    },
    onError: (error) => {
      toast.error('Failed to send message. Please try again.');
      console.error('Chat error:', error);
    }
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation(chatbotAPI.clearHistory, {
    onSuccess: () => {
      setMessages([]);
      toast.success('Chat history cleared');
    },
    onError: () => {
      toast.error('Failed to clear chat history');
    }
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    if (conversationId) {
      chatbotAPI.getHistory(conversationId)
        .then(response => {
          const history = response.history || [];
          const formattedMessages = history.map((msg, index) => ({
            id: index,
            type: msg.role === 'user' ? 'user' : 'bot',
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(formattedMessages);
        })
        .catch(error => {
          console.error('Failed to load chat history:', error);
        });
    }
  }, [conversationId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    sendMessageMutation.mutate({
      message: inputMessage.trim(),
      conversationId
    });

    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearHistoryMutation.mutate(conversationId);
    }
  };

  const suggestions = suggestionsData?.suggestions || [];
  const isAiConfigured = healthData?.aiConfigured;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900 flex items-center">
                <Bot className="h-8 w-8 text-green-600 mr-3" />
                BEACON AI Assistant
              </h1>
              <p className="text-gray-600 mt-1">
                Get instant help with disaster preparedness questions
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isAiConfigured 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isAiConfigured ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span>{isAiConfigured ? 'AI Online' : 'Fallback Mode'}</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  disabled={clearHistoryMutation.isLoading}
                  className="btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="card h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to BEACON AI!
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      I'm here to help you with disaster preparedness questions. 
                      Ask me anything about earthquakes, floods, fire safety, first aid, and more!
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.slice(0, 3).map((category, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(category.questions[0])}
                          className="btn-outline btn-sm"
                        >
                          {category.questions[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-green-600 text-white'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* Loading indicator */}
                {sendMessageMutation.isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <LoadingSpinner size="sm" />
                          <span className="text-sm text-gray-600">BEACON AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me about disaster preparedness..."
                    className="flex-1 form-input"
                    disabled={sendMessageMutation.isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || sendMessageMutation.isLoading}
                    className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                  Quick Help
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-2">
                  <button
                    onClick={() => handleSuggestionClick("What should I do during an earthquake?")}
                    className="w-full text-left text-sm text-gray-600 hover:text-primary-600 py-1"
                  >
                    • Earthquake safety tips
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("How can I prepare for floods?")}
                    className="w-full text-left text-sm text-gray-600 hover:text-primary-600 py-1"
                  >
                    • Flood preparedness
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("What should be in my emergency kit?")}
                    className="w-full text-left text-sm text-gray-600 hover:text-primary-600 py-1"
                  >
                    • Emergency kit essentials
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("How do I perform basic first aid?")}
                    className="w-full text-left text-sm text-gray-600 hover:text-primary-600 py-1"
                  >
                    • First aid basics
                  </button>
                </div>
              </div>
            </div>

            {/* Suggested Questions */}
            {suggestions.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="h-4 w-4 text-blue-500 mr-2" />
                    Suggested Questions
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {suggestions.slice(0, 2).map((category, categoryIndex) => (
                      <div key={categoryIndex}>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {category.category}
                        </h4>
                        <div className="space-y-1">
                          {category.questions.slice(0, 2).map((question, questionIndex) => (
                            <button
                              key={questionIndex}
                              onClick={() => handleSuggestionClick(question)}
                              className="block w-full text-left text-xs text-gray-600 hover:text-primary-600 py-1 hover:bg-gray-50 rounded px-2 transition-colors"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <AlertCircle className="h-4 w-4 text-orange-500 mr-2" />
                  Tips
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <p>Ask specific questions for better answers</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <p>I can help with all types of disasters and emergencies</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <p>For emergencies, always contact local authorities first</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
