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

  // ---------------------- UPLOAD ----------------------
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
      } else {
        toast.error("Extraction failed");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Upload failed");
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

  // ---------------------- REWRITE ----------------------
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
      } else {
        toast.error("Rewrite failed");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Rewrite failed");
    }
  };

  // ---------------------- DIALOGUE GENERATION ----------------------
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
      } else {
        toast.error("Dialogue generation failed");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("Dialogue generation failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <Toaster />

      <h1 className="text-4xl font-bold mb-10 text-gray-900">
        Upload PDF / DOCX
      </h1>

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
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={handleSelect}
          />
        </label>
      </div>

      {/* Extracted & Buttons */}
      {extractedText && !rewrittenStory && (
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

      {/* Rewritten Story */}
      {rewrittenStory && !dialogueText && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-3">Rewritten Story</h2>

          <div className="p-4 bg-gray-100 border rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-scroll">
            {rewrittenStory}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={generateDialogues}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Generate Dialogues
            </button>
          </div>
        </div>
      )}

      {/* Dialogue Output */}
      {dialogueText && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-3">Dialogue Version</h2>

          <div className="p-4 bg-gray-100 border rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-scroll">
            {dialogueText}
          </div>

          <div className="mt-4">
            <button
              onClick={() =>
                window.location.href = `/api/scripts/export?scriptId=${lastScriptId}`
              }
              className="px-4 py-2 bg-black text-white rounded"
            >
              Download Dialogue File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
