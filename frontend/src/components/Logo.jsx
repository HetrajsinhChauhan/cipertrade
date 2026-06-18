import React from 'react';

export default function Logo({ color = '#00f0ff' }) {
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
      <text 
        x="5" 
        y="32" 
        fontFamily="'Space Grotesk', sans-serif" 
        fontSize="36" 
        fontWeight="700" 
        fill={color} 
        letterSpacing="-1"
      >
        ciper
      </text>
      <circle cx="27" cy="9" r="4.5" fill={color} />
    </svg>
  );
}
