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
        setExtractedText(data.text); // store extracted text
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
    <div className="p-10">
      <Toaster />

      {/* Title */}
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">
        Upload PDF / DOCX
      </h1>

      {/* Upload Box */}
      <div
        className={`w-full max-w-xl h-44 mx-auto flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
          dragActive
            ? "bg-gray-200 border-blue-400"
            : "bg-gray-100 border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <p className="text-lg text-gray-600 mb-3">
          Drag & Drop your file here
        </p>

        <p className="text-gray-500 mb-2">OR</p>

        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
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
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Extracted Text
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full shadow-xl">
            <h2 className="text-xl font-bold mb-3">Extracted Text</h2>

            <div className="h-80 overflow-y-scroll border p-3 rounded-md bg-gray-50 text-sm whitespace-pre-wrap">
              {extractedText}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
