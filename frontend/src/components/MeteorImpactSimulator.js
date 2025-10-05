import { useLocation } from 'react-router-dom';

export default function MeteorImpactSimulator() {
    const location = useLocation();
    
    // Extract the 'from' parameter from the current URL
    const urlParams = new URLSearchParams(location.search);
    const fromParam = urlParams.get('from');
    
    // Construct the iframe URL with the from parameter
    let iframeSrc = '/collision/index.html';
    if (fromParam) {
        iframeSrc += `?from=${encodeURIComponent(fromParam)}`;
    }

    console.log("Rendering MeteorImpactSimulator component", { fromParam, iframeSrc });
    
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