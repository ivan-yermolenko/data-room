import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          Data Room SPA
        </h1>
        <p className="mt-4 text-muted-foreground text-center max-w-md">
          Infrastructure setup is complete. Ready to implement OAuth, mock/API services, and workspace views.
        </p>
        <Routes>
          <Route path="/" element={null} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
