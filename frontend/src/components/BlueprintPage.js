import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/blueprint.css';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';

export default function BlueprintPage({ wallpaperUrl }) {
  const navigate = useNavigate();
  const wallpaper = wallpaperUrl || '/assets/nebula.jpg';

  // Define 5 subpages for the blueprint walkthrough
  const SUBPAGES = React.useMemo(() => ([
    {
      title: 'Kinetic impactor',
      text: [
        'The kinetic impactor is a bold, hands-on method that knocks an asteroid off course by hitting it head-on. NASA’s DART mission proved this strategy works when it slammed into Dimorphos in 2022, changing its orbit by minutes — enough to save a planet in the right scenario.',
        'It’s fast, powerful, and precise, showing how a single well-aimed spacecraft can turn a doomsday rock into a harmless wanderer.'
      ],
      imgSrc: '/assets/kinetic_impactor.png',
      switch: false,
    },
    {
      title: 'Gravity tractor',
      text: [
        'The gravity tractor method is all about patience and finesse. A spacecraft hovers beside the asteroid, its gravity slowly tugging the rock onto a safer course over months or years.',
        'It’s quiet but powerful, ideal when there’s plenty of warning time. For defenders, this technique is a lesson in control — using the subtle pull of physics to protect an entire world.'
      ],
      imgSrc: '/assets/gravity_tractor.png',
      switch: true,
    },
    {
      title: 'Laser ablation',
      text: [
        'The laser ablation technique uses light as a weapon of precision. Spacecraft focus powerful beams or reflected sunlight onto the asteroid’s surface, vaporizing small amounts of rock and creating jets that nudge it away from danger.',
        'No explosions, no collisions — just focused energy and smart engineering. It’s planetary defense for the patient and precise, where science burns brighter than brute force.'
      ],
      imgSrc: '/assets/laser_ablation.png',
      switch: false,
    },
    {
      title: 'Ion Beam Shepherd',
      text: [
        'The ion beam shepherd pushes without touching. A spacecraft fires streams of charged particles toward the asteroid, giving it a steady, gentle shove while counter-thrusting to stay in place.',
        'It’s slow but efficient, turning advanced propulsion technology into a long-term defense tool. This method suits defenders who thrive on balance — mastering delicate control to reshape the motion of worlds.'
      ],
      imgSrc: '/assets/ion_shepherd.png',
      switch: true,
    },
    {
      title: 'Nuclear blast',
      text: [
        'The nuclear blast is the last, desperate move — a high-stakes gamble when time has run out. A carefully timed explosion near the asteroid’s surface vaporizes material and blasts it off course.',
        'It’s risky and dramatic, but in a planetary emergency, it could mean Earth’s survival. For defenders, this method embodies courage under pressure — where precision and decisiveness decide the fate of the world.'
      ],
      imgSrc: '/assets/nuclear_blast.png',
      switch: false,
    },
  ]), []);

  const [index, setIndex] = React.useState(0);
  // Two-layer paper stack
  const [baseIndex, setBaseIndex] = React.useState(0);
  const [overlayIndex, setOverlayIndex] = React.useState(0);
  const [animClass, setAnimClass] = React.useState(''); // applied to overlay paper
  const [animating, setAnimating] = React.useState(false);

  // Keep stack in sync when index changes programmatically
  React.useEffect(() => {
    setBaseIndex(index);
    setOverlayIndex(index);
  }, [index]);

  // Start music when component mounts
  React.useEffect(() => {
    // Initialize audio context manager
    audioContextManager.init();
    
    const playResult = musicManager.playTrack('/resources/sounds/Eternal Horizon.mp3', true);
    if (!playResult) {
      console.log('Music will play after user interaction');
    }
    
    return () => {
      // Fade out music when leaving the component
      musicManager.fadeOut(500);
    };
  }, []);

  const pageFor = (i) => SUBPAGES[i] || SUBPAGES[0];
  const paragraphsFor = (p) => {
    const t = p.text;
    if (Array.isArray(t)) return t.filter(Boolean);
    if (typeof t === 'string') return t.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    return [];
  };
  const gridClassFor = (p) => `blueprint__grid${p.switch ? ' blueprint__grid--switch' : ''}`;

  const basePage = pageFor(baseIndex);
  const overlayPage = pageFor(overlayIndex);

  const dirs = ['left', 'right', 'top', 'bottom'];
  const randomDir = () => dirs[Math.floor(Math.random() * dirs.length)];

  // Exit current overlay and then run an action (e.g., navigate away)
  const exitAnd = (action) => {
    if (animating) return;
    setAnimating(true);
    const exitDir = randomDir();
    setAnimClass(`bp-animating bp-anim-exit-${exitDir}`);
    setTimeout(() => {
      action?.();
      setAnimClass('');
      setAnimating(false);
    }, 330);
  };

  const onPrev = () => {
    if (animating) return;
    if (index === 0) return navigate('/mitigation');
    const prevIdx = Math.max(0, index - 1);
    // Prepare overlay with previous content and slide it in on top
    setOverlayIndex(prevIdx);
    setAnimating(true);
    const enterDir = randomDir();
    setAnimClass(`bp-animating bp-anim-enter-${enterDir}`);
    setTimeout(() => {
      setIndex(prevIdx);
      setBaseIndex(prevIdx);
      setAnimClass('');
      setAnimating(false);
    }, 400); // enter ~380ms
  };
  const onNext = () => {
    if (animating) return;
    if (index === SUBPAGES.length - 1) return navigate('/ending');
    const nextIdx = Math.min(SUBPAGES.length - 1, index + 1);
    // Prepare base with next content and slide current out to reveal it
    setBaseIndex(nextIdx);
    const exitDir = randomDir();
    setAnimClass(`bp-animating bp-anim-exit-${exitDir}`);
    setAnimating(true);
    setTimeout(() => {
      setIndex(nextIdx);
      setOverlayIndex(nextIdx);
      setAnimClass('');
      setAnimating(false);
    }, 330); // exit ~320ms
  };

  return (
    <section className="blueprint" style={{ '--bp-wallpaper': `url(${wallpaper})` }}>
      <button type="button" className="bp-nav__btn left" onClick={onPrev} aria-label="Previous">‹</button>
      <div className="blueprint__stage">
        {/* Base paper holds the content revealed after a Next, or the current content during Prev */}
        <div className="blueprint__paper base">
          <h1 className="blueprint__title blueprint__title--center">{basePage.title}</h1>
          <div className={gridClassFor(basePage)}>
            <div className="blueprint__text">
              {paragraphsFor(basePage).map((p, i) => (<p key={i}>{p}</p>))}
            </div>
            <div className="blueprint__imageWrap">
              <img className="blueprint__image" src={basePage.imgSrc} alt={basePage.title} />
            </div>
          </div>
        </div>
        {/* Overlay paper shows the current content and animates in/out */}
        <div className={`blueprint__paper overlay ${animClass}`}>
          <h1 className="blueprint__title blueprint__title--center">{overlayPage.title}</h1>
          <div className={gridClassFor(overlayPage)}>
            <div className="blueprint__text">
              {paragraphsFor(overlayPage).map((p, i) => (<p key={i}>{p}</p>))}
            </div>
            <div className="blueprint__imageWrap">
              <img className="blueprint__image" src={overlayPage.imgSrc} alt={overlayPage.title} />
            </div>
          </div>
        </div>
      </div>
      <button type="button" className="bp-nav__btn right" onClick={onNext} aria-label="Next">›</button>
    </section>
  );
}
