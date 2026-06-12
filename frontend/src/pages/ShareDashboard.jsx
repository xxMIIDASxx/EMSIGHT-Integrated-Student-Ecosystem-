import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Flag, Bookmark, Trash2, Upload, BadgeCheck } from "lucide-react";
import api from "../api";

const RESOURCE_TYPES = [
  { value: "course", label: "Course" },
  { value: "exercise_without_solution", label: "Exercise without solution" },
  { value: "exercise_with_solution", label: "Exercise with solution" },
];

function ShareDashboard({ activeTab, demoUser }) {
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [reportReason, setReportReason] = useState({});

  const [form, setForm] = useState({
    title: "",
    subject: "",
    description: "",
    resource_type: "course",
    file: null,
  });

  const fetchResources = (onlyReported = false) => {
    const params = new URLSearchParams();
    params.append("user_id", demoUser.id);
    if (query.trim()) params.append("q", query.trim());
    if (resourceTypeFilter) params.append("resource_type", resourceTypeFilter);
    if (onlyReported) params.append("only_reported", "true");
    api.get(`/share/resources/?${params.toString()}`).then((res) => setResources(res.data));
  };

  useEffect(() => {
    if (!demoUser) return;
    fetchResources(activeTab === "reported");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, demoUser, query, resourceTypeFilter]);

  const visibleResources = useMemo(() => {
    if (activeTab === "myresources") {
      return resources.filter((r) => r.author === demoUser.id);
    }
    if (activeTab === "favorites") {
      return resources.filter((r) => r.is_favorited);
    }
    return resources;
  }, [activeTab, resources, demoUser.id]);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!form.file) {
      window.alert("Please select a PDF or DOC file.");
      return;
    }
    const formData = new FormData();
    formData.append("user_id", demoUser.id);
    formData.append("title", form.title);
    formData.append("subject", form.subject);
    formData.append("description", form.description);
    formData.append("resource_type", form.resource_type);
    formData.append("file", form.file);
    api.post("/share/resources/", formData, { headers: { "Content-Type": "multipart/form-data" } }).then(() => {
      window.alert("Resource shared successfully!");
      setForm({ title: "", subject: "", description: "", resource_type: "course", file: null });
      fetchResources(activeTab === "reported");
    }).catch(err => {
      console.error(err);
      window.alert("Failed to share resource: " + JSON.stringify(err.response?.data || err.message));
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer cette ressource ?")) return;
    api.delete(`/share/resources/${id}/?user_id=${demoUser.id}`).then(() => fetchResources(activeTab === "reported"));
  };

  const handleFavorite = (id) => {
    api.post(`/share/resources/${id}/toggle_favorite/`, { user_id: demoUser.id }).then(() => fetchResources(activeTab === "reported"));
  };

  const handleValidate = (id) => {
    api.post(`/share/resources/${id}/validate_resource/`, { user_id: demoUser.id }).then(() => fetchResources(activeTab === "reported"));
  };

  const handleReport = (id) => {
    const reason = (reportReason[id] || "").trim();
    if (!reason) {
      window.alert("Veuillez saisir une raison de signalement.");
      return;
    }
    api.post(`/share/resources/${id}/report_resource/`, { user_id: demoUser.id, reason }).then(() => {
      setReportReason((prev) => ({ ...prev, [id]: "" }));
      fetchResources(activeTab === "reported");
    }).catch((err) => {
      window.alert(err?.response?.data?.error || "Signalement impossible.");
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {demoUser.role !== "admin" && activeTab === "myresources" && (
        <div className="glass-panel">
          <h2 style={{ marginBottom: "1rem" }}>Share a resource</h2>
          <form onSubmit={handleUpload}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input className="input-field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Subject (e.g. C++)</label>
                <input className="input-field" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input-field" value={form.resource_type} onChange={(e) => setForm({ ...form, resource_type: e.target.value })}>
                  {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">File (PDF or DOC)</label>
                <input className="input-field" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} required />
              </div>
              <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                <label className="input-label">Description (optional)</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Upload size={16} /> Share
            </button>
          </form>
        </div>
      )}

      <div className="glass-panel">
        <h2 style={{ marginBottom: "1rem" }}>
          {activeTab === "browse" && "Browse - Shared resources"}
          {activeTab === "myresources" && "My Resources"}
          {activeTab === "favorites" && "My List"}
          {activeTab === "reported" && "Reported Resources"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <input className="input-field" placeholder="Search resources..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input-field" value={resourceTypeFilter} onChange={(e) => setResourceTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {visibleResources.map((r) => (
            <div key={r.id} style={{ border: "1px solid var(--border)", background: "var(--background)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <h3 style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <FileText size={18} /> {r.title}
                    {r.validators_detail?.length > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: 600, background: '#dbeafe', padding: '0.25rem 0.5rem', borderRadius: '20px' }}>
                        <BadgeCheck size={16} fill="#1d4ed8" color="white" />
                        (verified by: {r.validators_detail.map(v => `${v.first_name} ${v.last_name}`).join(', ')})
                      </span>
                    )}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Subject: <strong>{r.subject}</strong> · Type: {RESOURCE_TYPES.find((t) => t.value === r.resource_type)?.label || r.resource_type}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    By {r.author_detail?.first_name} {r.author_detail?.last_name} ({r.author_detail?.role}) · Reports: {r.report_count}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "170px" }}>
                  <a className="btn btn-secondary" href={r.file.startsWith("http") ? r.file : `http://127.0.0.1:8000${r.file}`} target="_blank" rel="noreferrer">Read</a>
                  <button className="btn btn-secondary" onClick={() => handleFavorite(r.id)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Bookmark size={14} /> {r.is_favorited ? "Remove from list" : "Add to list"}
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  className="input-field"
                  style={{ maxWidth: "300px" }}
                  placeholder="Report reason..."
                  value={reportReason[r.id] || ""}
                  onChange={(e) => setReportReason((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  disabled={r.is_reported_by_user}
                />
                <button
                  className="btn btn-danger"
                  onClick={() => handleReport(r.id)}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                  disabled={r.is_reported_by_user}
                >
                  <Flag size={14} /> {r.is_reported_by_user ? "Already reported" : "Report"}
                </button>
                {demoUser.role === "teacher" && (
                  <button className={r.validators_detail?.some(v => v.id === demoUser.id) ? "btn btn-secondary" : "btn btn-success"} onClick={() => handleValidate(r.id)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <CheckCircle2 size={14} /> {r.validators_detail?.some(v => v.id === demoUser.id) ? "Devalidate" : "Validate"}
                  </button>
                )}
                {(demoUser.role === "admin" || r.author === demoUser.id) && (
                  <button className="btn btn-danger" onClick={() => handleDelete(r.id)} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {visibleResources.length === 0 && (
            <p style={{ color: "var(--text-muted)" }}>
              {activeTab === "favorites"
                ? "Your list is empty. Add resources from Browse."
                : activeTab === "myresources"
                  ? "You have not shared resources yet."
                  : "No resources available."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareDashboard;
