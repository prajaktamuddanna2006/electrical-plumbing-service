                   
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
  const [updatingRequestId, setUpdatingRequestId] = useState("");
  const [requests, setRequests] = useState([]);

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

  async function loadRequests(authToken = token()) {
    if (!authToken) {
      setMessage("Please login to view service requests.");
      return false;
    }

    try {
      const response = await fetch(`${API}/service-requests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

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
      setMessage("Server connection failed. Please check the backend.");
      return false;
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

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

      setPage(
        data.user.role === "technician"
          ? "technician-dashboard"
          : "dashboard"
      );

      await loadRequests(data.token);
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Server connection failed. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          address,
          role: "customer",
        }),
      });

      const data = await response.json();

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
      setMessage("Server connection failed. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleServiceRequest(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API}/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          serviceType,
          description,
          address: serviceAddress,
          preferredDate: preferredDate || undefined,
          preferredTime: preferredTime || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not submit service request.");
        return;
      }

      setMessage(data.message || "Service request submitted successfully!");
      setDescription("");
      setPreferredDate("");
      setPreferredTime("");
      setServiceAddress("");

      await loadRequests();
    } catch (error) {
      console.error("Service request error:", error);
      setMessage("Server connection failed. Please check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(requestId, status) {
    const authToken = token();

    if (!authToken) {
      setMessage("Your session has expired. Please login again.");
      return;
    }

    setUpdatingRequestId(requestId);
    setMessage("");

    try {
      const response = await fetch(
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

      const data = await response.json();

      if (!response.ok) {
        console.error("Status update rejected:", response.status, data);
        setMessage(
          data.message || `Status update failed (${response.status}).`
        );
        return;
      }

      if (!data.request) {
        setMessage(
          data.message || "Updated, but the server did not return the request."
        );
        await loadRequests();
        return;
      }

      // Update the selected request immediately in the UI.
      setRequests((previousRequests) =>
        previousRequests.map((request) =>
          request._id === requestId
            ? { ...request, ...data.request }
            : request
        )
      );

      setMessage(data.message || "Request status updated successfully!");

      // Reload from the database to confirm the latest status.
      await loadRequests(authToken);
    } catch (error) {
      console.error("Status update error:", error);
      setMessage("Could not connect to the server. Check the backend.");
    } finally {
      setUpdatingRequestId("");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setRequests([]);
    setEmail("");
    setPassword("");
    setPage("home");
    setMessage("You have logged out.");
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚡ E&P Service</div>

        <nav className="nav">
          <button type="button" onClick={() => goToPage("home")}>
            Home
          </button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Services
          </button>

          {currentUser ? (
            <button type="button" onClick={logout}>
              Logout
            </button>
          ) : (
            <>
              <button type="button" onClick={() => goToPage("login")}>
                Login
              </button>
              <button type="button" onClick={() => goToPage("register")}>
                Register
              </button>
            </>
          )}
        </nav>
      </header>

      {page === "home" && (
        <main>
          <section className="hero" id="home">
            <div className="hero-content">
              <span className="hero-tag">PROFESSIONAL HOME SERVICES</span>
              <h1>Electrical & Plumbing Services at Your Doorstep</h1>
              <p>
                Reliable home services from trusted professionals. Book your
                electrical or plumbing service easily.
              </p>
              <button
                type="button"
                className="hero-button"
                onClick={() => goToPage("register")}
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

          <section className="account-section">
            <div className="account-content">
              <span>GET STARTED</span>
              <h2>Ready to Book a Service?</h2>
              <p>Login or create an account to request a service.</p>

              <div className="account-buttons">
                <button
                  type="button"
                  className="hero-button"
                  onClick={() => goToPage("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="hero-button"
                  onClick={() => goToPage("register")}
                >
                  Register
                </button>
              </div>
            </div>
          </section>
        </main>
      )}

      {page === "login" && (
        <section className="form-page">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1>Login</h1>
            <p>Customers and registered technicians can login here.</p>

            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <label htmlFor="register-phone">Phone</label>
            <input
              id="register-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
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
              placeholder="Create a password (at least 6 characters)"
              autoComplete="new-password"
              required
            />

            <label htmlFor="register-address">Address</label>
            <input
              id="register-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
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
            <button className="logout-button" onClick={logout} type="button">
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
                      (request) =>
                        !["completed", "cancelled"].includes(request.status)
                    ).length
                  }
                </strong>
              </div>

              <div className="summary-card">
                <span>✅ Completed</span>
                <strong>
                  {
                    requests.filter(
                      (request) => request.status === "completed"
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <div className="dashboard-panel">
                <div className="panel-heading">
                  <h2>Request Service</h2>
                  <p>Book a new electrical or plumbing service.</p>
                </div>

                <form className="request-form" onSubmit={handleServiceRequest}>
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
                    placeholder="Describe the problem"
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
                    placeholder="Where is the service needed?"
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
                    <div className="history-row" key={request._id}>
                      <p>
                        <strong>Service:</strong> {request.serviceType}
                      </p>
                      <p>
                        <strong>Description:</strong> {request.description}
                      </p>
                      <p>
                        <strong>Address:</strong> {request.address}
                      </p>
                      <p>
                        <strong>Status:</strong> {request.status}
                      </p>
                      <p>
                        <strong>Technician:</strong>{" "}
                        {request.assignedTechnician?.name ||
                          "Not assigned yet"}
                      </p>
                    </div>
                  ))
                )}
              </div>
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

            <button className="logout-button" onClick={logout} type="button">
              Logout
            </button>
          </div>

          <div className="dashboard-body">
            <div className="summary-grid">
              <div className="summary-card">
                <span>📋 Assigned Requests</span>
                <strong>{requests.length}</strong>
              </div>

              <div className="summary-card">
                <span>🔧 In Progress</span>
                <strong>
                  {
                    requests.filter(
                      (request) => request.status === "in-progress"
                    ).length
                  }
                </strong>
              </div>

              <div className="summary-card">
                <span>✅ Completed</span>
                <strong>
                  {
                    requests.filter(
                      (request) => request.status === "completed"
                    ).length
                  }
                </strong>
              </div>
            </div>

            <div className="dashboard-panel">
              <h2>My Assigned Service Requests</h2>

              {message && <p role="status">{message}</p>}

              <button
                type="button"
                disabled={loading || Boolean(updatingRequestId)}
                onClick={async () => {
                  setLoading(true);
                  setMessage("");
                  try {
                    const success = await loadRequests();
                    if (success) {
                      setMessage("Service requests refreshed successfully.");
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "Refreshing..." : "Refresh Requests"}
              </button>

              {requests.length === 0 ? (
                <p>No service requests are assigned to you yet.</p>
              ) : (
                requests.map((request) => (
                  <div className="history-row" key={request._id}>
                    <p>
                      <strong>Service:</strong> {request.serviceType}
                    </p>
                    <p>
                      <strong>Description:</strong> {request.description}
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
                      <strong>Address:</strong> {request.address}
                    </p>
                    <p>
                      <strong>Current Status:</strong> {request.status}
                    </p>

                    <label htmlFor={`status-${request._id}`}>
                      Update Request Status
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
                      <p role="status">Updating status...</p>
                    )}
                  </div>
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
