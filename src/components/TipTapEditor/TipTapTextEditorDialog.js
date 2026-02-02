'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import TipTapMainEditor from './TipTapMainEditor';

const TipTapTextEditorDialog = ({
  open,
  onClose,
  content,
  onSave,
  label,
  tileDetails = [],
  selectedTileIndex = 0
}) => {
  const [editorContent, setEditorContent] = useState(content || '');
  const [textBoxHeading, setTextBoxHeading] = useState('');
  const [indexValue, setIndexValue] = useState(selectedTileIndex);
  const [isContentReady, setIsContentReady] = useState(false);
  const editorContainerRef = useRef(null);
  const inputRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setIsContentReady(false);
      return;
    }
    
    const nextHeading =
      tileDetails[selectedTileIndex] && tileDetails[selectedTileIndex].editorHeading
        ? tileDetails[selectedTileIndex].editorHeading
        : 'Title';
    setTextBoxHeading(nextHeading);
    setIndexValue(selectedTileIndex);
    
    // Get content from tileDetails if content prop is not provided
    const tileContent = tileDetails[selectedTileIndex]?.tileContent || content || '';
    setEditorContent(tileContent);
    
    // Set content ready after a small delay to ensure content is set
    // Use longer delay on mobile devices for better reliability
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const delay = isMobile ? 100 : 50;
    
    const timeoutId = setTimeout(() => {
      setIsContentReady(true);
    }, delay);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [open, selectedTileIndex, content, tileDetails]);

  // Fix height for iOS Safari
  useEffect(() => {
    if (!open || !modalRef.current) return;

    const setModalHeight = () => {
      if (modalRef.current) {
        // Use window.innerHeight for iOS Safari compatibility
        const vh = window.innerHeight * 0.01;
        modalRef.current.style.setProperty('--vh', `${vh}px`);
        modalRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    setModalHeight();
    window.addEventListener('resize', setModalHeight);
    window.addEventListener('orientationchange', setModalHeight);

    return () => {
      window.removeEventListener('resize', setModalHeight);
      window.removeEventListener('orientationchange', setModalHeight);
    };
  }, [open]);

  // Prevent editor and input from auto-focusing when modal opens
  useEffect(() => {
    if (open && isInitialMountRef.current) {
      // Blur any focused elements immediately when modal opens
      const blurActive = () => {
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
        // Also blur ProseMirror editor if it exists
        const proseMirror = document.querySelector('.ProseMirror');
        if (proseMirror && document.activeElement === proseMirror) {
          proseMirror.blur();
        }
      };

      blurActive();

      // Prevent focus on editor and input when modal first opens
      const preventFocus = (e) => {
        // Prevent focus on input
        if (inputRef.current && (e.target === inputRef.current || inputRef.current.contains(e.target))) {
          e.preventDefault();
          e.stopPropagation();
          blurActive();
          return;
        }

        // Prevent focus on editor - check entire editor container
        if (editorContainerRef.current && editorContainerRef.current.contains(e.target)) {
          // Check if the target is anywhere in the editor area (ProseMirror, toolbar, etc.)
          const editorElement = editorContainerRef.current.querySelector('.ProseMirror');
          const toolbarElement = editorContainerRef.current.querySelector('.tiptap-editor-container');
          
          if (editorElement && (e.target === editorElement || editorElement.contains(e.target))) {
            e.preventDefault();
            e.stopPropagation();
            blurActive();
            return;
          }
          
          // Also prevent focus on toolbar elements initially
          if (toolbarElement && toolbarElement.contains(e.target) && e.target !== toolbarElement) {
            e.preventDefault();
            e.stopPropagation();
            blurActive();
            return;
          }
        }
      };

      // Add event listeners to prevent focus immediately
      document.addEventListener('focusin', preventFocus, true);
      document.addEventListener('focus', preventFocus, true);
      document.addEventListener('mousedown', preventFocus, true);
      document.addEventListener('touchstart', preventFocus, true);

      // Continuously blur editor for a short period
      const blurInterval = setInterval(() => {
        blurActive();
      }, 50);

      // Remove listeners after a delay to allow normal interaction
      const removeTimeoutId = setTimeout(() => {
        clearInterval(blurInterval);
        document.removeEventListener('focusin', preventFocus, true);
        document.removeEventListener('focus', preventFocus, true);
        document.removeEventListener('mousedown', preventFocus, true);
        document.removeEventListener('touchstart', preventFocus, true);
        isInitialMountRef.current = false;
        // Make editor editable after delay
        const proseMirror = editorContainerRef.current?.querySelector('.ProseMirror');
        if (proseMirror) {
          proseMirror.setAttribute('contenteditable', 'true');
        }
      }, 800);

      return () => {
        clearInterval(blurInterval);
        clearTimeout(removeTimeoutId);
        document.removeEventListener('focusin', preventFocus, true);
        document.removeEventListener('focus', preventFocus, true);
        document.removeEventListener('mousedown', preventFocus, true);
        document.removeEventListener('touchstart', preventFocus, true);
      };
    }
    
    if (!open) {
      // Reset flag when modal closes
      isInitialMountRef.current = true;
    }
  }, [open]);

  const handleClose = () => {
    onClose && onClose(editorContent);
  };

  const handleSave = () => {
    onSave && onSave(editorContent, textBoxHeading);
  };

  const canGoPrev = indexValue > 0;
  const canGoNext = indexValue < tileDetails.length - 1;
  const hasMultipleTiles = tileDetails.length > 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    const nextIndex = indexValue - 1;
    setIndexValue(nextIndex);
    const td = tileDetails[nextIndex] || {};
    setTextBoxHeading(td.editorHeading || 'Title');
    const newContent = td.tileContent || '';
    setEditorContent(newContent);
    setIsContentReady(false);
    // Small delay to ensure content is set before rendering editor
    setTimeout(() => setIsContentReady(true), 50);
  };

  const goNext = () => {
    if (!canGoNext) return;
    const nextIndex = indexValue + 1;
    setIndexValue(nextIndex);
    const td = tileDetails[nextIndex] || {};
    setTextBoxHeading(td.editorHeading || 'Title');
    const newContent = td.tileContent || '';
    setEditorContent(newContent);
    setIsContentReady(false);
    // Small delay to ensure content is set before rendering editor
    setTimeout(() => setIsContentReady(true), 50);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out'
        onClick={handleClose}
      />

      {/* Modal - Desktop: centered, Mobile: bottom sheet */}
      <div className='fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none'>
        <div
          ref={modalRef}
          className='bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:w-full sm:max-w-[1104px] h-[100dvh] sm:h-auto sm:max-h-[90vh] max-h-screen flex flex-col pointer-events-auto transform transition-all duration-300 ease-in-out'
          onClick={e => e.stopPropagation()}
          style={{
            height: typeof window !== 'undefined' && window.innerWidth < 640 
              ? `${window.innerHeight}px` 
              : undefined
          }}
        >
          {/* Header */}
          <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-[#63899e]/10 to-[#4a6d7e]/10 backdrop-blur-sm flex-shrink-0'>
            <div className='flex-1 min-w-0 mr-4'>
              <Input
                ref={inputRef}
                type='text'
                value={textBoxHeading}
                onChange={e => setTextBoxHeading(e.target.value)}
                placeholder='Enter title...'
                className='text-lg font-semibold border border-gray-300 bg-white rounded-lg focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:border-[#63899e] px-4 h-11 transition-all duration-200'
                autoFocus={false}
              />
            </div>
            <button
              onClick={handleClose}
              className='p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 border-0 outline-none flex-shrink-0 cursor-pointer'
              aria-label='Close dialog'
            >
              <svg
                className='h-5 w-5'
                fill='none'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.5'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>

          

          {/* Editor Content */}
          <div className='flex-1 overflow-hidden flex items-stretch min-h-0'>
            {/* Editor */}
            <div 
              ref={editorContainerRef}
              className='flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6'
            >
              {isContentReady && (
                <TipTapMainEditor
                  key={`editor-${open}-${indexValue}-${editorContent ? 'has-content' : 'empty'}`}
                  initialContent={editorContent}
                  onContentChange={html => setEditorContent(html)}
                  editable={!isInitialMountRef.current}
                />
              )}
            </div>
          </div>
{/* Navigation Indicator */} 
      {hasMultipleTiles && (
            <div className='flex items-center justify-center gap-2 px-4 py-3 border-b border-gray-200 '>
              <button
                onClick={goPrev}
                disabled={!canGoPrev}
                className={`p-2 rounded-lg transition-all duration-200 border-0 outline-none ${
                  canGoPrev
                    ? 'text-[#63899e] hover:bg-[#63899e]/10 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                aria-label='Previous tile'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path d='M15 19l-7-7 7-7' />
                </svg>
              </button>
              <div className='flex items-center gap-1 px-3'>
                <span className='text-sm text-gray-600 font-medium'>
                  {indexValue + 1} / {tileDetails.length}
                </span>
              </div>
              <button
                onClick={goNext}
                disabled={!canGoNext}
                className={`p-2 rounded-lg transition-all duration-200 border-0 outline-none ${
                  canGoNext
                    ? 'text-[#63899e] hover:bg-[#63899e]/10 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                aria-label='Next tile'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2.5'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path d='M9 5l7 7-7 7' />
                </svg>
              </button>
            </div>
          )}
          {/* Footer Actions */}
          <div
            className="flex items-center gap-3 p-4 sm:p-6 bg-gray-50/50 flex-shrink-0 sm:justify-end"
            style={{ borderTop: '1px solid #e5e7eb' }} // inline style for border
          >
            <Button
              variant="outline"
              onClick={handleClose}
              className="cursor-pointer w-1/2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              className="bg-[#63899e] hover:bg-[#4a6d7e] cursor-pointer w-1/2"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TipTapTextEditorDialog;
