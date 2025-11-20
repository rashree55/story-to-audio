"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [dragActive, setDragActive] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [showModal, setShowModal] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;

    const loading = toast.loading("Extracting text...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/scripts/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        toast.success("Text extracted successfully!");
        setExtractedText(data.text);
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

    const file = e.dataTransfer.files[0];
    uploadFile(file);
  };

  const handleSelect = (e) => {
    const file = e.target.files[0];
    uploadFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <Toaster />

      {/* Title */}
      <h1 className="text-4xl font-bold mb-10 text-gray-900 tracking-tight">
        Upload PDF / DOCX
      </h1>

      {/* Upload Box */}
      <div
        className={`w-full max-w-2xl h-56 
          flex flex-col items-center justify-center 
          rounded-xl border-2 border-dashed transition-all shadow-sm
          ${
            dragActive
              ? "bg-blue-50 border-blue-500 scale-[1.02]"
              : "bg-white border-gray-300"
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <p className="text-lg text-gray-600 mb-3 font-medium">
          Drag & Drop your file here
        </p>

        <p className="text-gray-400 mb-3 text-sm">OR</p>

        <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition">
          Choose File
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleSelect}
          />
        </label>
      </div>

      {/* View Extracted Text Button */}
      {extractedText && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition"
          >
            View Extracted Text
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl max-w-3xl w-full shadow-2xl animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Extracted Text
            </h2>

            <div className="h-96 overflow-y-auto border p-4 rounded-md bg-gray-50 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {extractedText}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={() => {
                  navigator.clipboard.writeText(extractedText);
                  toast.success("Copied to clipboard!");
                }}
              >
                Copy Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
