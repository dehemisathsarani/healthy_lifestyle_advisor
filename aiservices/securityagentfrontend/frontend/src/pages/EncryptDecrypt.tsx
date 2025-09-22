import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import toast from "react-hot-toast";

export default function EncryptDecrypt() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const handleEncrypt = async () => {
    try {
      const res = await fetch("http://localhost:8000/encrypt/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      setOutputText(`Encrypted:\n${data.encrypted}\n\nHash: ${data.hash}`);
      toast.success("Text encrypted!");
    } catch {
      toast.error("Encryption failed");
    }
  };

  const handleDecrypt = async () => {
    try {
      const res = await fetch("http://localhost:8000/encrypt/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      setOutputText(`Decrypted:\n${data.decrypted}`);
      toast.success("Text decrypted!");
    } catch {
      toast.error("Decryption failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-800">Encrypt / Decrypt</h1>
          <p className="text-gray-600 mt-1">Encrypt or decrypt your text securely.</p>

          <textarea
            className="w-full mt-6 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
            rows={6}
            placeholder="Enter text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleEncrypt}
              className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-white p-3 rounded-lg hover:from-green-500 hover:to-green-700 transition shadow-md"
            >
              Encrypt
            </button>
            <button
              onClick={handleDecrypt}
              className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 text-white p-3 rounded-lg hover:from-blue-500 hover:to-blue-700 transition shadow-md"
            >
              Decrypt
            </button>
          </div>

          {outputText && (
            <div className="mt-6 p-4 bg-gray-200 rounded-lg whitespace-pre-wrap shadow-inner">{outputText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
