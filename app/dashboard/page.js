"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Dashboard() {
  const [dragActive, setDragActive] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [rewrittenStory, setRewrittenStory] = useState("");
  const [dialogueText, setDialogueText] = useState("");
  const [characters, setCharacters] = useState([]);
  const [lastScriptId, setLastScriptId] = useState(null);
  const [showExtractModal, setShowExtractModal] = useState(false);

  // ------------------------------------
  // 1) Upload File → Extract text
  // ------------------------------------
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

  // ------------------------------------
  // 2) Rewrite story
  // ------------------------------------
  const rewriteStory = async () => {
    if (!lastScriptId) return toast.error("Upload first");

    const loading = toast.loading("Rewriting...");

    try {
      const res = await fetch("/api/story-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText, scriptId: lastScriptId }),
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        setRewrittenStory(data.rewritten);
        setCharacters(data.characters || []);
        setDialogueText("");
        toast.success("Story rewritten!");
      } else toast.error("Rewrite failed");
    } catch {
      toast.dismiss(loading);
      toast.error("Rewrite failed");
    }
  };

  // ------------------------------------
  // 3) Generate dialogues
  // ------------------------------------
  const generateDialogues = async () => {
    if (!rewrittenStory) return toast.error("Rewrite first");

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
        toast.success("Dialogues ready!");
      } else toast.error("Failed");
    } catch {
      toast.dismiss(loading);
      toast.error("Failed");
    }
  };

  // ------------------------------------
  // 4) Generate TTS Audio (NEW)
  // ------------------------------------
  const generateAudio = async () => {
    if (!dialogueText) return toast.error("Generate dialogues first");

    const loading = toast.loading("Generating audio...");

    // Split into non-empty lines
    const lines = dialogueText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: lastScriptId,
          dialogues: lines,
        }),
      });

      const data = await res.json();
      toast.dismiss(loading);

      if (data.success) {
        toast.success("Audio Ready!");
        window.open(data.url, "_blank");
      } else {
        toast.error("TTS Failed");
      }
    } catch (err) {
      toast.dismiss(loading);
      toast.error("TTS Error");
    }
  };

  // ------------------------------------
  // 5) Download Dialogue File
  // ------------------------------------
  const downloadDialogue = () => {
    if (!lastScriptId) return;
    window.location.href = `/api/scripts/export?scriptId=${lastScriptId}`;
  };

  // ------------------------------------
  // UI
  // ------------------------------------
  return (
    <div className="min-h-screen p-10 bg-gray-50 flex flex-col items-center">
      <Toaster />

      <h1 className="text-4xl font-bold mb-8">Upload PDF / DOCX</h1>

      {/* --- Upload Box --- */}
      <div
        className={`w-full max-w-2xl h-56 flex flex-col justify-center items-center border-2 border-dashed rounded-xl ${
          dragActive ? "bg-blue-50 border-blue-500" : "bg-white border-gray-300"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          uploadFile(e.dataTransfer.files[0]);
          setDragActive(false);
        }}
      >
        <p>Drag & Drop your file</p>
        <p className="text-sm text-gray-400">OR</p>

        <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded">
          Choose File
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx"
            onChange={(e) => uploadFile(e.target.files[0])}
          />
        </label>
      </div>

      {extractedText && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setShowExtractModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded"
          >
            View Extracted Text
          </button>

          <button
            onClick={rewriteStory}
            className="px-6 py-2 bg-purple-600 text-white rounded"
          >
            Proceed to Story Rewriting
          </button>
        </div>
      )}

      {/* --- Rewritten Story --- */}
      {rewrittenStory && !dialogueText && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-3">Rewritten Story</h2>

          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-scroll whitespace-pre-wrap">
            {rewrittenStory}
          </div>

          <button
            onClick={generateDialogues}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded"
          >
            Generate Dialogues
          </button>
        </div>
      )}

      {/* --- Dialogue Version --- */}
      {dialogueText && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-3">Dialogue Version</h2>

          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-scroll whitespace-pre-wrap">
            {dialogueText}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={downloadDialogue}
              className="px-6 py-2 bg-green-600 text-white rounded"
            >
              Download Dialogue File
            </button>

            {/* NEW BUTTON */}
            <button
              onClick={generateAudio}
              className="px-6 py-2 bg-red-600 text-white rounded"
            >
              Generate Audio (TTS)
            </button>
          </div>
        </div>
      )}

      {/* --- Extract Modal --- */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-full max-w-xl">
            <h3 className="font-semibold mb-3 text-xl">Extracted Text</h3>

            <div className="bg-gray-100 p-3 max-h-80 overflow-y-scroll whitespace-pre-wrap">
              {extractedText}
            </div>

            <button
              onClick={() => setShowExtractModal(false)}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
