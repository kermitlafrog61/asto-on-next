"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  maxParticipants?: number;
}

interface Registration {
  eventId: string;
  name: string;
  phone: string;
  registeredAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
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

    if (!selectedEvent) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Successfully registered for the event!" });
        setFormData({ name: "", phone: "" });
        setTimeout(() => {
          setShowForm(false);
          setSelectedEvent(null);
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to register" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while registering" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <p className="text-xl">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>

        {events.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center">
            <p className="text-xl text-slate-300">No events scheduled yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all"
              >
                <h2 className="text-2xl font-bold mb-3">{event.title}</h2>
                <p className="text-slate-300 mb-4">{event.description}</p>
                <div className="space-y-2 mb-4 text-sm">
                  <p className="flex items-center gap-2">
                    <span>📅</span>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>📍</span>
                    {event.location}
                  </p>
                  {event.maxParticipants && (
                    <p className="flex items-center gap-2">
                      <span>👥</span>
                      Max {event.maxParticipants} participants
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRegister(event)}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Register Now
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Registration Modal */}
        {showForm && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-white/20 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Register for {selectedEvent.title}</h2>
              
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
                      setSelectedEvent(null);
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
                    {submitting ? "Registering..." : "Register"}
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

