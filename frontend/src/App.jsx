import { useState } from "react";
import "./App.css";

const API = "/api";

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
  const [invoices, setInvoices] = useState([]);

  const [assignmentTechnicians, setAssignmentTechnicians] = useState({});
  const [assignmentDates, setAssignmentDates] = useState({});
  const [assignmentPriorities, setAssignmentPriorities] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});

  const [technicianName, setTechnicianName] = useState("");
  const [technicianEmail, setTechnicianEmail] = useState("");
  const [technicianPhone, setTechnicianPhone] = useState("");
  const [technicianPassword, setTechnicianPassword] = useState("");
  const [technicianSkills, setTechnicianSkills] = useState("Plumbing, Pipe Repair");
  const [technicianServiceArea, setTechnicianServiceArea] = useState("");
  const [technicianExperience, setTechnicianExperience] = useState("0");
  const [technicianLoading, setTechnicianLoading] = useState(false);

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

  function getRequestId(item) {
    const request = item?.serviceRequest;

    if (request && typeof request === "object") {
      return request._id ? String(request._id) : "";
    }

    return request ? String(request) : "";
  }

  function getUniqueAssignments(items) {
    const seen = new Set();

    return items.filter((assignment) => {
      const id = getRequestId(assignment) || String(assignment._id);

      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  async function refresh(role = user?.role) {
    try {
      const r = await api("/service-requests");
      setRequests(Array.isArray(r) ? r : r.requests || []);

      const e = await api("/estimates");
      setEstimates(Array.isArray(e) ? e : e.estimates || []);

      const w = await api("/work-orders");
      setWorkOrders(Array.isArray(w) ? w : w.workOrders || []);

      const inv = await api("/invoices");
      setInvoices(Array.isArray(inv) ? inv : inv.invoices || []);

      if (role === "admin") {
        const t = await api("/technicians");
        setTechnicians(Array.isArray(t) ? t : t.technicians || []);
      }

      if (role === "technician") {
        const a = await api("/technicians/my-assignments");
        const loaded = Array.isArray(a) ? a : a.assignments || [];
        setAssignments(getUniqueAssignments(loaded));
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

      const nextPage =
        data.user.role === "admin"
          ? "admin"
          : data.user.role === "technician"
            ? "technician"
            : "customer";

      setPage(nextPage);
      await refresh(data.user.role);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitService(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await api("/service-requests", {
        method: "POST",
        body: JSON.stringify({ serviceType, description, address }),
      });

      setDescription("");
      setMessage("Service request submitted successfully.");
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

      const w = await api("/work-orders");
      const loaded = Array.isArray(w) ? w : w.workOrders || [];
      setWorkOrders(loaded);

      const related = loaded.find((wo) => getRequestId(wo) === String(id));

      const statusMap = {
        "in-progress": "in-progress",
        completed: "completed",
        cancelled: "cancelled",
      };

      const newStatus = statusMap[status];

      if (related && newStatus && related.status !== newStatus) {
        await api(`/work-orders/${related._id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        });
      }

      setMessage("Service Request status updated.");
      await refresh(user?.role);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function createTechnician(e) {
    e.preventDefault();
    setTechnicianLoading(true);
    setMessage("");

    try {
      const result = await api("/technicians", {
        method: "POST",
        body: JSON.stringify({
          name: technicianName.trim(),
          email: technicianEmail.trim(),
          phone: technicianPhone.trim(),
          password: technicianPassword,
          skills: technicianSkills.split(",").map((skill) => skill.trim()).filter(Boolean),
          serviceArea: technicianServiceArea.trim(),
          experience: Number(technicianExperience),
          availability: "available",
        }),
      });

      setMessage(result.message || "Technician created successfully.");
      setTechnicianName("");
      setTechnicianEmail("");
      setTechnicianPhone("");
      setTechnicianPassword("");
      setTechnicianSkills("Plumbing, Pipe Repair");
      setTechnicianServiceArea("");
      setTechnicianExperience("0");
      await refresh("admin");
    } catch (e) {
      setMessage(e.message || "Failed to create technician.");
    } finally {
      setTechnicianLoading(false);
    }
  }
  async function assignTechnician(requestId, technicianId, scheduledDate, priority) {
    if (!technicianId) {
      setMessage("Please select a technician.");
      return;
    }

    if (!scheduledDate) {
      setMessage("Please select a scheduled date.");
      return;
    }

    const selectedDate = new Date(`${scheduledDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setMessage("Please select today or a future date.");
      return;
    }

    try {
      const data = await api("/assignments", {
        method: "POST",
        body: JSON.stringify({
          serviceRequest: requestId,
          technician: technicianId,
          scheduledDate,
          priority: priority || "medium",
        }),
      });

      setMessage(data.message || "Technician assigned successfully.");
      await refresh("admin");
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function createEstimate(id) {
    const laborCost = Number(labor[id]);
    const partsCost = Number(parts[id]);
    const inspectionNotes = (notes[id] || "").trim();

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

    if (!inspectionNotes) {
      setMessage("Please enter inspection notes.");
      return;
    }

    if (estimates.some((est) => getRequestId(est) === String(id))) {
      setMessage("An estimate already exists for this request.");
      return;
    }

    try {
      const result = await api("/estimates", {
        method: "POST",
        body: JSON.stringify({
          serviceRequest: id,
          inspectionNotes,
          laborCost,
          partsCost,
        }),
      });

      setMessage(result.message || "Estimate created successfully.");
      await refresh(user?.role);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function respondToEstimate(id, status) {
    try {
      const result = await api(`/estimates/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(result.message || `Estimate ${status} successfully.`);
      await refresh(user?.role);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function createWorkOrder(requestId) {
    try {
      const estimate = estimates.find(
        (est) =>
          getRequestId(est) === String(requestId) &&
          est.status === "approved"
      );

      if (!estimate) {
        setMessage("No approved estimate found for this job.");
        return;
      }

      const result = await api("/work-orders", {
        method: "POST",
        body: JSON.stringify({ estimateId: estimate._id }),
      });

      setMessage(result.message || "Work Order created successfully.");
      await refresh(user?.role);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function createInvoice(workOrderId) {
    try {
      const result = await api("/invoices", {
        method: "POST",
        body: JSON.stringify({ workOrderId }),
      });

      setMessage(result.message || "Invoice created successfully.");
      await refresh(user?.role);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function recordPayment(invoiceId) {
    const paymentMethod = paymentMethods[invoiceId] || "upi";

    try {
      const result = await api(`/invoices/${invoiceId}/pay`, {
        method: "POST",
        body: JSON.stringify({ paymentMethod }),
      });

      setMessage(result.message || "Payment recorded successfully.");
      await refresh(user?.role);
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
    setEstimates([]);
    setWorkOrders([]);
    setInvoices([]);
    setNotes({});
    setLabor({});
    setParts({});
    setAssignmentTechnicians({});
    setAssignmentDates({});
    setAssignmentPriorities({});
    setPaymentMethods({});
    setPage("home");
    setMessage("Logged out successfully.");
  }

  function requestCard(r, admin = false) {
    const assignedId =
      typeof r.assignedTechnician === "object"
        ? r.assignedTechnician?._id
        : r.assignedTechnician;

    const isAssigned = Boolean(assignedId);
    const isClosed = ["completed", "cancelled"].includes(r.status);

    return (
      <article className="history-row" key={r._id}>
        <h3>{r.serviceType} Service</h3>
        <p><b>Description:</b> {r.description}</p>
        <p><b>Customer:</b> {r.customer?.name || "Customer"}</p>
        <p><b>Phone:</b> {r.customer?.phone || "Not available"}</p>
        <p><b>Address:</b> {r.address}</p>
        <p><b>Status:</b> {r.status}</p>
        <p>
          <b>Technician:</b>{" "}
          {typeof r.assignedTechnician === "object"
            ? r.assignedTechnician?.name || "Not assigned"
            : isAssigned
              ? technicians.find(
                  (t) => String(t.user?._id) === String(assignedId)
                )?.user?.name || "Assigned technician"
              : "Not assigned"}
        </p>

        {admin && (
          <>
            <label>Status</label>
            <select
              value={r.status}
              onChange={(e) => updateStatus(r._id, e.target.value)}
            >
              {[
                "pending",
                "assigned",
                "inspection",
                "approved",
                "in-progress",
                "completed",
                "cancelled",
              ].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <h3>Assign Technician</h3>

            {isAssigned ? (
              <p>This request already has a technician assigned.</p>
            ) : isClosed ? (
              <p>Assignment is unavailable for a {r.status} request.</p>
            ) : (
              <>
                <label>Select Technician</label>
                <select
                  value={assignmentTechnicians[r._id] || ""}
                  onChange={(e) =>
                    setAssignmentTechnicians({
                      ...assignmentTechnicians,
                      [r._id]: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select Technician --</option>
                  {technicians
                    .filter((t) => t.user?._id && t.availability === "available")
                    .map((t) => (
                      <option key={t._id} value={t.user._id}>
                        {t.user?.name || "Technician"} - {t.user?.email || ""}
                      </option>
                    ))}
                </select>

                <label>Scheduled Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={assignmentDates[r._id] || ""}
                  onChange={(e) =>
                    setAssignmentDates({
                      ...assignmentDates,
                      [r._id]: e.target.value,
                    })
                  }
                />

                <label>Priority</label>
                <select
                  value={assignmentPriorities[r._id] || "medium"}
                  onChange={(e) =>
                    setAssignmentPriorities({
                      ...assignmentPriorities,
                      [r._id]: e.target.value,
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    assignTechnician(
                      r._id,
                      assignmentTechnicians[r._id],
                      assignmentDates[r._id],
                      assignmentPriorities[r._id] || "medium"
                    )
                  }
                >
                  Assign Technician
                </button>
              </>
            )}
          </>
        )}
      </article>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">E&P Service</div>
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
                onClick={() => setPage(user ? user.role : "register")}
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
          <form className="auth-form" onSubmit={(e) => submitAuth(e, page === "register")}>
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
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
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
            <div className="summary-card"><span>My Requests</span><strong>{requests.length}</strong></div>
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
            {estimates.filter((est) => requests.some((r) => String(r._id) === getRequestId(est))).length === 0 ? (
              <p>No estimates available yet.</p>
            ) : (
              estimates
                .filter((est) => requests.some((r) => String(r._id) === getRequestId(est)))
                .map((est) => (
                  <article className="history-row" key={est._id}>
                    <h3>Estimate</h3>
                    <p><b>Inspection:</b> {est.inspectionNotes}</p>
                   <p><b>Labor Cost:</b> ₹{est.laborCost}</p>
<p><b>Parts Cost:</b> ₹{est.partsCost}</p>
<p><b>Total Cost:</b> ₹{est.totalCost}</p>
<p><b>Status:</b> {est.status}</p>
                    {est.status === "pending" && (
                      <>
                        <button type="button" onClick={() => respondToEstimate(est._id, "approved")}>Approve</button>
                        <button type="button" onClick={() => respondToEstimate(est._id, "rejected")}>Reject</button>
                      </>
                    )}
                  </article>
                ))
            )}
          </div>

          <div className="dashboard-panel">
            <h2>My Work Orders</h2>
            {workOrders.filter((wo) => requests.some((r) => String(r._id) === getRequestId(wo))).length === 0 ? (
              <p>No work orders available yet.</p>
            ) : (
              workOrders
                .filter((wo) => requests.some((r) => String(r._id) === getRequestId(wo)))
                .map((wo) => (
                  <article className="history-row" key={wo._id}>
                    <h3>Work Order</h3>
                    <p><b>Description:</b> {wo.description}</p>
                    <p><b>Status:</b> {wo.status}</p>
                    <p><b>Scheduled Date:</b> {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : "Not scheduled"}</p>
                    <p><b>Completion Notes:</b> {wo.completionNotes || "No notes yet"}</p>
                  </article>
                ))
            )}
          </div>

          <div className="dashboard-panel">
            <h2>My Invoices - Billing &amp; Payment</h2>
            {invoices.filter((inv) => requests.some((r) => String(r._id) === getRequestId(inv))).length === 0 ? (
              <p>No invoices available yet. An invoice will appear after the technician creates it.</p>
            ) : (
              invoices
                .filter((inv) => requests.some((r) => String(r._id) === getRequestId(inv)))
                .map((inv) => (
                  <article className="history-row" key={inv._id}>
                    <h3>Invoice: {inv.invoiceNumber}</h3>
                    <p><b>Amount:</b> ₹{Number(inv.totalAmount || 0).toFixed(2)}</p>
                    <p><b>Payment Status:</b> {inv.paymentStatus}</p>
                    {inv.paymentStatus === "paid" ? (
                      <>
                        <p><b>Payment Method:</b> {inv.paymentMethod}</p>
                        <p><b>Paid At:</b> {inv.paidAt ? new Date(inv.paidAt).toLocaleString() : "Recorded"}</p>
                      </>
                    ) : (
                      <>
                        <label>Payment Method</label>
                        <select
                          value={paymentMethods[inv._id] || "upi"}
                          onChange={(e) => setPaymentMethods({
                            ...paymentMethods,
                            [inv._id]: e.target.value,
                          })}
                        >
                          <option value="upi">UPI (record payment)</option>
                          <option value="cash">Cash</option>
                          <option value="card">Card (record payment)</option>
                          <option value="other">Other</option>
                        </select>
                        <button type="button" onClick={() => recordPayment(inv._id)}>
                          Record Payment
                        </button>
                      </>
                    )}
                  </article>
                ))
            )}
            <p>Note: This feature records payment status; it does not process real UPI or card transactions.</p>
          </div>

          <div className="dashboard-panel">
            <h2>My Service History</h2>
            {requests.length ? requests.map((r) => requestCard(r)) : <p>No requests yet.</p>}
          </div>
        </main>
      )}

      {page === "admin" && user?.role === "admin" && (
        <main className="customer-dashboard admin-dashboard">
          <h1>Admin Dashboard</h1>
          <div className="summary-grid">
            <div className="summary-card"><span>Total Requests</span><strong>{requests.length}</strong></div>
            <div className="summary-card"><span>Pending</span><strong>{requests.filter((r) => r.status === "pending").length}</strong></div>
            <div className="summary-card"><span>Technicians</span><strong>{technicians.length}</strong></div>
          </div>

          <button onClick={() => refresh("admin")}>Refresh Dashboard</button>
          
          <section className="dashboard-panel">
            <h2>Invoice & Payment Management</h2>

            <div className="summary-grid">
              <div className="summary-card">
                <span>Total Invoices</span>
                <strong>{invoices.length}</strong>
              </div>

              <div className="summary-card">
                <span>Pending Payments</span>
                <strong>
                  {invoices.filter((inv) => inv.paymentStatus === "pending").length}
                </strong>
              </div>

              <div className="summary-card">
                <span>Paid Payments</span>
                <strong>
                  {invoices.filter((inv) => inv.paymentStatus === "paid").length}
                </strong>
              </div>

              <div className="summary-card">
                <span>Total Invoice Amount</span>
                <strong>
                  ₹{invoices.reduce(
                    (total, inv) => total + Number(inv.totalAmount || 0),
                    0
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <h3>All Invoices</h3>

            {invoices.length === 0 ? (
              <p>No invoices found. An invoice will appear after it is created for a work order.</p>
            ) : (
              invoices.map((inv) => (
                <article className="history-row" key={inv._id}>
                  <h3>Invoice: {inv.invoiceNumber}</h3>

                  <p>
                    <b>Customer:</b>{" "}
                    {inv.customer?.name || "Customer"}
                  </p>

                  <p>
                    <b>Technician:</b>{" "}
                    {inv.technician?.name || "Technician"}
                  </p>

                  <p>
                    <b>Amount:</b> ₹{Number(inv.totalAmount || 0).toFixed(2)}
                  </p>

                  <p>
                    <b>Payment Status:</b> {inv.paymentStatus}
                  </p>

                  {inv.paymentStatus === "paid" ? (
                    <>
                      <p>
                        <b>Payment Method:</b> {inv.paymentMethod}
                      </p>
                      <p>
                        <b>Paid At:</b>{" "}
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleString()
                          : "Recorded"}
                      </p>
                    </>
                  ) : (
                    <>
                      <label>Payment Method</label>
                      <select
                        value={paymentMethods[inv._id] || "upi"}
                        onChange={(e) =>
                          setPaymentMethods({
                            ...paymentMethods,
                            [inv._id]: e.target.value,
                          })
                        }
                      >
                        <option value="upi">UPI</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => recordPayment(inv._id)}
                      >
                        Record Payment
                      </button>
                    </>
                  )}
                </article>
              ))
            )}

            <p>
              Note: This records payment status only. It does not process real UPI or card transactions.
            </p>
          </section>


          <section className="dashboard-panel">
            <h2>Add New Technician</h2>
            <form onSubmit={createTechnician} className="technician-form">
              <label>
                Technician Name
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={technicianEmail}
                  onChange={(e) => setTechnicianEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                Phone
                <input
                  type="tel"
                  value={technicianPhone}
                  onChange={(e) => setTechnicianPhone(e.target.value)}
                  required
                />
              </label>

              <label>
                Password (minimum 8 characters)
                <input
                  type="password"
                  value={technicianPassword}
                  onChange={(e) => setTechnicianPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </label>

              <label>
                Skills (comma-separated)
                <input
                  type="text"
                  value={technicianSkills}
                  onChange={(e) => setTechnicianSkills(e.target.value)}
                  placeholder="Plumbing, Pipe Repair"
                  required
                />
              </label>

              <label>
                Service Area
                <input
                  type="text"
                  value={technicianServiceArea}
                  onChange={(e) => setTechnicianServiceArea(e.target.value)}
                  placeholder="Kolhapur"
                  required
                />
              </label>

              <label>
                Experience (years)
                <input
                  type="number"
                  min="0"
                  value={technicianExperience}
                  onChange={(e) => setTechnicianExperience(e.target.value)}
                  required
                />
              </label>

              <button type="submit" disabled={technicianLoading}>
                {technicianLoading ? "Creating..." : "Create Technician"}
              </button>
            </form>
          </section>
          <h2>Service Requests</h2>
          {requests.length ? requests.map((r) => requestCard(r, true)) : <p>No service requests found.</p>}

          <h2>Technicians</h2>
          {technicians.length ? technicians.map((t) => (
            <article className="history-row" key={t._id}>
              <p><b>Name:</b> {t.user?.name || t.name || "Technician"}</p>
              <p><b>Email:</b> {t.user?.email || t.email || "Not available"}</p>
              <p><b>Skills:</b> {t.skills?.join?.(", ") || "Not specified"}</p>
              <p><b>Availability:</b> {t.availability || "Not specified"}</p>
            </article>
          )) : <p>No technicians found.</p>}
        </main>
      )}

      {page === "technician" && user?.role === "technician" && (
        <main className="customer-dashboard">
          <h1>Technician Dashboard</h1>
          <p>Welcome, {user.name}</p>

          <div className="summary-grid">
            <div className="summary-card">
              <span>Assigned Jobs</span>
              <strong>{assignments.filter((a) => !["completed", "cancelled"].includes(a.serviceRequest?.status) && !["completed", "cancelled"].includes(a.status)).length}</strong>
            </div>
            <div className="summary-card">
              <span>Completed</span>
              <strong>{assignments.filter((a) => a.serviceRequest?.status === "completed" || a.status === "completed").length}</strong>
            </div>
          </div>

          <button type="button" onClick={() => refresh("technician")}>Refresh Jobs</button>

          {assignments.length === 0 ? (
            <p>No assigned jobs found.</p>
          ) : assignments.map((a) => {
            const r = typeof a.serviceRequest === "object" ? a.serviceRequest : null;
            if (!r) return <article className="history-row" key={a._id}>Job details unavailable.</article>;

            const existingEstimate = estimates.find((est) => getRequestId(est) === String(r._id));
            const relatedWorkOrder = workOrders.find((wo) => getRequestId(wo) === String(r._id));
            const existingInvoice = invoices.find((inv) => getRequestId(inv) === String(r._id));

            return (
              <article className="history-row" key={a._id}>
                <h3>{r.serviceType} Job</h3>
                <p><b>Customer:</b> {r.customer?.name || "Customer"}</p>
                <p><b>Phone:</b> {r.customer?.phone || "Not available"}</p>
                <p><b>Description:</b> {r.description}</p>
                <p><b>Address:</b> {r.address}</p>
                <p><b>Status:</b> {r.status}</p>
                <p><b>Priority:</b> {a.priority || "medium"}</p>
                <p><b>Scheduled Date:</b> {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString() : "Not scheduled"}</p>

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
                  value={notes[r._id] ?? existingEstimate?.inspectionNotes ?? ""}
                  onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })}
                  placeholder="Enter inspection notes"
                />

                <label>Labor Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={labor[r._id] ?? (existingEstimate ? String(existingEstimate.laborCost) : "")}
                  onChange={(e) => setLabor({ ...labor, [r._id]: e.target.value })}
                />

                <label>Parts Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={parts[r._id] ?? (existingEstimate ? String(existingEstimate.partsCost) : "")}
                  onChange={(e) => setParts({ ...parts, [r._id]: e.target.value })}
                />
<p><b>Total Estimate: ₹{(Number(labor[r._id] || existingEstimate?.laborCost || 0) + Number(parts[r._id] || existingEstimate?.partsCost || 0)).toFixed(2)}</b></p>

                {existingEstimate && (
                  <>
                    <p><b>Saved Estimate Status:</b> {existingEstimate.status}</p>
                    <p><b>Saved Total Cost:</b> ₹{Number(existingEstimate.totalCost).toFixed(2)}</p>
                  </>
                )}

                <button
                  type="button"
                  disabled={Boolean(existingEstimate)}
                  onClick={() => createEstimate(r._id)}
                >
                  {existingEstimate ? "Estimate Already Created" : "Create Estimate"}
                </button>

                <button type="button" onClick={() => createWorkOrder(r._id)}>
                  Create Work Order
                </button>

                {relatedWorkOrder && !existingInvoice && existingEstimate?.status === "approved" && (
                  <button type="button" onClick={() => createInvoice(relatedWorkOrder._id)}>
                    Create Invoice
                  </button>
                )}

                {existingInvoice && (
                  <p>
                    <b>Invoice:</b> {existingInvoice.invoiceNumber} — ₹{Number(existingInvoice.totalAmount || 0).toFixed(2)} — {existingInvoice.paymentStatus}
                  </p>
                )}
              </article>
            );
          })}
        </main>
      )}
    </div>
  );
}
