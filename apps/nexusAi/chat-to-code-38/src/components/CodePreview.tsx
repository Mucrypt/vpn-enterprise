// Code Preview Component with Syntax Highlighting
import { useEffect, useRef } from 'react'
import { Highlight, themes } from 'prism-react-renderer'

interface CodePreviewProps {
  code: string
  language: string
  showLineNumbers?: boolean
}

export function CodePreview({
  code,
  language,
  showLineNumbers = true,
}: CodePreviewProps) {
  return (
    <Highlight theme={themes.vsDark} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={`${className} text-sm overflow-auto p-4 rounded-lg`}
          style={style}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {showLineNumbers && (
                <span className='inline-block w-8 select-none opacity-50 text-right mr-4'>
                  {i + 1}
                </span>
              )}
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

// Live Preview Component
interface LivePreviewProps {
  code: string
  framework: string
}

export function LivePreview({ code, framework }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!iframeRef.current) return

    const doc = iframeRef.current.contentDocument
    if (!doc) return

    // Create a complete HTML document with the code
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    
    // Auto-render if there's an App component
    if (typeof App !== 'undefined') {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    }
  </script>
</body>
</html>
    `

    doc.open()
    doc.write(html)
    doc.close()
  }, [code, framework])

  return (
    <div className='w-full h-full border rounded-lg bg-white'>
      <iframe
        ref={iframeRef}
        className='w-full h-full rounded-lg'
        title='Live Preview'
        sandbox='allow-scripts'
      />
    </div>
  )
}
