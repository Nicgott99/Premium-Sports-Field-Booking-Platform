import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            ⚽ Sports Platform
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Premium MERN Stack Sports Booking Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold mb-2">Backend Status</h3>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-green-400">Running on Port 5000</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-3">⚛️</div>
            <h3 className="text-lg font-semibold mb-2">Frontend Status</h3>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-green-400">Running on Port 3000</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-3">🗄️</div>
            <h3 className="text-lg font-semibold mb-2">Database</h3>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-yellow-400">MongoDB Ready</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">🏗️ Project Features</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-left">
              <h4 className="font-semibold text-cyan-400 mb-2">Backend (Node.js)</h4>
              <ul className="space-y-1 text-gray-300">
                <li>✅ Express.js Server</li>
                <li>✅ MongoDB Database</li>
                <li>✅ JWT Authentication</li>
                <li>✅ RESTful APIs</li>
                <li>✅ Real-time Features</li>
              </ul>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-purple-400 mb-2">Frontend (React)</h4>
              <ul className="space-y-1 text-gray-300">
                <li>✅ React 18</li>
                <li>✅ Vite Build Tool</li>
                <li>✅ Tailwind CSS</li>
                <li>✅ Responsive Design</li>
                <li>✅ Modern UI/UX</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-gray-400 text-sm">
            🎯 Ready to iterate and develop the complete platform!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;