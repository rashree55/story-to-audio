"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [dragActive, setDragActive] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [rewrittenStory, setRewrittenStory] = useState("");
  const [dialogueText, setDialogueText] = useState("");
  const [characters, setCharacters] = useState([]);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [lastScriptId, setLastScriptId] = useState(null);

  // ---------------- UPLOAD ----------------
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
        setExtractedText(data.text);
        setLastScriptId(data.id);
        toast.success("Text extracted!");
      } else toast.error("Extraction failed");
    } catch {
      toast.dismiss(loading);
      toast.error("Upload failed");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    uploadFile(e.dataTransfer.files[0]);
  };

  const handleSelect = (e) => uploadFile(e.target.files[0]);

  // ---------------- REWRITE ----------------
  const rewriteStory = async () => {
    if (!lastScriptId) return toast.error("Upload a file first");

    const loading = toast.loading("Rewriting...");

    try {
      const res = await fetch("/api/story-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: extractedText,
          scriptId: lastScriptId,
        }),
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        setRewrittenStory(data.rewritten);
        setCharacters(data.characters || []);
        toast.success("Story rewritten!");
      } else toast.error("Rewrite failed");
    } catch {
      toast.dismiss(loading);
      toast.error("Rewrite failed");
    }
  };

  // ---------------- DIALOGUES ----------------
  const generateDialogues = async () => {
    if (!rewrittenStory) return toast.error("Rewrite story first");

    const loading = toast.loading("Generating dialogues...");

    try {
      const res = await fetch("/api/story-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewrittenStory,
          characters,
          scriptId: lastScriptId,
        }),
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        setDialogueText(data.dialogueText);
        toast.success("Dialogues generated!");
      } else toast.error("Dialogue generation failed");
    } catch {
      toast.dismiss(loading);
      toast.error("Dialogue generation failed");
    }
  };

  // ---------------- DOWNLOAD ----------------
  const downloadFile = () => {
    if (!lastScriptId) return;
    window.location.href = `/api/scripts/export?scriptId=${lastScriptId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <Toaster />

      <h1 className="text-4xl font-bold mb-10 text-gray-900">
        Upload PDF / DOCX
      </h1>

      {/* UPLOAD BOX */}
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
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleSelect}
          />
        </label>
      </div>

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

      {/* SINGLE SWITCHING BOX */}
      {(rewrittenStory || dialogueText) && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-3">
            {dialogueText ? "Dialogue Version" : "Rewritten Story"}
          </h2>

          <div className="p-4 bg-gray-100 border rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-scroll">
            {dialogueText || rewrittenStory}
          </div>

          {!dialogueText && (
            <button
              onClick={generateDialogues}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Generate Dialogues
            </button>
          )}

          {dialogueText && (
            <button
              onClick={downloadFile}
              className="mt-4 px-5 py-2 bg-green-600 text-white rounded"
            >
              Download Dialogue File
            </button>
          )}
        </div>
      )}

      {/* EXTRACT MODAL */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3">Extracted Text</h2>

            <div className="whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded border max-h-[60vh] overflow-y-scroll">
              {extractedText}
            </div>

            <button
              onClick={() => setShowExtractModal(false)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
