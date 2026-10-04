import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 mt-8 mb-4 border-b border-stone-200 dark:border-stone-800 pb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-8 mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 mt-6 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 leading-relaxed mb-5">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-6 mb-5 space-y-1.5 text-stone-700 dark:text-stone-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-6 mb-5 space-y-1.5 text-stone-700 dark:text-stone-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-stone-700 dark:text-stone-300">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-5 italic text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline underline-offset-2 font-medium transition-colors"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <span className="block my-6">
              <img
                src={src}
                alt={alt || 'Blog illustration'}
                className="rounded-xl border border-stone-200 dark:border-stone-800 max-h-[500px] w-full object-cover shadow-md"
                loading="lazy"
              />
              {alt && (
                <span className="block text-center text-xs text-stone-500 dark:text-stone-400 mt-2">
                  {alt}
                </span>
              )}
            </span>
          ),
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-indigo-600 dark:text-indigo-400 text-sm font-mono border border-stone-200 dark:border-stone-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : 'text'}>
                {String(children).replace(/\n$/, '')}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; children: string }> = ({
  language,
  children,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-stone-800 bg-stone-950 shadow-lg text-stone-200">
      <div className="flex items-center justify-between px-4 py-2 bg-stone-900/90 border-b border-stone-800 text-xs font-mono text-stone-400">
        <span className="uppercase tracking-wider font-semibold">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-stone-950 text-stone-100">
        <pre>{children}</pre>
      </div>
    </div>
  );
};
