import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from 'three';

export default function TerminalLanding() {
  const fullText = `Attention, citizens! A colossal meteor is on a collision course with Earth!\nEveryone must immediately seek shelter in bunkers or underground safe locations!\nThe government is mobilizing unprecedented technology to try to stop the catastrophe,\nbut every second counts — the survival of all depends on your action now!\n\nInitializing defense systems...`;

  const [displayedText, setDisplayedText] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [preloadedAssets, setPreloadedAssets] = useState({});
  const [canClick, setCanClick] = useState(false);
  const navigate = useNavigate();

  // Preload Three.js assets
  useEffect(() => {
    const loadingManager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(loadingManager);
    
    const texturePaths = [
      '/resources/earth/Earth Map.jpg',
      '/resources/earth/Earth Night Map.jpg',
      '/resources/earth/Earth Topographic Map.png',
      '/resources/earth/Earth Clouds.jpg',
      '/resources/sun/Sun Map.png',
      '/resources/meteor/Meteor Map.jpg',
      '/resources/galaxy/Galaxy Map.jpg'
    ];

    const loadedAssets = {};

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading progress: ${progress}% (${itemsLoaded}/${itemsTotal}) - ${url}`);
      setLoadingProgress(progress);
    };

    loadingManager.onLoad = () => {
      console.log('All assets loaded successfully!');
      setPreloadedAssets(loadedAssets);
      setAssetsLoaded(true);
    };

    loadingManager.onError = (url) => {
      console.error(`Failed to load asset: ${url}`);
    };

    // Start loading all textures with the managed loader
    texturePaths.forEach((path) => {
      textureLoader.load(
        path,
        (texture) => {
          console.log(`Loaded texture: ${path}`);
          loadedAssets[path] = texture;
        },
        (progress) => {
          console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100)}%`);
        },
        (error) => {
          console.error(`Failed to load texture: ${path}`, error);
        }
      );
    });

    return () => {
      // Cleanup if component unmounts
      Object.values(loadedAssets).forEach(texture => {
        if (texture.dispose) texture.dispose();
      });
    };
  }, []);

  // Terminal typing effect
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Enable click when both text is done and assets are loaded
  useEffect(() => {
    if (displayedText === fullText && assetsLoaded) {
      setCanClick(true);
    }
  }, [displayedText, assetsLoaded, fullText]);

   const containerStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    fontFamily: "'Courier New', monospace",
    boxSizing: "border-box",
  };

  const textWrapperStyle = {
    marginLeft: "15%",
    marginTop: "10%",
    height: "60%", // ocupa altura total
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start", // mantém o texto verticalmente centralizado
    // overflow: "hidden", // evita scroll ou movimento    
  };

  const textStyle = {
    color: "#00ff00",
    fontSize: "1.5rem",
    whiteSpace: "pre-wrap",
    textAlign: "left",
    lineHeight: "1.5",
  };

  const cursorStyle = {
    display: "inline-block",
    width: "10px",
    backgroundColor: "#00ff00",
    marginLeft: "2px",
    animation: "blink 0.7s infinite",
  };

  const styleSheet = `
    @keyframes blink {
      0%, 50%, 100% { opacity: 1; }
      25%, 75% { opacity: 0; }
    }
  `;

  const handleClick = () => {
    if(canClick) {
      // Store preloaded assets in sessionStorage as a flag
      // The actual textures will be accessible globally
      window.preloadedAssets = preloadedAssets;
      sessionStorage.setItem('assetsPreloaded', 'true');
      navigate("/ThreeDemo");
    }
  };

  // Dynamic text based on loading state
  const getDisplayText = () => {
    let text = displayedText;
    
    if (displayedText === fullText) {
      if (!assetsLoaded) {
        text += `\n\nLoading defense systems... ${Math.round(loadingProgress)}%`;
        
        // Add loading bar
        const barLength = 30;
        const filledLength = Math.round((loadingProgress / 100) * barLength);
        const loadingBar = '[' + '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength) + ']';
        text += `\n${loadingBar}`;
      } else {
        text += '\n\nSystems online! Click to access Earth Defense Interface!';
      }
    }
    
    return text;
  };

  return (
    <div style={containerStyle} onClick={handleClick}>
        <style>{styleSheet}</style>
        <div style={textWrapperStyle}>
          <pre style={textStyle}>
            {getDisplayText()}
            <span style={cursorStyle}>|</span>
          </pre>
        </div>
      </div>
  );
}