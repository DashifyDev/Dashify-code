import React, { useEffect, useState } from 'react';
import QuillEditor from 'react-quill';
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import 'react-quill/dist/quill.snow.css';
import { Dialog, DialogTitle, DialogContent ,DialogActions , Button} from '@mui/material';

const  TextEditor = ({ open, onClose , content, onSave }) => {
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
    height: '330px', 
  };

  return (
      <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Box Label</DialogTitle>
          <span className="absolute top-4 right-7 cursor-pointer"
                onClick={handleClose}>
              <CloseSharpIcon />
          </span>
          <DialogContent sx={{ width: '500px', height: '400px' }}>
              <QuillEditor value={editorContent} onChange={handleEditorChange} style={editorStyle}/>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
  );
};

export default TextEditor;