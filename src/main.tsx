import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple test component without TypeScript
function TestApp() {
  return React.createElement('div', {
    style: { padding: '20px', fontFamily: 'Arial, sans-serif' }
  }, [
    React.createElement('h1', { key: 'title' }, '🧠 Velvet Core Test'),
    React.createElement('p', { key: 'message' }, 'If you can see this, React is working!'),
    React.createElement('p', { key: 'time' }, 'Current time: ' + new Date().toLocaleString())
  ])
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(TestApp))
)
