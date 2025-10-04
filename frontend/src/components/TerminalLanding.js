import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from 'three';

export default function TerminalLanding() {
  // Multi-page texts; advance through each, then navigate
  const texts = [
    `Attention, citizens! A colossal meteor is on a collision course with Earth!\nEveryone must immediately seek shelter in bunkers or underground safe locations!\nThe government is mobilizing unprecedented technology to try to stop the catastrophe,\nbut every second counts — the survival of all depends on your action now!\n\nClick to continue...`,
    `Stay calm and follow the instructions displayed on your terminal.\nAuthorities are coordinating evacuation routes and shelter access.\nBring essentials and assist those nearby if possible.\nYour prompt action helps save lives.\n\nClick to begin training.`
  ];

  const [page, setPage] = useState(0);
  const currentText = texts[page] ?? "";
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [canClick, setCanClick] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [preloadedAssets, setPreloadedAssets] = useState({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const navigate = useNavigate();

  const fullText = currentText;

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

    // Object to hold loaded assets
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
      
      // Store assets globally to avoid serialization issues
      window.preloadedAssets = loadedAssets;
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
    setDisplayedText("");
    setIsTyping(true);
    setCanClick(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(currentText.slice(0, i));
      if (i >= currentText.length) {
        clearInterval(interval);
        setIsTyping(false);
        setCanClick(true);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [currentText]);

  // Enable click when both text is done and assets are loaded
  useEffect(() => {
    if (!isTyping && assetsLoaded) {
      setCanClick(true);
    } else {
      setCanClick(false);
    }
  }, [isTyping, assetsLoaded]);

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
    // If still typing, finish instantly
    if (isTyping) {
      setDisplayedText(currentText);
      setIsTyping(false);
      setCanClick(true);
      return;
    }
    // Advance to next page, or navigate when done
    if (page < texts.length - 1) {
      setPage((p) => p + 1);
    } else if (canClick && assetsLoaded) {
      navigate("/home"); // substitua pelo path desejado
    }
  };

  const getDisplayText = () => {
    let text = displayedText;
    if (!assetsLoaded) {
      text += `\n\nLoading assets... ${Math.round(loadingProgress)}%`;
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
          {/* Optional: show loading progress */}
          {!assetsLoaded && (
            <div style={{color: "#00ff00", fontSize: "1rem", marginTop: "20px"}}>
              Loading assets... {Math.round(loadingProgress)}%
            </div>
          )}
        </div>
      </div>
  );
}