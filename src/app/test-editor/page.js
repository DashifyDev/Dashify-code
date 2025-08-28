'use client';

import TipTapMainEditor from '@/components/TipTapEditor/TipTapMainEditor';
import React from 'react';

const sampleDirtyHTML = `<p><span style="font-family: Verdana; font-size: 18px; color: rgb(255, 0, 0);">This is a <strong>test</strong> with <em>inline</em> styles.</span></p><p>Another paragraph.</p>`;
const TestEditorPage = () => {
  const [content, setContent] = React.useState(sampleDirtyHTML);

  const handleContentChange = (newContent) => {
    console.log("Content updated:", newContent);
    setContent(newContent);
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>TipTap Editor Test Page</h1>
      <p>Ця сторінка існує тільки для тестування нового редактора.</p>
      
      <TipTapMainEditor 
        initialContent={content} 
        onContentChange={handleContentChange}
      />

      <hr style={{ margin: '20px 0' }} />

      <h2>Live HTML Output:</h2>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px' }}>
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default TestEditorPage;