import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import toast from "react-hot-toast";

export default function EncryptDecrypt() {
  const { profile, isAuthenticated } = useAuth();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

  const handleEncrypt = async () => {
    if (!isAuthenticated) return toast.error("User not authenticated");

    try {
      const res = await fetch("http://127.0.0.1:8000/encrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profile?.token}`,
        },
        body: JSON.stringify({ data: inputText }),
      });

      if (!res.ok) throw new Error("Encryption failed");

      const data = await res.json();
      setOutputText(data.encrypted);
      toast.success("Data Encrypted!");
    } catch (err) {
      console.error(err);
      toast.error("Encryption failed.");
    }
  };

  const handleDecrypt = async () => {
    if (!isAuthenticated) return toast.error("User not authenticated");

    try {
      const res = await fetch("http://127.0.0.1:8000/decrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${profile?.token}`,
        },
        body: JSON.stringify({ data: inputText }),
      });

      if (!res.ok) throw new Error("Decryption failed");

      const data = await res.json();
      setOutputText(data.decrypted);
      toast.success("Data Decrypted!");
    } catch (err) {
      console.error(err);
      toast.error("Decryption failed.");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="bg-blue-100 p-6 rounded shadow flex flex-col gap-4">
        <h2 className="text-xl font-bold">Encrypt / Decrypt</h2>
        <textarea
          rows={4}
          className="border p-2 rounded w-full"
          placeholder="Enter text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex gap-4">
          <button
            onClick={handleEncrypt}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Encrypt
          </button>
          <button
            onClick={handleDecrypt}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Decrypt
          </button>
        </div>
        {outputText && (
          <textarea
            rows={4}
            className="border p-2 rounded w-full bg-gray-100"
            readOnly
            value={outputText}
          />
        )}
      </div>
    </div>
  );
}
