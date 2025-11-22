import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { useVibration } from '../hooks/useVibration';

interface DrawPoint {
  x: number;
  y: number;
  intensity: number;
  timestamp: number;
}

interface HapticPattern {
  intervals: number[];
  intensities: number[];
}

const DrawPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([]);
  const [hapticPattern, setHapticPattern] = useState<HapticPattern | null>(null);
  const [patternName, setPatternName] = useState('');
  const [intensityLevel, setIntensityLevel] = useState(0.7);
  const { vibrate } = useVibration();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw existing points
    if (drawPoints.length > 1) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < drawPoints.length - 1; i++) {
        const point = drawPoints[i];
        const nextPoint = drawPoints[i + 1];

        // Create gradient based on intensity
        const gradient = ctx.createLinearGradient(point.x, point.y, nextPoint.x, nextPoint.y);
        const color1 = `rgba(${Math.round(255 * point.intensity)}, ${Math.round(100 * (1 - point.intensity))}, ${Math.round(255 * point.intensity)}, 0.8)`;
        const color2 = `rgba(${Math.round(255 * nextPoint.intensity)}, ${Math.round(100 * (1 - nextPoint.intensity))}, ${Math.round(255 * nextPoint.intensity)}, 0.8)`;
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3 + point.intensity * 5;

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();

        // Draw point circle
        ctx.fillStyle = color1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2 + point.intensity * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [drawPoints]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const newPoint: DrawPoint = {
      x,
      y,
      intensity: intensityLevel,
      timestamp: Date.now(),
    };

    setDrawPoints([newPoint]);

    // Vibrate at start
    vibrate([50]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const newPoint: DrawPoint = {
      x,
      y,
      intensity: intensityLevel,
      timestamp: Date.now(),
    };

    setDrawPoints(prev => [...prev, newPoint]);

    // Continuous vibration while drawing
    vibrate([10]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);

    if (drawPoints.length > 1) {
      convertToHapticPattern();
      // Final vibration
      vibrate([100]);
    }
  };

  const convertToHapticPattern = () => {
    if (drawPoints.length < 2) return;

    const intervals: number[] = [];
    const intensities: number[] = [];

    // Convert drawing to timed intervals
    const startTime = drawPoints[0].timestamp;

    for (let i = 0; i < drawPoints.length - 1; i++) {
      const currentPoint = drawPoints[i];
      const nextPoint = drawPoints[i + 1];

      // Calculate time interval in seconds
      const interval = (nextPoint.timestamp - currentPoint.timestamp) / 1000;

      // Normalize interval (min 0.05s, max 0.5s)
      const normalizedInterval = Math.max(0.05, Math.min(0.5, interval));

      intervals.push(normalizedInterval);
      intensities.push(currentPoint.intensity);
    }

    // Add final intensity
    intensities.push(drawPoints[drawPoints.length - 1].intensity);

    // Simplify pattern by merging similar consecutive values
    const simplified = simplifyPattern(intervals, intensities);

    setHapticPattern(simplified);
  };

  const simplifyPattern = (intervals: number[], intensities: number[]): HapticPattern => {
    const simplifiedIntervals: number[] = [];
    const simplifiedIntensities: number[] = [];

    let currentInterval = 0;
    let currentIntensity = intensities[0];

    for (let i = 0; i < intervals.length; i++) {
      const intensityDiff = Math.abs(intensities[i] - currentIntensity);

      if (intensityDiff < 0.1 && simplifiedIntervals.length > 0) {
        // Similar intensity, merge intervals
        simplifiedIntervals[simplifiedIntervals.length - 1] += intervals[i];
      } else {
        // Different intensity, add new segment
        simplifiedIntervals.push(intervals[i]);
        simplifiedIntensities.push(intensities[i]);
        currentIntensity = intensities[i];
      }
    }

    return {
      intervals: simplifiedIntervals,
      intensities: simplifiedIntensities,
    };
  };

  const clearCanvas = () => {
    setDrawPoints([]);
    setHapticPattern(null);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const previewPattern = () => {
    if (!hapticPattern) return;

    const vibrationSequence: number[] = [];

    for (let i = 0; i < hapticPattern.intervals.length; i++) {
      const duration = Math.round(hapticPattern.intervals[i] * 1000);
      vibrationSequence.push(duration);

      // Add pause if intensity is low
      if (i < hapticPattern.intensities.length && hapticPattern.intensities[i] < 0.3) {
        vibrationSequence.push(Math.round(duration * 0.5));
      }
    }

    vibrate(vibrationSequence);
  };

  const savePattern = async () => {
    if (!hapticPattern || !patternName.trim()) {
      alert('Please draw a pattern and enter a name');
      return;
    }

    try {
      // Save pattern to backend
      // API call would go here
      console.log('Saving pattern:', { name: patternName, pattern: hapticPattern });
      alert('Pattern saved successfully!');
      clearCanvas();
      setPatternName('');
    } catch (error) {
      console.error('Error saving pattern:', error);
      alert('Failed to save pattern');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🎨 Haptic Drawing Canvas
            </h1>
            <p className="text-gray-300">
              Draw your own haptic patterns with your finger or mouse
            </p>
          </div>

          {/* Main Drawing Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas */}
            <div className="lg:col-span-2">
              <motion.div
                className="bg-gray-800 rounded-xl shadow-2xl p-6"
                whileHover={{ scale: 1.01 }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <label className="text-white font-semibold">Intensity:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={intensityLevel}
                      onChange={(e) => setIntensityLevel(parseFloat(e.target.value))}
                      className="w-48"
                    />
                    <span className="text-white font-mono">
                      {(intensityLevel * 100).toFixed(0)}%
                    </span>
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-96 rounded-lg cursor-crosshair touch-none"
                  style={{ backgroundColor: '#1a1a2e' }}
                />

                <div className="mt-4 text-sm text-gray-400 text-center">
                  Draw on the canvas to create your haptic pattern. The color indicates intensity.
                </div>
              </motion.div>
            </div>

            {/* Pattern Info & Actions */}
            <div className="space-y-4">
              {/* Pattern Details */}
              <motion.div
                className="bg-gray-800 rounded-xl shadow-2xl p-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-xl font-bold text-white mb-4">Pattern Info</h3>

                {hapticPattern ? (
                  <div className="space-y-3">
                    <div className="text-white">
                      <span className="text-gray-400">Segments:</span>{' '}
                      <span className="font-bold">{hapticPattern.intervals.length}</span>
                    </div>
                    <div className="text-white">
                      <span className="text-gray-400">Duration:</span>{' '}
                      <span className="font-bold">
                        {hapticPattern.intervals.reduce((a, b) => a + b, 0).toFixed(2)}s
                      </span>
                    </div>
                    <div className="text-white">
                      <span className="text-gray-400">Avg Intensity:</span>{' '}
                      <span className="font-bold">
                        {(
                          (hapticPattern.intensities.reduce((a, b) => a + b, 0) /
                            hapticPattern.intensities.length) *
                          100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>

                    {/* Pattern Visualization */}
                    <div className="mt-4">
                      <div className="text-gray-400 text-sm mb-2">Pattern Preview:</div>
                      <div className="flex items-end gap-1 h-20">
                        {hapticPattern.intensities.map((intensity, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                            style={{ height: `${intensity * 100}%` }}
                            title={`${(intensity * 100).toFixed(0)}%`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    Draw a pattern to see details
                  </div>
                )}
              </motion.div>

              {/* Actions */}
              {hapticPattern && (
                <motion.div
                  className="bg-gray-800 rounded-xl shadow-2xl p-6 space-y-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <h3 className="text-xl font-bold text-white mb-4">Actions</h3>

                  <button
                    onClick={previewPattern}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📳</span>
                    <span>Preview Pattern</span>
                  </button>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={patternName}
                      onChange={(e) => setPatternName(e.target.value)}
                      placeholder="Pattern name..."
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />

                    <button
                      onClick={savePattern}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <span>💾</span>
                      <span>Save Pattern</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Tips */}
              <motion.div
                className="bg-gray-800 rounded-xl shadow-2xl p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-lg font-bold text-white mb-3">💡 Tips</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Draw slowly for longer vibrations</li>
                  <li>• Use intensity slider for strength</li>
                  <li>• Zigzag creates pulsing effects</li>
                  <li>• Smooth curves = smooth vibrations</li>
                  <li>• Sharp angles = sudden changes</li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Example Patterns */}
          <motion.div
            className="mt-8 bg-gray-800 rounded-xl shadow-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Example Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer">
                <div className="text-white font-semibold mb-2">Heartbeat</div>
                <div className="text-gray-400 text-sm">Quick pulse, pause, quick pulse</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer">
                <div className="text-white font-semibold mb-2">Ocean Waves</div>
                <div className="text-gray-400 text-sm">Gentle crescendo and decrescendo</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer">
                <div className="text-white font-semibold mb-2">SOS</div>
                <div className="text-gray-400 text-sm">Three short, three long, three short</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DrawPage;
