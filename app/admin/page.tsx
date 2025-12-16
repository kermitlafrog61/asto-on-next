"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Upload {
  id: string;
  name: string;
  imageUrl: string;
  uploadedAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  maxParticipants?: number;
}

interface Registration {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  phone: string;
  registeredAt: string;
}

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
}

interface MerchandiseApplication {
  id: string;
  itemId: string;
  itemName: string;
  name: string;
  phone: string;
  appliedAt: string;
}

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"uploads" | "events" | "registrations" | "merchandise" | "merchandise-applications">("uploads");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [merchandiseApplications, setMerchandiseApplications] = useState<MerchandiseApplication[]>([]);
  const [selectedUploads, setSelectedUploads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [addNamesToDownload, setAddNamesToDownload] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (auth === "true") {
      setAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAuthenticated(true);
        localStorage.setItem("admin_auth", "true");
        loadData();
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem("admin_auth");
    setSelectedUploads(new Set());
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [uploadsRes, eventsRes, registrationsRes, merchRes, merchAppsRes] = await Promise.all([
        fetch("/api/uploads"),
        fetch("/api/events"),
        fetch("/api/registrations"),
        fetch("/api/merchandise"),
        fetch("/api/merchandise/applications"),
      ]);

      const uploadsData = await uploadsRes.json();
      const eventsData = await eventsRes.json();
      const registrationsData = await registrationsRes.json();
      const merchData = await merchRes.json();
      const merchAppsData = await merchAppsRes.json();

      if (uploadsData.uploads) setUploads(uploadsData.uploads);
      if (eventsData.events) setEvents(eventsData.events);
      if (registrationsData.registrations) setRegistrations(registrationsData.registrations);
      if (merchData.items) setMerchandise(merchData.items);
      if (merchAppsData.applications) setMerchandiseApplications(merchAppsData.applications);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUploadSelection = (id: string) => {
    const newSelected = new Set(selectedUploads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUploads(newSelected);
  };

  const selectAllUploads = () => {
    if (selectedUploads.size === uploads.length) {
      setSelectedUploads(new Set());
    } else {
      setSelectedUploads(new Set(uploads.map((u) => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUploads.size === 0) return;
    if (!confirm(`Delete ${selectedUploads.size} selected upload(s)?`)) return;

    try {
      const response = await fetch("/api/uploads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: Array.from(selectedUploads) }),
      });

      if (response.ok) {
        setUploads(uploads.filter((u) => !selectedUploads.has(u.id)));
        setSelectedUploads(new Set());
      }
    } catch (error) {
      console.error("Failed to delete uploads:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL uploads? This cannot be undone!")) return;

    try {
      const response = await fetch("/api/uploads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadIds: uploads.map((u) => u.id) }),
      });

      if (response.ok) {
        setUploads([]);
        setSelectedUploads(new Set());
      }
    } catch (error) {
      console.error("Failed to delete all uploads:", error);
    }
  };

  const handleDownload = async (downloadAll = false) => {
    const uploadIds = downloadAll ? [] : Array.from(selectedUploads);
    if (!downloadAll && uploadIds.length === 0) {
      alert("Please select uploads to download");
      return;
    }

    try {
      const response = await fetch("/api/uploads/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadIds,
          addNames: addNamesToDownload,
          downloadAll,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadAll ? "all_uploads.zip" : "selected_uploads.zip";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed");
    }
  };

  const handleDeleteUpload = async (id: string) => {
    if (!confirm("Are you sure you want to delete this upload?")) return;

    try {
      const response = await fetch(`/api/uploads/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUploads(uploads.filter((u) => u.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete upload:", error);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold">Admin Panel</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab("uploads")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "uploads"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Uploads ({uploads.length})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "events"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("registrations")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "registrations"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Registrations ({registrations.length})
          </button>
          <button
            onClick={() => setActiveTab("merchandise")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "merchandise"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Merchandise ({merchandise.length})
          </button>
          <button
            onClick={() => setActiveTab("merchandise-applications")}
            className={`px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
              activeTab === "merchandise-applications"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Merch Applications ({merchandiseApplications.length})
          </button>
        </div>

        {loading ? (
          <p className="text-center text-xl">Loading...</p>
        ) : (
          <>
            {/* Uploads Tab */}
            {activeTab === "uploads" && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">All Uploads</h2>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addNamesToDownload}
                        onChange={(e) => setAddNamesToDownload(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Add names to images</span>
                    </label>
                  </div>
                </div>

                {uploads.length === 0 ? (
                  <p className="text-slate-300">No uploads yet.</p>
                ) : (
                  <>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <button
                        onClick={selectAllUploads}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
                      >
                        {selectedUploads.size === uploads.length ? "Deselect All" : "Select All"}
                      </button>
                      <button
                        onClick={() => handleDownload(false)}
                        disabled={selectedUploads.size === 0}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-semibold"
                      >
                        Download Selected ({selectedUploads.size})
                      </button>
                      <button
                        onClick={() => handleDownload(true)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
                      >
                        Download All
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={selectedUploads.size === 0}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm font-semibold"
                      >
                        Delete Selected ({selectedUploads.size})
                      </button>
                      <button
                        onClick={handleDeleteAll}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg text-sm font-semibold"
                      >
                        Delete All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {uploads.map((upload) => (
                        <div
                          key={upload.id}
                          className={`bg-white/5 rounded-lg overflow-hidden border ${
                            selectedUploads.has(upload.id)
                              ? "border-blue-500"
                              : "border-white/10"
                          }`}
                        >
                          <div className="relative w-full h-48">
                            <Image
                              src={upload.imageUrl}
                              alt={`Upload by ${upload.name}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 left-2">
                              <input
                                type="checkbox"
                                checked={selectedUploads.has(upload.id)}
                                onChange={() => toggleUploadSelection(upload.id)}
                                className="w-5 h-5 cursor-pointer"
                              />
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="font-semibold mb-1">Uploaded by: {upload.name}</p>
                            <p className="text-xs text-slate-400 mb-3">
                              {new Date(upload.uploadedAt).toLocaleString()}
                            </p>
                            <button
                              onClick={() => handleDeleteUpload(upload.id)}
                              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === "events" && (
              <EventsTab
                events={events}
                registrations={registrations}
                onUpdate={loadData}
              />
            )}

            {/* Registrations Tab */}
            {activeTab === "registrations" && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">All Registrations</h2>
                {registrations.length === 0 ? (
                  <p className="text-slate-300">No registrations yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4">Event</th>
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">WhatsApp Phone</th>
                          <th className="text-left py-3 px-4">Registered At</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((registration) => (
                          <tr
                            key={registration.id}
                            className="border-b border-white/10 hover:bg-white/5"
                          >
                            <td className="py-3 px-4">{registration.eventTitle}</td>
                            <td className="py-3 px-4">{registration.name}</td>
                            <td className="py-3 px-4">{registration.phone}</td>
                            <td className="py-3 px-4">
                              {new Date(registration.registeredAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={async () => {
                                  if (!confirm("Delete this registration?")) return;
                                  try {
                                    const response = await fetch(`/api/registrations/${registration.id}`, {
                                      method: "DELETE",
                                    });
                                    if (response.ok) {
                                      loadData();
                                    }
                                  } catch (error) {
                                    console.error("Failed to delete registration:", error);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Merchandise Tab */}
            {activeTab === "merchandise" && (
              <MerchandiseTab
                merchandise={merchandise}
                onUpdate={loadData}
              />
            )}

            {/* Merchandise Applications Tab */}
            {activeTab === "merchandise-applications" && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Merchandise Applications</h2>
                {merchandiseApplications.length === 0 ? (
                  <p className="text-slate-300">No applications yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4">Item</th>
                          <th className="text-left py-3 px-4">Name</th>
                          <th className="text-left py-3 px-4">WhatsApp Phone</th>
                          <th className="text-left py-3 px-4">Applied At</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {merchandiseApplications.map((application) => (
                          <tr
                            key={application.id}
                            className="border-b border-white/10 hover:bg-white/5"
                          >
                            <td className="py-3 px-4">{application.itemName}</td>
                            <td className="py-3 px-4">{application.name}</td>
                            <td className="py-3 px-4">{application.phone}</td>
                            <td className="py-3 px-4">
                              {new Date(application.appliedAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={async () => {
                                  if (!confirm("Delete this application?")) return;
                                  try {
                                    const response = await fetch(`/api/merchandise/applications/${application.id}`, {
                                      method: "DELETE",
                                    });
                                    if (response.ok) {
                                      loadData();
                                    }
                                  } catch (error) {
                                    console.error("Failed to delete application:", error);
                                  }
                                }}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EventsTab({
  events,
  registrations,
  onUpdate,
}: {
  events: Event[];
  registrations: Registration[];
  onUpdate: () => void;
}) {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    maxParticipants: "",
  });

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    const date = new Date(event.date);
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({
      title: event.title,
      description: event.description,
      date: localDateTime,
      location: event.location,
      maxParticipants: event.maxParticipants?.toString() || "",
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      date: "",
      location: "",
      maxParticipants: "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/events";
      const method = editingEvent ? "PUT" : "POST";
      const dateISO = new Date(formData.date).toISOString();
      const body = editingEvent
        ? { ...formData, id: editingEvent.id, date: dateISO }
        : { ...formData, date: dateISO };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      const response = await fetch(`/api/events?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleExportExcel = async (eventId: string) => {
    try {
      const response = await fetch(`/api/registrations/export?eventId=${eventId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `registrations_${eventId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export registrations");
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">All Events</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <p className="text-slate-300">No events created yet.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const eventRegistrations = registrations.filter(
              (r) => r.eventId === event.id
            );
            return (
              <div
                key={event.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-slate-300 mb-2">{event.description}</p>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>Date: {new Date(event.date).toLocaleDateString()}</p>
                      <p>Location: {event.location}</p>
                      <p>
                        Registrations: {eventRegistrations.length}
                        {event.maxParticipants && ` / ${event.maxParticipants}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 flex-wrap">
                    {eventRegistrations.length > 0 && (
                      <button
                        onClick={() => handleExportExcel(event.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        title="Export to Excel"
                      >
                        📊 Export Excel
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingEvent ? "Edit Event" : "Create Event"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Participants (optional)
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({ ...formData, maxParticipants: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  min="1"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchandiseTab({
  merchandise,
  onUpdate,
}: {
  merchandise: MerchandiseItem[];
  onUpdate: () => void;
}) {
  const [editingItem, setEditingItem] = useState<MerchandiseItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    imageUrls: [] as string[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleEdit = (item: MerchandiseItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl || "",
      imageUrls: item.imageUrls || (item.imageUrl ? [item.imageUrl] : []),
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      imageUrls: [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("image", file);
        formData.append("itemId", editingItem?.id || "new");

        const response = await fetch("/api/merchandise/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          uploadedUrls.push(data.imageUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData({
          ...formData,
          imageUrls: [...formData.imageUrls, ...uploadedUrls],
          imageUrl: uploadedUrls[0], // Keep first as main image for backward compatibility
        });
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingImages(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImageUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      imageUrls: newImageUrls,
      imageUrl: newImageUrls[0] || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/merchandise";
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem
        ? { ...formData, id: editingItem.id, imageUrls: formData.imageUrls }
        : { ...formData, imageUrls: formData.imageUrls };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to save merchandise:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const response = await fetch(`/api/merchandise?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Merchandise</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
        >
          Add Item
        </button>
      </div>

      {merchandise.length === 0 ? (
        <p className="text-slate-300">No merchandise items yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {merchandise.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 rounded-lg overflow-hidden border border-white/10"
            >
              <div className="relative w-full h-48">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <p className="text-slate-300 mb-4">{item.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/20 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? "Edit Item" : "Add Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Images *</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white"
                />
                {uploadingImages && <p className="text-sm text-slate-400 mt-2">Uploading...</p>}
                {formData.imageUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-32">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="Or enter image URL (will be added to images)"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white mt-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && formData.imageUrl.trim()) {
                      e.preventDefault();
                      setFormData({
                        ...formData,
                        imageUrls: [...formData.imageUrls, formData.imageUrl.trim()],
                        imageUrl: "",
                      });
                    }
                  }}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Upload multiple images or enter URLs (press Enter to add URL)
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
