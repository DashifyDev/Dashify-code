import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
import '../styles/styles.css'
import { fonts,colors } from '@/constants/textEditorConstant';
const SunEditor = dynamic(() => import("suneditor-react"), {
  ssr: false,
});
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import { Dialog, DialogTitle, DialogContent ,DialogActions , Button} from '@mui/material';


const  TextEditor = ({ open, onClose , content, onSave,label }) => {
  const [ editorContent, setEditorContent] = useState();
   
  useEffect(()=>{
    setEditorContent(content)
  },[content])


  const labelChange = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(label, 'text/html');
    let content = doc.getElementsByTagName('div')[0].innerText;
    return content
  }

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const handleClose = () => {
    onClose(editorContent);
  };

  const handleSave = () => {
    onSave(editorContent)
  }

  return (
      <Dialog open={open} >
          <DialogTitle>{label ? label : 'Tile'}</DialogTitle>
          <span className="absolute top-4 right-7 cursor-pointer"
                onClick={handleClose}>
              <CloseSharpIcon />
          </span>
          <DialogContent sx={{ width: '600px', height: '500px', overflow:'hidden'}}>
              <SunEditor 
                defaultValue={content} 
                onChange={handleEditorChange} 
                setOptions={{
                  buttonList: [
                    ["undo", "redo"],
                    [
                      "bold",
                      "underline",
                      "italic",
                      "strike",
                      "subscript",
                      "superscript"
                    ],
                    ["font", "fontSize"],
                    ["removeFormat"],
                    ["fontColor", "hiliteColor"],
                    ["align", "list", "lineHeight"],
                    ["outdent", "indent"],
        
                    ["table", "horizontalRule", "link", "image", "video"],
                    ["preview", "print"],
                  ],
                  colorList :colors,
                  minHeight: "370px",
                  maxHeight: "370px",
                  showPathLabel: false,
                  font: fonts
                }}
              />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
  );
};

export default TextEditor;
