"use client";

import React from "react";

interface Props {
  text: string;
  keywords: string[];
}

export default function HighlightedText({ text, keywords }: Props) {
  if (!keywords.length) return <>{text}</>;

  // Escape special characters and create a regex pattern
  const escapedKeywords = keywords
    .filter(k => k.length > 2) // Ignore very short words
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  if (escapedKeywords.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="px-0.5 rounded-sm font-medium" style={{ background: "rgba(124,144,130,0.25)", color: "var(--text-primary)" }}>
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
