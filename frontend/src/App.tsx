import ChatWidget from './components/ChatWidget'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">E-Commerce Store</h1>
        <p className="text-sm">Click the chat bubble in the bottom-right to get support</p>
      </div>
      <ChatWidget />
    </div>
  )
}

export default App
