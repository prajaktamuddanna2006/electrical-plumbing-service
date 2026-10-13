import { useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("plumbing");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState({});
  const [labor, setLabor] = useState({});
  const [parts, setParts] = useState({});
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const token = () => localStorage.getItem("token");

  async function api(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function refresh(role = user?.role) {
    try {
      const r = await api("/service-requests");
      setRequests(Array.isArray(r) ? r : r.requests || []);

            const e = await api("/estimates");
      setEstimates(Array.isArray(e) ? e : e.estimates || []);
      const w = await api("/work-orders");
setWorkOrders(
  Array.isArray(w) ? w : w.workOrders || []
);

      if (role === "admin") {
        const t = await api("/technicians");
        setTechnicians(Array.isArray(t) ? t : t.technicians || []);
      }

      if (role === "technician") {
        const a = await api("/technicians/my-assignments");
        setAssignments(Array.isArray(a) ? a : a.assignments || []);
      }
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function submitAuth(e, register = false) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await api(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          headers: {},
          body: JSON.stringify(
            register
              ? { name, email, phone, password, address, role: "customer" }
              : { email, password }
          ),
        }
      );

      if (register) {
        setMessage("Registration successful. Please login.");
        setPage("login");
        setPassword("");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setPage(
        data.user.role === "admin"
          ? "admin"
          : data.user.role === "technician"
            ? "technician"
            : "customer"
      );
      await refresh(data.user.role);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitService(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api("/service-requests", {
        method: "POST",
        body: JSON.stringify({
          serviceType,
          description,
          address,
        }),
      });

      setDescription("");
      setMessage("Service request submitted successfully!");
      await refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api(`/service-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setMessage("Status updated.");
      await refresh();
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function createEstimate(id) {
    const laborCost = Number(labor[id]);
    const partsCost = Number(parts[id]);

    if (
      labor[id] === undefined ||
      labor[id] === "" ||
      parts[id] === undefined ||
      parts[id] === "" ||
      !Number.isFinite(laborCost) ||
      !Number.isFinite(partsCost) ||
      laborCost < 0 ||
      partsCost < 0
    ) {
      setMessage("Enter valid labor and parts costs.");
      return;
    }

    try {
      const data = await api("/estimates", {
        method: "POST",
        body: JSON.stringify({
          serviceRequest: id,
          inspectionNotes: notes[id] || "",
          laborCost,
          partsCost,
        }),
      });
      setMessage(data.message || "Estimate created successfully.");
    } catch (e) {
      setMessage(e.message);
    }
  }
  
  async function respondToEstimate(id, status) {
    try {
      const data = await api(`/estimates/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(data.message || `Estimate ${status} successfully.`);

      const updatedEstimates = await api("/estimates");
      setEstimates(
        Array.isArray(updatedEstimates)
          ? updatedEstimates
          : updatedEstimates.estimates || []
      );

      const updatedRequests = await api("/service-requests");
      setRequests(
        Array.isArray(updatedRequests)
          ? updatedRequests
          : updatedRequests.requests || []
      );
    } catch (e) {
      setMessage(e.message);
    }
  }


  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setRequests([]);
    setAssignments([]);
    setTechnicians([]);
    setPage("home");
    setMessage("Logged out successfully.");
  }

  function requestCard(r, admin = false) {
    return (
      <article className="history-row" key={r._id}>
        <h3>{r.serviceType} Service</h3>
        <p><b>Description:</b> {r.description}</p>
        <p><b>Customer:</b> {r.customer?.name || "Customer"}</p>
        <p><b>Phone:</b> {r.customer?.phone || "Not available"}</p>
        <p><b>Address:</b> {r.address}</p>
        <p><b>Status:</b> {r.status}</p>
        <p><b>Technician:</b> {r.assignedTechnician?.name || "Not assigned"}</p>

        {admin && (
          <>
            <label>Status</label>
            <select
              value={r.status}
              onChange={(e) => updateStatus(r._id, e.target.value)}
            >
              {["pending", "assigned", "inspection", "approved",
                "in-progress", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}
      </article>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚡ E&P Service</div>
        <nav className="nav">
          <button onClick={() => setPage("home")}>Home</button>
          {!user ? (
            <>
              <button onClick={() => setPage("login")}>Login</button>
              <button onClick={() => setPage("register")}>Register</button>
            </>
          ) : (
            <button onClick={logout}>Logout</button>
          )}
        </nav>
      </header>

      {message && <p className="app-message" role="status">{message}</p>}

      {page === "home" && (
        <main>
          <section className="hero">
            <div className="hero-content">
              <span className="hero-tag">PROFESSIONAL HOME SERVICES</span>
              <h1>Electrical & Plumbing Services at Your Doorstep</h1>
              <p>Book trusted technicians for your home service needs.</p>
              <button
                className="hero-button"
                onClick={() => setPage(user ? "customer" : "register")}
              >
                Get Started
              </button>
            </div>
          </section>

          <section className="services">
            <div className="section-heading">
              <h2>Our Services</h2>
              <p>Reliable home maintenance solutions.</p>
            </div>
            <div className="service-grid">
              <article className="service-card">
                <h3>Electrical Services</h3>
                <p>Wiring, switches, fans and electrical repairs.</p>
              </article>
              <article className="service-card">
                <h3>Plumbing Services</h3>
                <p>Tap repair, pipes and leakage fixing.</p>
              </article>
              <article className="service-card">
                <h3>Home Maintenance</h3>
                <p>Professional service for your home.</p>
              </article>
            </div>
          </section>
        </main>
      )}

      {(page === "login" || page === "register") && (
        <section className="form-page">
          <form
            className="auth-form"
            onSubmit={(e) => submitAuth(e, page === "register")}
          >
            <h1>{page === "login" ? "Login" : "Create Account"}</h1>

            {page === "register" && (
              <>
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
                <label>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <label>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} required />
              </>
            )}

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button disabled={loading}>
              {loading ? "Please wait..." : page === "login" ? "Login" : "Register"}
            </button>
            <button
              type="button"
              onClick={() => setPage(page === "login" ? "register" : "login")}
            >
              {page === "login" ? "Create Account" : "Back to Login"}
            </button>
          </form>
        </section>
      )}

      {page === "customer" && user?.role === "customer" && (
        <main className="customer-dashboard">
          <h1>Customer Dashboard</h1>
          <p>Welcome, {user.name}</p>

          <div className="summary-grid">
            <div className="summary-card">
              <span>My Requests</span>
              <strong>{requests.length}</strong>
            </div>
            <div className="summary-card">
              <span>Active</span>
              <strong>{requests.filter((r) => !["completed", "cancelled"].includes(r.status)).length}</strong>
            </div>
            <div className="summary-card">
              <span>Completed</span>
              <strong>{requests.filter((r) => r.status === "completed").length}</strong>
            </div>
          </div>

          <div className="dashboard-panel">
            <h2>Request Service</h2>
            <form className="request-form" onSubmit={submitService}>
              <label>Service Type</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
              </select>
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
              <label>Service Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} required />
              <button disabled={loading}>Submit Request</button>
            </form>
          </div>

          <div className="dashboard-panel">
            <h2>My Estimates</h2>

            {estimates.filter((est) => {
              const requestId =
                typeof est.serviceRequest === "object"
                  ? est.serviceRequest?._id
                  : est.serviceRequest;

              return requests.some((r) => r._id === requestId);
            }).length === 0 ? (
              <p>No estimates available yet.</p>
            ) : (
              estimates
                .filter((est) => {
                  const requestId =
                    typeof est.serviceRequest === "object"
                      ? est.serviceRequest?._id
                      : est.serviceRequest;

                  return requests.some((r) => r._id === requestId);
                })
                .map((est) => (
                  <article className="history-row" key={est._id}>
                    <h3>Estimate</h3>

                    <p>
                      <b>Inspection:</b> {est.inspectionNotes}
                    </p>

                    <p>
                      <b>Labor Cost:</b> ₹{est.laborCost}
                    </p>

                    <p>
                      <b>Parts Cost:</b> ₹{est.partsCost}
                    </p>

                    <p>
                      <b>Total Cost:</b> ₹{est.totalCost}
                    </p>

                    <p>
                      <b>Status:</b> {est.status}
                    </p>

                    {est.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            respondToEstimate(est._id, "approved")
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            respondToEstimate(est._id, "rejected")
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </article>
                ))
            )}
          </div>

<div className="dashboard-panel">
  <h2>My Work Orders</h2>

  {workOrders.filter((wo) => {
    const requestId =
      typeof wo.serviceRequest === "object"
        ? wo.serviceRequest?._id
        : wo.serviceRequest;

    return requests.some((r) => r._id === requestId);
  }).length === 0 ? (
    <p>No work orders available yet.</p>
  ) : (
    workOrders
      .filter((wo) => {
        const requestId =
          typeof wo.serviceRequest === "object"
            ? wo.serviceRequest?._id
            : wo.serviceRequest;

        return requests.some((r) => r._id === requestId);
      })
      .map((wo) => (
        <article className="history-row" key={wo._id}>
          <h3>Work Order</h3>
          <p><b>Description:</b> {wo.description}</p>
          <p><b>Status:</b> {wo.status}</p>
          <p>
            <b>Scheduled Date:</b>{" "}
            {wo.scheduledDate
              ? new Date(wo.scheduledDate).toLocaleDateString()
              : "Not scheduled"}
          </p>
          <p>
            <b>Completion Notes:</b>{" "}
            {wo.completionNotes || "No notes yet"}
          </p>
        </article>
      ))
  )}
</div>

          <div className="dashboard-panel">
            <h2>My Service History</h2>
            {requests.length ? requests.map((r) => requestCard(r)) : <p>No requests yet.</p>}
          </div>
        </main>
      )}

      {page === "admin" && user?.role === "admin" && (
        <main className="customer-dashboard">
          <h1>Admin Dashboard</h1>
          <div className="summary-grid">
            <div className="summary-card"><span>Total Requests</span><strong>{requests.length}</strong></div>
            <div className="summary-card"><span>Pending</span><strong>{requests.filter((r) => r.status === "pending").length}</strong></div>
            <div className="summary-card"><span>Technicians</span><strong>{technicians.length}</strong></div>
          </div>
          <button onClick={() => refresh("admin")}>Refresh Dashboard</button>
          <h2>Service Requests</h2>
          {requests.map((r) => requestCard(r, true))}
          <h2>Technicians</h2>
          {technicians.map((t) => (
            <article className="history-row" key={t._id}>
              <p><b>Name:</b> {t.user?.name || t.name || "Technician"}</p>
              <p><b>Email:</b> {t.user?.email || t.email || "Not available"}</p>
              <p><b>Skills:</b> {t.skills?.join?.(", ") || "Not specified"}</p>
            </article>
          ))}
        </main>
      )}

      {page === "technician" && user?.role === "technician" && (
        <main className="customer-dashboard">
          <h1>Technician Dashboard</h1>
          <p>Welcome, {user.name}</p>
          <div className="summary-grid">
            <div className="summary-card"><span>Assigned Jobs</span><strong>{assignments.length}</strong></div>
            <div className="summary-card"><span>Completed</span><strong>{assignments.filter((a) => a.serviceRequest?.status === "completed" || a.status === "completed").length}</strong></div>
          </div>
          <button onClick={() => refresh("technician")}>Refresh Jobs</button>

          {assignments.map((a) => {
            const r = typeof a.serviceRequest === "object" ? a.serviceRequest : null;
            if (!r) return <article className="history-row" key={a._id}>Job details unavailable.</article>;

            return (
              <article className="history-row" key={a._id}>
                <h3>{r.serviceType} Job</h3>
                <p><b>Customer:</b> {r.customer?.name || "Customer"}</p>
                <p><b>Phone:</b> {r.customer?.phone || "Not available"}</p>
                <p><b>Description:</b> {r.description}</p>
                <p><b>Address:</b> {r.address}</p>
                <p><b>Status:</b> {r.status}</p>

                <label>Update Status</label>
                <select value={r.status} onChange={(e) => updateStatus(r._id, e.target.value)}>
                  {["assigned", "inspection", "approved", "in-progress", "completed"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <h3>Inspection & Estimate</h3>
                <label>Inspection Notes</label>
                <textarea
                  rows="3"
                  value={notes[r._id] || ""}
                  onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                  placeholder="Enter inspection notes"
                />
                <label>Labor Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={labor[r._id] ?? ""}
                  onChange={(e) => setLabor({ ...labor, [r._id]: e.target.value })}
                />
                <label>Parts Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={parts[r._id] ?? ""}
                  onChange={(e) => setParts({ ...parts, [r._id]: e.target.value })}
                />
                <p><b>Total Estimate: ₹{(Number(labor[r._id] || 0) + Number(parts[r._id] || 0)).toFixed(2)}</b></p>
                
<button
  type="button"
  onClick={() => {
    alert("Create Estimate button clicked!");
    createEstimate(r._id);
  }}
>
  Create Estimate
</button>
<button
  type="button"
  onClick={async () => {
    try {
      const approvedEstimate = estimates.find((est) => {
        const requestId =
          typeof est.serviceRequest === "object"
            ? est.serviceRequest?._id
            : est.serviceRequest;

        return requestId === r._id && est.status === "approved";
      });

      if (!approvedEstimate) {
        setMessage("No approved estimate found for this job.");
        return;
      }
      console.log(
  "ALL ESTIMATES:",
  estimates.map((est) => ({
    id: est._id,
    serviceRequest: est.serviceRequest,
    status: est.status,
  }))
);
console.log("CURRENT JOB ID:", r._id);

      const result = await api("/work-orders", {
        method: "POST",
        body: JSON.stringify({
          estimateId: approvedEstimate._id,
        }),
      });

      setMessage(result.message || "Work Order created successfully.");

      const w = await api("/work-orders");
      setWorkOrders(
        Array.isArray(w) ? w : w.workOrders || []
      );
    } catch (e) {
      setMessage(e.message);
    }
  }}
>
  Create Work Order
</button>
              </article>
            );
          })}
        </main>
      )}
    </div>
  );
}  

