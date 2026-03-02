"use client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

function AddUpdateBoardModal({ open, mode, name, onNameChange, onConfirm, onCancel }) {
  if (!open) return null;

  const title = mode === "update" ? "Update Dashboard" : "Add Dashboard";

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300"
        onClick={onCancel}
      />
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[10001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all duration-300"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="px-6 py-4">
            <Input
              type="text"
              value={name}
              placeholder="Enter Dashboard Name"
              onChange={onNameChange}
              className="w-full"
              autoFocus
            />
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3 justify-end sm:justify-end">
            <Button variant="outline" onClick={onCancel} className="w-1/2">
              Cancel
            </Button>
            <Button variant="default" onClick={onConfirm} className="w-1/2">
              Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddUpdateBoardModal;
