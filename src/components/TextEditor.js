import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const QuillEditor = dynamic(() => import('react-quill').then((mod) => mod.default || mod), {
  ssr: false,
});
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import 'react-quill/dist/quill.snow.css';
import { Dialog, DialogTitle, DialogContent ,DialogActions , Button} from '@mui/material';

const  TextEditor = ({ open, onClose , content, onSave,label }) => {
  const [ editorContent, setEditorContent] = useState();
   
  useEffect(()=>{
    setEditorContent(content)
  },[content])


  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleClose = () => {
    onClose(editorContent);
  };

  const handleSave = () => {
    onSave(editorContent)
  }

  const editorStyle = {
    height: '400px', 
    width : '100%'
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike' ,'link' ,'image'], 
      ['blockquote', 'code-block'],

      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }], 
      [{ indent: '-1' }, { indent: '+1' }], 
      [{ direction: 'rtl' }], 

      [{ size: ['small', false, 'large', 'huge'] }], 
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }], 
      [{ font: [] }],
      [{ align: [] }],
      ['clean'], 
    ],    
    
  };

  return (
      <Dialog open={open} onClose={handleClose}>
          <DialogTitle>{label ? label : 'Tile'}</DialogTitle>
          <span className="absolute top-4 right-7 cursor-pointer"
                onClick={handleClose}>
              <CloseSharpIcon />
          </span>
          <DialogContent sx={{ width: '600px', height: '500px' }}>
              <QuillEditor 
                value={editorContent} 
                onChange={handleEditorChange} 
                style={editorStyle}
                modules={quillModules}
              />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
  );
};

export default TextEditor;
