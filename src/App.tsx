import KanbanBoard from './components/KanbanBoard';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Flowbo Workspace</h1>
        <p>This is my work for the CI/CD evaluation.</p>
      </header>
      <main>
        <KanbanBoard />
      </main>
    </div>
  );
}

export default App;
