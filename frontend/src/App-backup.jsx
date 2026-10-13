import { useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [page, setPage] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [updatingRequestId, setUpdatingRequestId] = useState("");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [serviceType, setServiceType] = useState("plumbing");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");

  const token = () => localStorage.getItem("token");

  function goToPage(nextPage) {
    setPage(nextPage);
    setMessage("");
  }

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || "Invalid server response." };
    }

    return { response, data };
  }

  async function loadRequests(authToken = token()) {
    if (!authToken) return false;

    try {
      const { response, data } = await apiRequest(
        `${API}/service-requests`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Could not load service requests.");
        return false;
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.requests)
          ? data.requests
          : [];

      setRequests(list);
      return true;
    } catch (error) {
      console.error("Load requests error:", error);
      setMessage("Backend connection failed while loading requests.");
      return false;
    }
  }

  async function loadTechnicians(authToken = token()) {
    if (!authToken) return false;

    try {
      const { response, data } = await apiRequest(
        `${API}/technicians`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Could not load technicians.");
        return false;
      }

      setTechnicians(
        Array.isArray(data)
          ? data
          : Array.isArray(data.technicians)
            ? data.technicians
            : []
      );

      return true;
    } catch (error) {
      console.error("Load technicians error:", error);
      setMessage("Could not connect to load technicians.");
      return false;
    }
  }

  async function loadMyAssignments(authToken = token()) {
    if (!authToken) return false;

    try {
      const { response, data } = await apiRequest(
        `${API}/technicians/my-assignments`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Could not load assigned jobs.");
        return false;
      }

      const assignments = Array.isArray(data)
        ? data
        : Array.isArray(data.assignments)
          ? data.assignments
          : [];

      setMyAssignments(assignments);
      return true;
    } catch (error) {
      console.error("Load assignments error:", error);
      setMessage("Could not connect to load assigned jobs.");
      return false;
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { response, data } = await apiRequest(
        `${API}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password.");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("Login response is missing user information.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setCurrentUser(data.user);
      setPassword("");

      if (data.user.role === "admin") {
        setPage("admin-dashboard");
      } else if (data.user.role === "technician") {
        setPage("technician-dashboard");
      } else {
        setPage("dashboard");
      }

      await loadRequests(data.token);

      if (data.user.role === "admin") {
        await loadTechnicians(data.token);
      }

      if (data.user.role === "technician") {
        await loadMyAssignments(data.token);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(
        "Cannot connect to backend. Check that port 5000 is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { response, data } = await apiRequest(
        `${API}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            address: address.trim(),
            role: "customer",
          }),
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage("Registration successful! Please login.");
      setPage("login");
      setPassword("");
      setName("");
      setPhone("");
      setAddress("");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleServiceRequest(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { response, data } = await apiRequest(
        `${API}/service-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({
            serviceType,
            description: description.trim(),
            address: serviceAddress.trim(),
            preferredDate: preferredDate || undefined,
            preferredTime: preferredTime || undefined,
          }),
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Service request failed.");
        return;
      }

      setMessage(
        data.message || "Service request submitted successfully!"
      );

      setDescription("");
      setPreferredDate("");
      setPreferredTime("");
      setServiceAddress("");

      await loadRequests();
    } catch (error) {
      console.error("Service request error:", error);
      setMessage("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(requestId, status) {
    const authToken = token();

    if (!authToken) {
      setMessage("Please login again.");
      return;
    }

    setUpdatingRequestId(requestId);
    setMessage("");

    try {
      const { response, data } = await apiRequest(
        `${API}/service-requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        setMessage(data.message || "Status update failed.");
        return;
      }

      setMessage(data.message || "Request status updated.");

      await loadRequests(authToken);

      if (currentUser?.role === "technician") {
        await loadMyAssignments(authToken);
      }
    } catch (error) {
      console.error("Status update error:", error);
      setMessage("Could not connect to backend.");
    } finally {
      setUpdatingRequestId("");
    }
  }

  async function refreshDashboard() {
    setLoading(true);
    setMessage("");

    try {
      const requestsLoaded = await loadRequests();
      let extraLoaded = true;

      if (currentUser?.role === "admin") {
        extraLoaded = await loadTechnicians();
      }

      if (currentUser?.role === "technician") {
        extraLoaded = await loadMyAssignments();
      }

      if (requestsLoaded && extraLoaded) {
        setMessage("Dashboard refreshed successfully.");
      }
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setCurrentUser(null);
    setRequests([]);
    setTechnicians([]);
    setMyAssignments([]);
    setEmail("");
    setPassword("");
    setPage("home");
    setMessage("You have logged out.");
  }

  function RequestCard({ request, showStatusEditor = false }) {
    return (
      <div className="history-row" key={request._id}>
        <p>
          <strong>Service:</strong> {request.serviceType}
        </p>
        <p>
          <strong>Description:</strong> {request.description}
        </p>
        <p>
          <strong>Customer:</strong> {request.customer?.name || "Customer"}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          {request.customer?.phone || "Not available"}
        </p>
        <p>
          <strong>Address:</strong> {request.address}
        </p>
        <p>
          <strong>Preferred Date:</strong>{" "}
          {request.preferredDate
            ? String(request.preferredDate).slice(0, 10)
            : "Not specified"}
        </p>
        <p>
          <strong>Technician:</strong>{" "}
          {request.assignedTechnician?.name || "Not assigned yet"}
        </p>
        <p>
          <strong>Status:</strong> {request.status}
        </p>

        {showStatusEditor && (
          <>
            <label htmlFor={`status-${request._id}`}>
              Update Status
            </label>

            <select
              id={`status-${request._id}`}
              value={request.status}
              disabled={Boolean(updatingRequestId)}
              onChange={(e) =>
                updateRequestStatus(request._id, e.target.value)
              }
            >
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="inspection">Inspection</option>
              <option value="approved">Approved</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {updatingRequestId === request._id && (
              <p>Updating status...</p>
            )}
          </>
        )}
      </div>
    );
  }

  function AssignmentCard({ assignment }) {
    const request =
      typeof assignment.serviceRequest === "object"
        ? assignment.serviceRequest
        : null;

    if (!request) {
      return (
        <div className="history-row" key={assignment._id}>
          <h3>Assigned Job</h3>
          <p>
            <strong>Assignment ID:</strong> {assignment._id}
          </p>
          <p>
            <strong>Status:</strong> {assignment.status || "assigned"}
          </p>
          <p>Service request details are unavailable.</p>
        </div>
      );
    }

    return (
      <div className="history-row" key={assignment._id}>
        <h3>🔧 {request.serviceType || "Service"} Job</h3>

        <p>
          <strong>Job ID:</strong> {request._id}
        </p>
        <p>
          <strong>Customer:</strong>{" "}
          {request.customer?.name || "Customer"}
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          {request.customer?.phone || "Not available"}
        </p>
        <p>
          <strong>Description:</strong>{" "}
          {request.description || "No description"}
        </p>
        <p>
          <strong>Address:</strong>{" "}
          {request.address || "Not available"}
        </p>
        <p>
          <strong>Scheduled Date:</strong>{" "}
          {assignment.scheduledDate
            ? new Date(assignment.scheduledDate).toLocaleString()
            : "Not scheduled"}
        </p>
        <p>
          <strong>Priority:</strong> {assignment.priority || "medium"}
        </p>
        <p>
          <strong>Assignment Status:</strong>{" "}
          {assignment.status || "assigned"}
        </p>
        <p>
          <strong>Service Status:</strong> {request.status || "pending"}
        </p>

        <label htmlFor={`job-status-${request._id}`}>
          Update Service Status
        </label>

        <select
          id={`job-status-${request._id}`}
          value={request.status || "assigned"}
          disabled={Boolean(updatingRequestId)}
          onChange={(e) =>
            updateRequestStatus(request._id, e.target.value)
          }
        >
          <option value="assigned">Assigned</option>
          <option value="inspection">Inspection</option>
          <option value="approved">Approved</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {updatingRequestId === request._id && (
          <p>Updating job status...</p>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚡ E&P Service</div>

        <nav className="nav">
          <button type="button" onClick={() => goToPage("home")}>
            Home
          </button>

          {!currentUser && (
            <>
              <button type="button" onClick={() => goToPage("login")}>
                Login
              </button>
              <button type="button" onClick={() => goToPage("register")}>
                Register
              </button>
            </>
          )}

          {currentUser && (
            <button type="button" onClick={logout}>
              Logout
            </button>
          )}
        </nav>
      </header>

      {page === "home" && (
        <main>
          <section className="hero" id="home">
            <div className="hero-content">
              <span className="hero-tag">
                PROFESSIONAL HOME SERVICES
              </span>
              <h1>Electrical & Plumbing Services at Your Doorstep</h1>
              <p>
                Reliable home services from trusted professionals.
                Book your electrical or plumbing service easily.
              </p>
              <button
                className="hero-button"
                type="button"
                onClick={() =>
                  goToPage(currentUser ? "dashboard" : "register")
                }
              >
                Get Started
              </button>
            </div>

            <div className="hero-card">
              <div className="hero-card-icon">🏠</div>
              <h3>Trusted Home Service</h3>
              <p>
                Professional technicians and reliable service for your home.
              </p>
            </div>
          </section>

          <section className="services" id="services">
            <div className="section-heading">
              <span>WHAT WE OFFER</span>
              <h2>Our Services</h2>
              <p>Complete home service solutions for your needs.</p>
            </div>

            <div className="service-grid">
              <div className="service-card">
                <div className="service-icon">⚡</div>
                <h3>Electrical Services</h3>
                <p>
                  Wiring, switch repair, fan installation and maintenance.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">🔧</div>
                <h3>Plumbing Services</h3>
                <p>
                  Tap repair, pipe repair, leakage fixing and more.
                </p>
              </div>

              <div className="service-card">
                <div className="service-icon">🏠</div>
                <h3>Home Maintenance</h3>
                <p>Reliable maintenance services for your home.</p>
              </div>
            </div>
          </section>
        </main>
      )}

      {page === "login" && (
        <section className="form-page">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1>Login</h1>
            <p>Customers, technicians and admins can login here.</p>

            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>

            {message && <p role="status">{message}</p>}

            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => goToPage("register")}>
                Register
              </button>
            </p>
          </form>
        </section>
      )}

      {page === "register" && (
        <section className="form-page">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1>Create Customer Account</h1>

            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label htmlFor="register-phone">Phone</label>
            <input
              id="register-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />

            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label htmlFor="register-address">Address</label>
            <input
              id="register-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>

            {message && <p role="status">{message}</p>}

            <p>
              Already registered?{" "}
              <button type="button" onClick={() => goToPage("login")}>
                Login
              </button>
            </p>
          </form>
        </section>
      )}

      {page === "dashboard" && (
        <main className="customer-dashboard">
          <div className="customer-topbar">
            <div>
              <span className="dashboard-label">CUSTOMER PORTAL</span>
              <h1>Customer Dashboard</h1>
              <p>Welcome, {currentUser?.name || "Customer"}!</p>
            </div>
            <button
              className="logout-button"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>

          <div className="dashboard-body">
            <div className="summary-grid">
              <div className="summary-card">
                <span>📋 My Requests</span>
                <strong>{requests.length}</strong>
              </div>
              <div className="summary-card">
                <span>🔧 Active Requests</span>
                <strong>
                  {
                    requests.filter(
                      (r) =>
                        !["completed", "cancelled"].includes(r.status)
                    ).length
                  }
                </strong>
              </div>
              <div className="summary-card">
                <span>✅ Completed</span>
                <strong>
                  {
                    requests.filter((r) => r.status === "completed").length
                  }
                </strong>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <div className="dashboard-panel">
                <h2>Request Service</h2>

                <form
                  className="request-form"
                  onSubmit={handleServiceRequest}
                >
                  <label htmlFor="service-type">Service Type</label>
                  <select
                    id="service-type"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                  </select>

                  <label htmlFor="service-description">Description</label>
                  <textarea
                    id="service-description"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />

                  <label htmlFor="preferred-date">Preferred Date</label>
                  <input
                    id="preferred-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />

                  <label htmlFor="preferred-time">Preferred Time</label>
                  <input
                    id="preferred-time"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  />

                  <label htmlFor="service-address">Service Address</label>
                  <input
                    id="service-address"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    required
                  />

                  <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Service Request"}
                  </button>
                </form>

                {message && <p role="status">{message}</p>}
              </div>

              <div className="dashboard-panel">
                <h2>Service History</h2>

                {requests.length === 0 ? (
                  <p>No service requests found.</p>
                ) : (
                  requests.map((request) => (
                    <RequestCard key={request._id} request={request} />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {page === "admin-dashboard" && (
        <main className="customer-dashboard">
          <div className="customer-topbar">
            <div>
              <span className="dashboard-label">ADMIN PORTAL</span>
              <h1>Admin Dashboard</h1>
              <p>Welcome, {currentUser?.name || "Admin"}!</p>
            </div>
            <button
              className="logout-button"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>

          <div className="dashboard-body">
            <div className="summary-grid">
              <div className="summary-card">
                <span>📋 Total Requests</span>
                <strong>{requests.length}</strong>
              </div>
              <div className="summary-card">
                <span>⏳ Pending Requests</span>
                <strong>
                  {requests.filter((r) => r.status === "pending").length}
                </strong>
              </div>
              <div className="summary-card">
                <span>✅ Completed</span>
                <strong>
                  {
                    requests.filter((r) => r.status === "completed").length
                  }
                </strong>
              </div>
              <div className="summary-card">
                <span>🔧 Technicians</span>
                <strong>{technicians.length}</strong>
              </div>
            </div>

            <div className="dashboard-panel">
              <h2>Service Request Management</h2>

              <button
                type="button"
                disabled={loading}
                onClick={refreshDashboard}
              >
                {loading ? "Refreshing..." : "Refresh Dashboard"}
              </button>

              {message && <p role="status">{message}</p>}

              {requests.length === 0 ? (
                <p>No service requests found.</p>
              ) : (
                requests.map((request) => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    showStatusEditor
                  />
                ))
              )}
            </div>

            <div className="dashboard-panel">
              <h2>Technician Management</h2>

              {technicians.length === 0 ? (
                <p>No technicians found.</p>
              ) : (
                technicians.map((tech) => (
                  <div className="history-row" key={tech._id}>
                    <p>
                      <strong>Name:</strong>{" "}
                      {tech.user?.name || "Not available"}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {tech.user?.email || "Not available"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {tech.user?.phone || "Not available"}
                    </p>
                    <p>
                      <strong>Skills:</strong>{" "}
                      {Array.isArray(tech.skills)
                        ? tech.skills.join(", ")
                        : "Not specified"}
                    </p>
                    <p>
                      <strong>Service Area:</strong>{" "}
                      {tech.serviceArea || "Not specified"}
                    </p>
                    <p>
                      <strong>Availability:</strong>{" "}
                      {tech.availability || "Not specified"}
                    </p>
                    <p>
                      <strong>Experience:</strong>{" "}
                      {tech.experience ?? 0} years
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {page === "technician-dashboard" && (
        <main className="customer-dashboard">
          <div className="customer-topbar">
            <div>
              <span className="dashboard-label">TECHNICIAN PORTAL</span>
              <h1>Technician Dashboard</h1>
              <p>Welcome, {currentUser?.name || "Technician"}!</p>
            </div>
            <button
              className="logout-button"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>

          <div className="dashboard-body">
            <div className="summary-grid">
              <div className="summary-card">
                <span>📋 Assigned Jobs</span>
                <strong>{myAssignments.length}</strong>
              </div>
              <div className="summary-card">
                <span>🔧 In Progress</span>
                <strong>
                  {
                    myAssignments.filter(
                      (a) =>
                        a.serviceRequest?.status === "in-progress" ||
                        a.status === "in-progress"
                    ).length
                  }
                </strong>
              </div>
              <div className="summary-card">
                <span>✅ Completed</span>
                <strong>
                  {
                    myAssignments.filter(
                      (a) =>
                        a.serviceRequest?.status === "completed" ||
                        a.status === "completed"
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="dashboard-panel">
              <h2>My Assigned Jobs</h2>

              <button
                type="button"
                disabled={loading}
                onClick={refreshDashboard}
              >
                {loading ? "Refreshing..." : "Refresh Assigned Jobs"}
              </button>

              {message && <p role="status">{message}</p>}

              {myAssignments.length === 0 ? (
                <p>
                  No assigned jobs found. Refresh or contact the administrator.
                </p>
              ) : (
                myAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment._id}
                    assignment={assignment}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;