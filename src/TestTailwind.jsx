import React from 'react';

const TestTailwind = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-4xl font-bold text-red-800 mb-4">
          Tailwind is Working! 🎉
        </h1>
        <p className="text-green-600">
          If you see colors and shadows, Tailwind is properly configured.
        </p>
        <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestTailwind;