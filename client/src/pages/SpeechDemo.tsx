import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MicrophoneButton, CompactMicrophoneButton } from '../components/ui/MicrophoneButton';
import { ArrowLeft, Mic, MessageSquare, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpeechDemoProps {
  onBack?: () => void;
}

export default function SpeechDemo({ onBack }: SpeechDemoProps) {
  const [transcribedText, setTranscribedText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: number, text: string, sender: 'user' | 'assistant'}>>([
    { id: 1, text: "Hi! Try using the microphone button to speak instead of typing.", sender: 'assistant' }
  ]);

  const handleSpeechResult = (text: string) => {
    setTranscribedText(text);
  };

  const handleChatSpeech = (text: string) => {
    setChatInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = { id: Date.now(), text: chatInput, sender: 'user' as const };
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate assistant response
    setTimeout(() => {
      const responses = [
        "That's great! I heard you loud and clear.",
        "Speech-to-text is working perfectly!",
        "Thanks for testing the voice feature.",
        "I love that you're using voice input!"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { id: Date.now(), text: randomResponse, sender: 'assistant' }]);
    }, 1000);
    
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Speech-to-Text Demo</h1>
              <p className="text-gray-600 mt-1">Test the microphone functionality with Web Speech API</p>
            </div>
          </div>
        </div>

        {/* Basic Speech Recognition Demo */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Basic Speech Recognition
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <p className="text-gray-600">Click the microphone and start speaking to see real-time transcription:</p>
              
              <div className="flex justify-center">
                <MicrophoneButton
                  onSpeechResult={handleSpeechResult}
                  size="lg"
                />
              </div>
              
              <div className="min-h-[100px] p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                {transcribedText ? (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-800 text-lg"
                  >
                    "{transcribedText}"
                  </motion.p>
                ) : (
                  <p className="text-gray-500 italic">Transcribed text will appear here...</p>
                )}
              </div>
              
              {transcribedText && (
                <Button 
                  variant="outline" 
                  onClick={() => setTranscribedText('')}
                  className="mt-4"
                >
                  Clear Text
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface Demo */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat Interface with Voice Input
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <div className="space-y-4">
              {/* Messages */}
              <div className="h-64 overflow-y-auto scrollbar-hide bg-gray-50 rounded-lg p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white text-gray-800 border'
                    }`}>
                      {message.text}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Input Area */}
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message or use the microphone..."
                    className="w-full p-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <CompactMicrophoneButton
                      onSpeechResult={handleChatSpeech}
                    />
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!chatInput.trim()}
                  className="rounded-full px-6"
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Different Button Styles */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Button Variations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-gray-800">Large Button</h3>
                <MicrophoneButton
                  onSpeechResult={() => {}}
                  size="lg"
                />
                <p className="text-sm text-gray-600">Perfect for main interfaces</p>
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-gray-800">Medium Button</h3>
                <MicrophoneButton
                  onSpeechResult={() => {}}
                  size="md"
                />
                <p className="text-sm text-gray-600">Standard size for most uses</p>
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="font-semibold text-gray-800">Compact Button</h3>
                <CompactMicrophoneButton
                  onSpeechResult={() => {}}
                />
                <p className="text-sm text-gray-600">For tight spaces and inline use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Support Info */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 text-white">
            <CardTitle>Browser Support & Usage</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Supported Browsers:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Chrome (Desktop & Mobile) - Full support</li>
                  <li>Safari (Desktop & Mobile) - Full support</li>
                  <li>Edge (Desktop) - Full support</li>
                  <li>Firefox - Limited support</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Real-time speech-to-text conversion</li>
                  <li>Visual feedback with animations</li>
                  <li>Error handling for permissions and network issues</li>
                  <li>Mobile-friendly touch interface</li>
                  <li>Customizable button sizes and styles</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Usage in Chat:</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <pre className="text-sm">
{`<MicrophoneButton
  onSpeechResult={(text) => {
    setInputMessage(prev => prev + ' ' + text);
  }}
  size="sm"
  disabled={isLoading}
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}