import React from 'react';

/**
 * Isometric 3D Colorful Puzzle Cube Logo matching the Puzzler Minimalist White Dashboard Reference Image 1:1
 */
export const PuzzlerCubeLogo: React.FC<{ className?: string }> = ({
  className = 'w-9 h-9',
}) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Top Diamond (Gold & Orange Isometric Tiles) */}
    <path d="M24 4L40 13.5L24 23L8 13.5L24 4Z" fill="#F2C94C" />
    <path d="M24 4L32 8.75L16 18.25L8 13.5L24 4Z" fill="#F2994A" />
    <path d="M32 8.75L40 13.5L24 23L16 18.25L32 8.75Z" fill="#F5B041" />
    {/* Left Face (Puzzler Blue & Deep Cobalt Isometric Tiles) */}
    <path d="M8 13.5L24 23V43L8 33.5V13.5Z" fill="#2F80ED" />
    <path d="M8 13.5L16 18.25V38.25L8 33.5V13.5Z" fill="#56CCF2" />
    <path d="M16 28.25L24 33V43L16 38.25V28.25Z" fill="#1B4F9C" />
    {/* Right Face (Coral Red, Amber & Indigo Isometric Tiles) */}
    <path d="M40 13.5L24 23V43L40 33.5V13.5Z" fill="#EB5757" />
    <path d="M32 18.25L40 13.5V23.5L32 28.25V18.25Z" fill="#F2994A" />
    <path d="M24 33L32 28.25V38.25L24 43V33Z" fill="#2D3A8C" />
  </svg>
);

export default PuzzlerCubeLogo;
