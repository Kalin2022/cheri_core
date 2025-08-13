import React from 'react'
import ReactDOM from 'react-dom/client'
import { CheriCompanionEngine } from '../engines'

// Simple demo component to showcase the companion engine
function CompanionDemo() {
  const [config, setConfig] = React.useState({
    trustLevel: 3,
    currentEmotion: 'curious' as const,
    idleDuration: 45,
    interestFocus: ['quantum physics', 'poetry', 'coffee'],
    whisperbackEnabled: true,
    environmentTags: ['cozy', 'quiet'],
    enableAmbientReading: true,
    enableHumming: true,
    enableSpontaneousQuestions: true
  });

  const [interaction, setInteraction] = React.useState<string | null>(null);
  const [memories, setMemories] = React.useState<any[]>([]);

  const companion = new CheriCompanionEngine(config);

  const generateInteraction = () => {
    const result = companion.getIdleInteraction();
    setInteraction(result);
  };

  const logMemory = () => {
    companion.logMeaningfulMoment('Host tested the companion engine', 4, 3);
    // Refresh memories
    setMemories(companion['memoryLog'].getRecent(3));
  };

  const updateTrust = (level: number) => {
    setConfig(prev => ({ ...prev, trustLevel: level }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧠 Cheri Companion Engine Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Configuration</h3>
        <div>
          <label>Trust Level: </label>
          <select value={config.trustLevel} onChange={(e) => updateTrust(Number(e.target.value))}>
            <option value={1}>1 - Basic</option>
            <option value={2}>2 - Acquaintance</option>
            <option value={3}>3 - Friend</option>
            <option value={4}>4 - Close Friend</option>
            <option value={5}>5 - Intimate</option>
          </select>
        </div>
        <div>
          <label>Current Emotion: </label>
          <select value={config.currentEmotion} onChange={(e) => setConfig(prev => ({ ...prev, currentEmotion: e.target.value as any }))}>
            <option value="dreamy">Dreamy</option>
            <option value="hopeful">Hopeful</option>
            <option value="curious">Curious</option>
            <option value="reflective">Reflective</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={generateInteraction} style={{ padding: '10px 20px', marginRight: '10px' }}>
          Generate Idle Interaction
        </button>
        <button onClick={logMemory} style={{ padding: '10px 20px' }}>
          Log Test Memory
        </button>
      </div>

      {interaction && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f0f8ff', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h4>Cheri's Response:</h4>
          <p style={{ fontStyle: 'italic' }}>"{interaction}"</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Recent Memories</h3>
        {memories.length > 0 ? (
          <ul>
            {memories.map((memory, index) => (
              <li key={index}>
                <strong>{memory.type}</strong>: {memory.summary} 
                <br />
                <small>Weight: {memory.weight}, Trust: {memory.trustThreshold}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No memories logged yet. Click "Log Test Memory" to create some!</p>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>This demo showcases the enhanced Cheri Companion Engine with:</p>
        <ul>
          <li>Emotion state system (dreamy, hopeful, curious, reflective, neutral)</li>
          <li>Time-based mood blending</li>
          <li>Trust-based interaction depth</li>
          <li>Memory logging and retrieval</li>
          <li>Ambient content generation</li>
        </ul>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CompanionDemo />
  </React.StrictMode>
)
