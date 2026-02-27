// import './App.css';
import Toolbar from './Components/Toolbar';
import Circuit from './Components/Circuit';

const App = () => { 
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* --- BARRA DE HERRAMIENTAS (SIDEBAR) --- */}
      <Toolbar />

      {/* --- LIENZO DE SIMULACIÓN --- */}
      <Circuit />

    </div>
  );
};

export default App; 
