import React from 'react';

/**
 * Clean simple Markdown renderer for AI deal responses
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Split by line and process basic markdown blocks
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-gray-200">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Headings ###
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 flex items-center gap-2 border-b border-gray-700/60 pb-1">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-indigo-300 mt-5 mb-2">
              {trimmed.replace('## ', '')}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-bold text-indigo-400 mt-6 mb-3">
              {trimmed.replace('# ', '')}
            </h1>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const text = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 my-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div>{renderFormattedText(text)}</div>
            </div>
          );
        }

        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const text = trimmed.replace(/^\d+\.\s/, '');
          const match = trimmed.match(/^(\d+)\./);
          const num = match ? match[1] : '•';
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-1 my-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-semibold shrink-0">
                {num}
              </span>
              <div className="pt-0.5">{renderFormattedText(text)}</div>
            </div>
          );
        }

        // Standard text line
        return <p key={idx} className="my-1">{renderFormattedText(line)}</p>;
      })}
    </div>
  );
}

// Helper to parse **bold** and *italic* inside markdown lines
function renderFormattedText(text) {
  // Split by bold regex (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-indigo-200 bg-indigo-950/40 px-1 py-0.5 rounded border border-indigo-800/30">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
