"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !name.trim()) {
      setMessage({ type: "error", text: "Please select an image and enter your name" });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", name.trim());

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Image uploaded successfully!" });
        setFile(null);
        setName("");
        setPreview(null);
        // Reset file input
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        // Trigger refresh of recent uploads
        window.dispatchEvent(new Event("uploadSuccess"));
      } else {
        setMessage({ type: "error", text: data.error || "Failed to upload image" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while uploading" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Upload Your Astrophotography</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label htmlFor="file-input" className="block text-sm font-medium mb-2">
                Select Image *
              </label>
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
                required
              />
            </div>

            {preview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-white/20">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-500/20 border border-green-500/50 text-green-200"
                    : "bg-red-500/20 border border-red-500/50 text-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file || !name.trim()}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </form>
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Recent Uploads</h2>
          <RecentUploads />
        </div>
      </div>
    </div>
  );
}

function RecentUploads() {
  const [uploads, setUploads] = useState<Array<{ id: string; name: string; imageUrl: string; uploadedAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/uploads")
      .then((res) => res.json())
      .then((data) => {
        if (data.uploads) {
          setUploads(data.uploads);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  // Expose refresh function to parent (we'll use a different approach)
  useEffect(() => {
    const handleUploadSuccess = () => {
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener("uploadSuccess", handleUploadSuccess);
    return () => window.removeEventListener("uploadSuccess", handleUploadSuccess);
  }, []);

  if (loading) {
    return <p className="text-slate-300">Loading...</p>;
  }

  if (uploads.length === 0) {
    return <p className="text-slate-300">No uploads yet. Be the first to share!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-white/5 rounded-lg overflow-hidden border border-white/10"
        >
          <div className="relative w-full h-48">
            <Image
              src={upload.imageUrl}
              alt={`Upload by ${upload.name}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-3">
            <p className="font-semibold">{upload.name}</p>
            <p className="text-xs text-slate-400">
              {new Date(upload.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

