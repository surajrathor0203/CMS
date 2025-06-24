import React, { useState, useEffect } from 'react';

const NotFound = () => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    // Glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 4000);

    // Scanning line animation
    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 50);

    return () => {
      clearInterval(glitchInterval);
      clearInterval(scanInterval);
    };
  }, []);

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif'
    }}>
      
      {/* Animated Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        opacity: 0.3
      }} />

      {/* Scanning Line */}
      <div style={{
        position: 'absolute',
        top: `${scanLine}%`,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
        boxShadow: '0 0 10px #00ffff',
        opacity: 0.7
      }} />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            backgroundColor: '#00ffff',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `particle${i % 3} ${3 + Math.random() * 2}s ease-in-out infinite alternate`,
            opacity: 0.6
          }}
        />
      ))}

      {/* Main Content */}
      <div style={{ textAlign: 'center', zIndex: 10, position: 'relative' }}>
        
        {/* 404 Title */}
        <h1 style={{
          fontSize: 'clamp(4rem, 15vw, 8rem)',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #00ffff, #ff00ff, #ffff00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
          margin: '0 0 2rem 0',
          animation: 'glow 2s ease-in-out infinite alternate',
          transform: glitchActive ? 'skew(-5deg, 2deg) scale(1.05)' : 'none',
          filter: glitchActive ? 'hue-rotate(180deg) blur(1px)' : 'none',
          transition: 'all 0.1s ease-out'
        }}>
          404
        </h1>

        {/* Error Messages */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#00ffff',
            margin: '0 0 1rem 0',
            animation: 'pulse 2s infinite'
          }}>
            🚀 SYSTEM ERROR DETECTED
          </h2>
          
          <div style={{
            color: '#a0a0a0',
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            fontFamily: 'Courier New, monospace',
            lineHeight: 1.6
          }}>
            <p style={{ 
              margin: '0.5rem 0',
              animation: 'typewriter 3s steps(30) 1s both'
            }}>
              {'> SCANNING QUANTUM PATHWAYS...'}
            </p>
            <p style={{ 
              margin: '0.5rem 0',
              animation: 'typewriter 3s steps(30) 2s both'
            }}>
              {'> PATH NOT FOUND IN MULTIVERSE'}
            </p>
            <p style={{ 
              margin: '0.5rem 0',
              color: '#ff6b9d',
              animation: 'typewriter 3s steps(30) 3s both'
            }}>
              {'> REALITY.EXE HAS STOPPED WORKING'}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth < 640 ? 'column' : 'row',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={handleGoBack}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, #00ffff, #0080ff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
            }}
          >
            ← RETURN TO PREVIOUS DIMENSION
          </button>

          <button
            onClick={handleGoHome}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(45deg, #ff00ff, #ff6b9d)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 0 30px rgba(255, 0, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.3)';
            }}
          >
            🏠 TELEPORT TO HOME BASE
          </button>
        </div>
      </div>

      {/* Corner Brackets */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        width: '4rem',
        height: '4rem',
        borderLeft: '2px solid #00ffff',
        borderTop: '2px solid #00ffff',
        opacity: 0.6,
        animation: 'pulse 3s infinite'
      }} />
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        width: '4rem',
        height: '4rem',
        borderRight: '2px solid #00ffff',
        borderTop: '2px solid #00ffff',
        opacity: 0.6,
        animation: 'pulse 3s infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '1rem',
        width: '4rem',
        height: '4rem',
        borderLeft: '2px solid #00ffff',
        borderBottom: '2px solid #00ffff',
        opacity: 0.6,
        animation: 'pulse 3s infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
        width: '4rem',
        height: '4rem',
        borderRight: '2px solid #00ffff',
        borderBottom: '2px solid #00ffff',
        opacity: 0.6,
        animation: 'pulse 3s infinite'
      }} />

      {/* CSS Animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes glow {
          0% { text-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
          100% { text-shadow: 0 0 30px rgba(0, 255, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.3); }
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        @keyframes typewriter {
          0% { opacity: 0; transform: translateX(-10px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes particle0 {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }
        
        @keyframes particle1 {
          0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.4; }
          100% { transform: translateY(-30px) translateX(-15px) rotate(180deg); opacity: 0.9; }
        }
        
        @keyframes particle2 {
          0% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.5; }
          100% { transform: translateY(-15px) translateX(20px) scale(1.5); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default NotFound;