import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface SimpleMarkdownRendererProps {
  markdown: string;
}

const SimpleMarkdownRenderer = ({ markdown }: SimpleMarkdownRendererProps) => {
  return (
    <div style={{ color: '#dfe6eb' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h2: ({ children }) => <h2 style={{ margin: '0 0 10px 0', color: '#ecf0f1' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ margin: '18px 0 8px 0', color: '#85c1e9' }}>{children}</h3>,
          p: ({ children }) => <p style={{ margin: '8px 0' }}>{children}</p>,
          li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
          img: ({ src, alt }) => <img src={src || ''} alt={alt || ''} style={{ maxWidth: '100%', borderRadius: 8, margin: '10px 0', border: '1px solid #3d5366' }} />,
          video: ({ src }) => <video controls src={typeof src === 'string' ? src : ''} style={{ width: '100%', borderRadius: 8, margin: '10px 0', border: '1px solid #3d5366' }} />,
          code: ({ children }) => <code style={{ backgroundColor: '#314759', border: '1px solid #476079', borderRadius: '4px', padding: '1px 5px', color: '#f8f3c2', fontSize: '12px' }}>{children}</code>,
          table: ({ children }) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0', border: '1px solid #3d5366' }}>{children}</table>,
          th: ({ children }) => <th style={{ textAlign: 'left', padding: '7px 8px', border: '1px solid #3d5366', backgroundColor: '#243645', color: '#ecf0f1' }}>{children}</th>,
          td: ({ children }) => <td style={{ padding: '7px 8px', border: '1px solid #3d5366', color: '#dfe6eb' }}>{children}</td>,
        }}
      >
        {markdown.replace(/\[video\]\((https?:\/\/[^\s)]+)\)/gi, '<video controls src="$1" style="width:100%;border-radius:8px;margin:10px 0;border:1px solid #3d5366"></video>')}
      </ReactMarkdown>
    </div>
  );
};

export default SimpleMarkdownRenderer;
