import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // hook do React Router

import { getPopulationDensity } from "../lib/population";
import { getMeteorData } from "../lib/calculator";

export default function TerminalLanding() {
  const fullText = `Attention, citizens! A colossal meteor is on a collision course with Earth!\nEveryone must immediately seek shelter in bunkers or underground safe locations!\nThe government is mobilizing unprecedented technology to try to stop the catastrophe,\nbut every second counts — the survival of all depends on your action now!\n\n\n\nClick to follow up!`;

  const [displayedText, setDisplayedText] = useState("");
  const navigate = useNavigate(); // hook para navegar

  const [canClick, setCanClick] = useState(false); // novo estado


  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) {
        clearInterval(interval);
        setCanClick(true);
      }
    }, 30); // velocidade da digitação em ms

    return () => clearInterval(interval);
  }, []);

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
    marginLeft: "20%",
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

  const handleClick = async  () => {

    const dataFinal = getMeteorData(10, 'km', 2000, 4, 'km/s', 25, -1);
    console.log(dataFinal);

    if(canClick);
      // navigate("/home"); // substitua pelo path desejado
  };

  return (
    <div style={containerStyle} onClick={handleClick}>
        <style>{styleSheet}</style>
        <div style={textWrapperStyle}>
          <pre style={textStyle}>
            {displayedText}
            <span style={cursorStyle}>|</span>
          </pre>
        </div>
      </div>
  );
}