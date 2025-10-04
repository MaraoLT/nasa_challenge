import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/page1.css';

export default function Page1({ prevPath = '/', nextPath = '/test' }) {
  const navigate = useNavigate();
  const goPrev = React.useCallback(() => navigate(prevPath), [navigate, prevPath]);
  const goNext = React.useCallback(() => navigate(nextPath), [navigate, nextPath]);

  return (
    <section className="page1-section">
      <button
        type="button"
        className="nav-arrow left"
        onClick={goPrev}
        aria-label="Previous page"
      >
        ‹
      </button>
      <div className="page1-content">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
          mollit anim id est laborum.
        </p>
      </div>
      <button
        type="button"
        className="nav-arrow right"
        onClick={goNext}
        aria-label="Next page"
      >
        ›
      </button>
    </section>
  );
}