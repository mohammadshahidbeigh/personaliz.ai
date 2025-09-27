'use client';

import { useState, useEffect } from 'react';

interface Actor {
  id: string;
  name: string;
  description: string | null;
}

interface GenerateResponse {
  success: boolean;
  personalizationId?: number;
  videoUrl?: string;
  message?: string;
  error?: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [actorId, setActorId] = useState('');
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Load actors on component mount
  useEffect(() => {
    const loadActors = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/actors');
        const data = await response.json();
        if (data.success) {
          setActors(data.actors);
          if (data.actors.length > 0) {
            setActorId(data.actors[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading actors:', error);
        addLog('Error loading actors: ' + (error as Error).message);
      }
    };

    loadActors();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !city || !phone || !actorId) {
      addLog('Error: Please fill in all fields');
      return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    
    addLog('Starting personalization process...');
    addLog(`Name: ${name}, City: ${city}, Phone: ${phone}, Actor: ${actorId}`);

    try {
      const response = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          city,
          phone,
          actorId,
        }),
      });

      const data: GenerateResponse = await response.json();
      setResult(data);

      if (data.success) {
        addLog('✅ Personalization completed successfully!');
        addLog(`Video URL: ${data.videoUrl}`);
        addLog(`Personalization ID: ${data.personalizationId}`);
      } else {
        addLog(`❌ Error: ${data.error}`);
      }

    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog(`❌ Network error: ${errorMessage}`);
      setResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedActor = actors.find(actor => actor.id === actorId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 Personaliz Video Creator
          </h1>
          <p className="text-lg text-gray-600">
            Create personalized videos with AI voice cloning and send them via WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Personalization Details
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* City Field */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Your City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md  text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your city"
                  required
                />
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md  text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890 (with country code)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include country code (e.g., +1 for US, +91 for India)
                </p>
              </div>

              {/* Actor Selection */}
              <div>
                <label htmlFor="actor" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Actors *
                </label>
                <select
                  id="actor"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md  text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {actors.map((actor) => (
                    <option key={actor.id} value={actor.id}>
                      {actor.name}
                    </option>
                  ))}
                </select>
                {selectedActor && selectedActor.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedActor.description}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                } text-white`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Video...
                  </span>
                ) : (
                  '🎬 Generate & Send Video'
                )}
              </button>
            </form>
          </div>

          {/* Results & Logs Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Results & Logs
            </h2>

            {/* Result Display */}
            {result && (
              <div className={`mb-6 p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  <span className={`text-2xl mr-2 ${
                    result.success ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  <h3 className={`font-semibold ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Success!' : 'Error'}
                  </h3>
                </div>
                
                {result.success && result.videoUrl && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Video URL:</p>
                    <a 
                      href={result.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {result.videoUrl}
                    </a>
                  </div>
                )}
                
                <p className={`text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message || result.error}
                </p>
              </div>
            )}

            {/* Logs */}
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-gray-800 mb-3">Process Logs</h3>
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No logs yet. Submit the form to see the process.</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            Powered by SyncLabs AI & WhatsApp Business API
          </p>
        </div>
      </div>
    </div>
  );
}