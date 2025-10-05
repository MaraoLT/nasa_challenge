import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';

export default function MeteorImpactSimulator() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extract the 'from' parameter from the current URL
    const urlParams = new URLSearchParams(location.search);
    const fromParam = urlParams.get('from');
    
    // Construct the iframe URL with the from parameter
    let iframeSrc = '/collision/index.html';
    if (fromParam) {
        iframeSrc += `?from=${encodeURIComponent(fromParam)}`;
    }

    console.log("Rendering MeteorImpactSimulator component", { fromParam, iframeSrc });
    
    // Initialize music
    useEffect(() => {
        audioContextManager.init();
        
        const targetTrack = '/resources/sounds/Eternal Horizon.mp3';
        
        // Only start music if it's not already playing the correct track
        if (!musicManager.isCurrentlyPlaying(targetTrack)) {
            const playResult = musicManager.playTrack(targetTrack, true);
            if (!playResult) {
                console.log('Music will play after user interaction');
            }
        } else {
            console.log('Music already playing, continuing current track');
        }
        
        return () => {
            // Don't fade out music when leaving - let the next component handle it
            // This prevents music interruption during navigation
        };
    }, []);
    
    // Listen for navigation messages from the iframe
    useEffect(() => {
        const handleMessage = (event) => {
            // Accept messages from any origin for the iframe communication
            if (event.data && event.data.type === 'NAVIGATE') {
                const targetUrl = event.data.url;
                console.log('Received navigation message from iframe:', targetUrl);
                
                // Navigate using React Router instead of reloading the page
                navigate(targetUrl);
            }
        };

        window.addEventListener('message', handleMessage);
        
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [navigate]);
    
    return (
    <iframe
        src={iframeSrc}
        title="Cesium App"
        style={{
        border: "none",
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        }}
    />
  );
}