"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [dragActive, setDragActive] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [rewrittenStory, setRewrittenStory] = useState("");
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [scriptId, setScriptId] = useState(null);

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  // ------------------------------
  // UPLOAD & EXTRACT
  // ------------------------------
  const uploadFile = async (file) => {
    if (!file) return;

    const loading = toast.loading("Extracting text...");
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/scripts/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        toast.success("Text extracted successfully!");
        setExtractedText(data.text);
        setScriptId(data.id); // IMPORTANT
      } else {
        toast.error("Extraction failed");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Upload failed");
      console.error(err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    uploadFile(e.dataTransfer.files[0]);
  };

  const handleSelect = (e) => {
    uploadFile(e.target.files[0]);
  };

  // ------------------------------
  // STORY REWRITE
  // ------------------------------
  const rewriteStory = async () => {
    if (!scriptId) return toast.error("Upload a file first");

    const loading = toast.loading("Rewriting story...");

    try {
      const res = await fetch("/api/story-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedText,
          scriptId,
        }),
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        setRewrittenStory(data.rewritten);
        toast.success("Rewriting completed!");
      } else {
        toast.error(data.error || "Rewrite failed");
      }
    } catch {
      toast.dismiss(loading);
      toast.error("Rewrite failed");
    }
  };

  // ------------------------------
  // DOWNLOAD FILE
  // ------------------------------
  const openDownloadConfirm = () => {
    if (!rewrittenStory) return toast.error("No rewritten story available");
    setDownloadModalOpen(true);
  };

  const downloadRewrittenFile = () => {
    window.location.href = `/api/scripts/export?scriptId=${scriptId}`;
    setDownloadModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <Toaster />

      <h1 className="text-4xl font-bold mb-10">Upload PDF / DOCX</h1>

      {/* Upload Box */}
      <div
        className={`w-full max-w-2xl h-56 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all shadow-sm ${
          dragActive ? "bg-blue-50 border-blue-500" : "bg-white border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <p className="text-lg text-gray-600 mb-3">Drag & Drop your file here</p>
        <p className="text-gray-400 mb-3 text-sm">OR</p>

        <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700">
          Choose File
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleSelect} />
        </label>
      </div>

      {/* Buttons */}
      {extractedText && (
        <div className="mt-8 flex gap-6">
          <button
            onClick={() => setShowExtractModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Extracted Text
          </button>

          <button
            onClick={rewriteStory}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Proceed to Story Rewriting
          </button>
        </div>
      )}

      {/* Rewritten Story Box */}
      {rewrittenStory && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-3">Rewritten Story</h2>

        <div className="p-4 bg-gray-100 border rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-scroll">
        {rewrittenStory}
        </div>


          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(rewrittenStory);
                toast.success("Copied!");
              }}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Copy
            </button>

            <button
              onClick={openDownloadConfirm}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Download Rewritten File
            </button>
          </div>
        </div>
      )}

      {/* Extracted Text Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-3xl w-full shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Extracted Text</h2>

            <div
              className="h-80 overflow-y-auto border p-4 rounded bg-gray-50 whitespace-pre-wrap"
            >
              {extractedText}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowExtractModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Confirm Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Download Rewritten File</h3>
            <p className="text-sm mb-4">
              Click Download to save your rewritten file.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDownloadModalOpen(false)}
                className="px-3 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>

              <button
                onClick={downloadRewrittenFile}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
