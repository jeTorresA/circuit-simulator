import { useCircuitStore } from "../hooks/useCircuitStore";

const Toolbar = () => {
    const { components, wires, addComponent } = useCircuitStore();
    
    return (
        <div style={{ 
            width: '200px', 
            backgroundColor: '#2c3e50', 
            padding: '20px', 
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 10
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Componentes</h3>
            
            <button 
              onClick={() => addComponent('resistor')}
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: '#f39c12',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '4px'
              }}
            >
              + Resistencia
            </button>
        
            <div style={{ marginTop: 'auto', fontSize: '12px', color: '#bdc3c7' }}>
              Componentes: {components.length} <br/>
              Cables: {wires.length}
            </div>
          </div>
    );
};

export default Toolbar;