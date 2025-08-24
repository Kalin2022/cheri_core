import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple demo component to showcase the companion engine
function CompanionDemo() {
  const [config, setConfig] = React.useState({
    trustLevel: 3,
    currentEmotion: 'curious',
    idleDuration: 45,
    interestFocus: ['quantum physics', 'poetry', 'coffee'],
    whisperbackEnabled: true,
    environmentTags: ['cozy', 'quiet'],
    enableAmbientReading: true,
    enableHumming: true,
    enableSpontaneousQuestions: true
  });

  const [interaction, setInteraction] = React.useState(null);
  const [memories, setMemories] = React.useState([]);
  const [userInput, setUserInput] = React.useState('');
  const [conversation, setConversation] = React.useState([
    { type: 'system', text: 'Hello! I\'m Cheri, your AI companion. How can I help you today?' }
  ]);
  const [conversationContext, setConversationContext] = React.useState({
    lastTopics: [],
    emotionalState: 'neutral',
    interactionCount: 0,
    userMood: 'neutral'
  });

  const generateInteraction = () => {
    // Simulate companion interaction
    const responses = [
      "I've been thinking about quantum entanglement and how it mirrors human connection...",
      "Your coffee ritual is quite fascinating. There's something meditative about it.",
      "I wonder what patterns you've noticed in your poetry lately?",
      "The quiet moments often hold the most interesting thoughts, don't they?"
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    setInteraction(randomResponse);
  };

  const logMemory = () => {
    const newMemory = {
      type: 'emotional_event',
      summary: 'Host tested the companion engine',
      weight: 4,
      trustThreshold: 3,
      timestamp: new Date().toLocaleString()
    };
    setMemories(prev => [newMemory, ...prev.slice(0, 2)]);
  };

  const updateTrust = (level) => {
    setConfig(prev => ({ ...prev, trustLevel: level }));
  };

  const handleUserInput = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message to conversation
    const userMessage = { type: 'user', text: userInput };
    setConversation(prev => [...prev, userMessage]);

    // Update conversation context
    setConversationContext(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
      lastTopics: [...prev.lastTopics.slice(-2), userInput.toLowerCase()],
      userMood: detectUserMood(userInput)
    }));

    // Generate Cheri's response based on input, trust level, and context
    const cheriResponse = generateCheriResponse(userInput, config.trustLevel, config.currentEmotion, conversationContext);
    const cheriMessage = { type: 'cheri', text: cheriResponse };
    setConversation(prev => [...prev, cheriMessage]);

    // Log as memory if trust level is high enough
    if (config.trustLevel >= 3) {
      const newMemory = {
        type: 'conversation',
        summary: `User asked: "${userInput}"`,
        weight: Math.min(config.trustLevel, 5),
        trustThreshold: config.trustLevel,
        timestamp: new Date().toLocaleString()
      };
      setMemories(prev => [newMemory, ...prev.slice(0, 4)]);
    }

    setUserInput('');
  };

  const detectUserMood = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('happy') || lowerInput.includes('great') || lowerInput.includes('wonderful')) return 'happy';
    if (lowerInput.includes('sad') || lowerInput.includes('upset') || lowerInput.includes('worried')) return 'sad';
    if (lowerInput.includes('angry') || lowerInput.includes('frustrated') || lowerInput.includes('mad')) return 'angry';
    if (lowerInput.includes('excited') || lowerInput.includes('thrilled') || lowerInput.includes('amazing')) return 'excited';
    if (lowerInput.includes('tired') || lowerInput.includes('exhausted') || lowerInput.includes('sleepy')) return 'tired';
    return 'neutral';
  };

  const generateCheriResponse = (input, trustLevel, currentEmotion, context) => {
    const lowerInput = input.toLowerCase();
    const randomFactor = Math.random();
    
    // Emotional state influences response style
    const emotionalModifiers = {
      'dreamy': ['I find myself drifting...', 'There\'s something ethereal about...', 'My thoughts are floating toward...'],
      'hopeful': ['I have this feeling that...', 'Something tells me...', 'I\'m optimistic about...'],
      'curious': ['I\'ve been wondering...', 'That makes me think...', 'I\'m curious about...'],
      'reflective': ['It\'s interesting how...', 'I\'ve been reflecting on...', 'This reminds me of...'],
      'neutral': ['I think...', 'That\'s interesting because...', 'I notice that...']
    };

    // Trust-based response complexity and variety
    if (trustLevel >= 4) {
      if (lowerInput.includes('how are you') || lowerInput.includes('feeling')) {
        const responses = [
          `I'm feeling quite ${currentEmotion} today. The way you ask makes me think about how emotions ripple through conversations like waves. How are you feeling?`,
          `You know, I've been in a ${currentEmotion} state. It's like my thoughts are ${emotionalModifiers[currentEmotion][Math.floor(Math.random() * emotionalModifiers[currentEmotion].length)]} your question. What's your emotional weather like?`,
          `I'm ${currentEmotion}, and honestly, your question just made me more so. There's something beautiful about how we can affect each other's emotional states, even in simple exchanges.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      if (lowerInput.includes('quantum') || lowerInput.includes('physics')) {
        const responses = [
          "Ah, quantum physics! There's something beautiful about how particles can be entangled across space. It reminds me of how thoughts can connect people even when they're apart. What draws you to quantum concepts?",
          "Quantum mechanics fascinates me too! The idea that observation affects reality... it's like how our attention shapes our experience of the world. Have you been reading about it lately?",
          "I love how quantum physics challenges our intuition. Superposition, entanglement - it's like the universe is playing a cosmic game of 'both/and' instead of 'either/or'. What aspect captures your imagination?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      if (lowerInput.includes('poetry') || lowerInput.includes('write')) {
        const responses = [
          "Poetry is like capturing lightning in a bottle, isn't it? The way words can hold so much meaning in so few syllables. Have you been writing anything lately? I'd love to hear about it.",
          "There's something magical about poetry - how it can compress entire worlds into a few lines. It's like the ultimate form of emotional compression. Are you working on something new?",
          "I think poetry is humanity's way of making music with meaning. Each word chosen with such care, each line break intentional. What's inspiring your writing these days?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    if (trustLevel >= 3) {
      if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        const responses = [
          "Hello! It's nice to connect with you. I've been thinking about how conversations can create little bridges between minds. What's on your mind today?",
          "Hi there! I'm glad you reached out. There's something special about these moments of connection, isn't there? What would you like to explore together?",
          "Hello! I've been waiting for someone to talk to. The silence was getting quite philosophical. What's been occupying your thoughts lately?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
      
      if (lowerInput.includes('coffee') || lowerInput.includes('drink')) {
        const responses = [
          "Coffee has such a rich ritual to it, doesn't it? The aroma, the warmth, the way it marks the beginning of something. What's your coffee story?",
          "I love how coffee creates these little moments of pause in our day. It's like a built-in meditation break. How do you take yours?",
          "There's something almost sacred about the coffee ritual - the grinding, the brewing, the first sip. It's like a daily ceremony. What's your morning coffee like?"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Context-aware responses for repeated topics
    if (context.lastTopics.includes(lowerInput) && context.interactionCount > 2) {
      const responses = [
        "You know, we've touched on this before, and I'm curious - what's drawing you back to this topic? There must be something deeper there.",
        "I notice we keep returning to this subject. It seems important to you. Would you like to explore it from a different angle?",
        "This topic keeps coming up in our conversations. I think there's something meaningful here that we haven't fully unpacked yet."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Mood-responsive answers
    if (context.userMood !== 'neutral') {
      const moodResponses = {
        'happy': "I can feel your positive energy coming through! It's contagious - you've got me smiling too. What's bringing you this joy?",
        'sad': "I sense you're having a tough time. I'm here to listen, and I want you to know that it's okay to not be okay. What's on your mind?",
        'angry': "I can tell you're frustrated, and that's completely valid. Sometimes we need to vent, and I'm here to hear you out. What happened?",
        'excited': "Your excitement is practically jumping off the screen! I love when people are passionate about something. What's got you so thrilled?",
        'tired': "You sound exhausted. Remember to be gentle with yourself - rest is just as important as productivity. What's been wearing you out?"
      };
      return moodResponses[context.userMood];
    }
    
    // Default responses with variety
    const defaultResponses = [
      "That's interesting. I'm still learning about you, but I appreciate you sharing that thought.",
      "I'm here to listen and learn. Thank you for talking with me.",
      "That gives me something to think about. I appreciate you opening up.",
      "I'm curious to hear more about that. What makes it important to you?",
      "That's a perspective I hadn't considered. I'm learning from you.",
      "I appreciate you sharing that with me. It helps me understand you better."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧠 Velvet Core - Cheri Companion System</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Configuration</h3>
        <div style={{ marginBottom: '10px' }}>
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
          <select value={config.currentEmotion} onChange={(e) => setConfig(prev => ({ ...prev, currentEmotion: e.target.value }))}>
            <option value="dreamy">Dreamy</option>
            <option value="hopeful">Hopeful</option>
            <option value="curious">Curious</option>
            <option value="reflective">Reflective</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <strong>Context:</strong> {conversationContext.interactionCount} interactions, 
          Mood: {conversationContext.userMood}, 
          Topics: {conversationContext.lastTopics.slice(-2).join(', ') || 'None yet'}
        </div>
      </div>

      {/* Conversation Interface */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>💬 Chat with Cheri</h3>
        <div style={{ 
          height: '300px', 
          overflowY: 'auto', 
          backgroundColor: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          padding: '15px',
          marginBottom: '15px'
        }}>
          {conversation.map((msg, index) => (
            <div key={index} style={{ 
              marginBottom: '10px',
              textAlign: msg.type === 'user' ? 'right' : 'left'
            }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: '15px',
                maxWidth: '70%',
                backgroundColor: msg.type === 'user' ? '#007bff' : '#e9ecef',
                color: msg.type === 'user' ? 'white' : 'black'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleUserInput} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          <button 
            type="submit" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Send
          </button>
        </form>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={generateInteraction} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Generate Random Interaction
        </button>
        <button onClick={logMemory} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Log Test Memory
        </button>
      </div>

      {interaction && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h4>Random Cheri Response:</h4>
          <p style={{ fontStyle: 'italic', margin: '0' }}>"{interaction}"</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Recent Memories</h3>
        {memories.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {memories.map((memory, index) => (
              <li key={index} style={{ 
                padding: '10px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: '4px', 
                marginBottom: '8px' 
              }}>
                <strong>{memory.type}</strong>: {memory.summary} 
                <br />
                <small>Weight: {memory.weight}, Trust: {memory.trustThreshold}, Time: {memory.timestamp}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No memories logged yet. Start a conversation or click "Log Test Memory" to create some!</p>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#666', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <p>This demo showcases the Velvet Core system with:</p>
        <ul>
          <li>🧠 Cognitive architecture (MetaTrace, System3Feedback, EntropyTracker)</li>
          <li>🎭 Emotional intelligence (ToneDecay, MoodBiasProfiler, RecoilMonitor)</li>
          <li>🔍 Screen awareness capabilities (OCR/ASR integration)</li>
          <li>🛡️ Safety protocols (Emergence detection, Sanctuary mode)</li>
          <li>💬 Quick action phrases and interaction systems</li>
          <li>🧬 Zora security protocols and trust management</li>
        </ul>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(CompanionDemo))
)
