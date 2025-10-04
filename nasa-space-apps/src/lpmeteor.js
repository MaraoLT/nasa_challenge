import { useState, useEffect } from "react";
import { ACESFilmicToneMapping } from "three/src/constants.js";

const BALL_SIZE = 50;
const NUM_BALLS = 3;
const BALL_IMAGE = "/meteoro3.jpg";

function randomEdgePosition() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;

  switch (edge) {
    case 0: // topo
      x = Math.random() * (window.innerWidth - BALL_SIZE);
      y = 0;
      break;
    case 1: // baixo
      x = Math.random() * (window.innerWidth - BALL_SIZE);
      y = window.innerHeight - BALL_SIZE;
      break;
    case 2: // esquerda
      x = 0;
      y = Math.random() * (window.innerHeight - BALL_SIZE);
      break;
    case 3: // direita
      x = window.innerWidth - BALL_SIZE;
      y = Math.random() * (window.innerHeight - BALL_SIZE);
      break;
  }

  // Velocidade inicial apontando para dentro
  const dx = edge === 2 ? 3 : edge === 3 ? -3 : (Math.random() - 0.5) * 2;
  const dy = edge === 0 ? 3 : edge === 1 ? -3 : (Math.random() - 0.5) * 2;

  return { x, y, dx, dy ,color: `hsl(${Math.random() * 360}, 70%, 50%)`};
}

export default function MovingBalls() {
  const [balls, setBalls] = useState(() =>
    Array.from({ length: NUM_BALLS }, () => ({
      ...randomEdgePosition()
    }))
  );

  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);


  useEffect(() => {
    let animationId;

    const moveBalls = () => {
      setBalls((prevBalls) =>
        prevBalls.map((ball) => {
          let { x, y, dx, dy } = ball;
          
          const vectorX = mousePos.x - (x + BALL_SIZE / 2);
          const vectorY = mousePos.y - (y + BALL_SIZE / 2);
          const distance = Math.sqrt(vectorX ** 2 + vectorY ** 2);

          const factor = Math.min(10000/(distance*distance), 0.08);

          dx += (vectorX / distance) * factor;
          dy += (vectorY / distance) * factor;

          x += dx;
          y += dy;

          // Rebate nas bordas
          if (x <= -BALL_SIZE*4 || x >= window.innerWidth + 4 * BALL_SIZE) return randomEdgePosition();
          if (y <= -BALL_SIZE*4 || y >= window.innerHeight + 4 * BALL_SIZE) return randomEdgePosition();

          return { ...ball, x, y, dx, dy };
        })
      );

      animationId = requestAnimationFrame(moveBalls);
    };

    animationId = requestAnimationFrame(moveBalls);
    return () => cancelAnimationFrame(animationId);
  }, [mousePos]);

  return (
    <>
      {balls.map((ball, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: ball.x,
            top: ball.y,
            width: BALL_SIZE,
            height: BALL_SIZE,
            borderRadius: "60% 40% 60% 35% / 40% 55% 45% 60%",
            backgroundImage: `url(${BALL_IMAGE})`,
            backgroundSize: "cover", // cobre toda a bola
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </>
  );
}
