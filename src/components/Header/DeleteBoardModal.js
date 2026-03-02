"use client";
import { Button } from "../ui/button";

function DeleteBoardModal({ open, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300"
        onClick={onCancel}
      />
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full min-h-screen z-[10001] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-sm pointer-events-auto transform transition-all duration-300"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Delete Dashboard</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this dashboard?
            </p>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onCancel} className="w-1/2">
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 text-white w-1/2"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DeleteBoardModal;
