"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
}

export default function MerchandisePage() {
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MerchandiseItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [galleryItem, setGalleryItem] = useState<MerchandiseItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetch("/api/merchandise")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Keyboard navigation for gallery
  useEffect(() => {
    if (!galleryItem) return;

    const galleryImages = galleryItem.imageUrls && galleryItem.imageUrls.length > 0 
      ? galleryItem.imageUrls 
      : [galleryItem.imageUrl];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentImageIndex((prev) => 
          prev === 0 ? galleryImages.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight") {
        setCurrentImageIndex((prev) => 
          prev === galleryImages.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "Escape") {
        setGalleryItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryItem, currentImageIndex]);

  const handleApply = (item: MerchandiseItem) => {
    setSelectedItem(item);
    setShowForm(true);
    setFormData({ name: "", phone: "" });
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (!selectedItem) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/merchandise/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Thank you! We'll notify you when this merchandise becomes available." });
        setFormData({ name: "", phone: "" });
        setTimeout(() => {
          setShowForm(false);
          setSelectedItem(null);
        }, 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to submit application" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">AstroClub Merchandise</h1>
        <p className="text-xl text-slate-300 mb-8">
          Check out our upcoming merchandise! Apply to be notified when items become available.
        </p>

        {loading ? (
          <p className="text-center text-xl">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center">
            <p className="text-xl text-slate-300">No merchandise available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {items.map((item) => {
              const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl];
              return (
                <div
                  key={item.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden hover:bg-white/15 transition-all w-full"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div 
                      className="relative w-full h-[500px] md:h-[600px] cursor-pointer"
                      onClick={() => {
                        setGalleryItem(item);
                        setCurrentImageIndex(0);
                      }}
                    >
                      {images.length > 1 ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={images[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-sm font-semibold">
                            {images.length} photos - Click to view
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="opacity-0 hover:opacity-100 text-white text-lg font-semibold">Click to view</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <h2 className="text-4xl md:text-5xl font-bold mb-4">{item.name}</h2>
                      <p className="text-slate-300 mb-8 text-xl">{item.description}</p>
                      <button
                        onClick={() => handleApply(item)}
                        className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-xl transition-colors"
                      >
                        Notify Me When Available
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Image Gallery Modal */}
        {galleryItem && (() => {
          const galleryImages = galleryItem.imageUrls && galleryItem.imageUrls.length > 0 
            ? galleryItem.imageUrls 
            : [galleryItem.imageUrl];
          
          return (
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setGalleryItem(null)}
            >
              <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col">
                {/* Close button */}
                <button
                  onClick={() => setGalleryItem(null)}
                  className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
                >
                  ×
                </button>

                {/* Main image */}
                <div className="relative w-full flex-1 min-h-[60vh] mb-4">
                  <Image
                    src={galleryImages[currentImageIndex]}
                    alt={`${galleryItem.name} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                  />
                  
                  {/* Navigation arrows */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => 
                            prev === 0 ? galleryImages.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-colors"
                      >
                        ‹
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => 
                            prev === galleryImages.length - 1 ? 0 : prev + 1
                          );
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl transition-colors"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Image counter */}
                {galleryImages.length > 1 && (
                  <div className="text-center text-white mb-4">
                    <span className="text-lg">
                      {currentImageIndex + 1} / {galleryImages.length}
                    </span>
                  </div>
                )}

                {/* Thumbnails */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 justify-center overflow-x-auto pb-4">
                    {galleryImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(index);
                        }}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-blue-500 scale-110"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Item info */}
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">{galleryItem.name}</h3>
                  <p className="text-slate-300">{galleryItem.description}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Application Modal */}
        {showForm && selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-white/20 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Get Notified: {selectedItem.name}</h2>
              <p className="text-slate-300 mb-6">
                We'll notify you via WhatsApp when this merchandise becomes available!
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7XXXXXXXXXX"
                    required
                  />
                </div>

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

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedItem(null);
                      setMessage(null);
                    }}
                    className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-700 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
