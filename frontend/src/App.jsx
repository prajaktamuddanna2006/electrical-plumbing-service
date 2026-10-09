
import { useState } from "react";
import "./App.css";

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
  const [serviceType, setServiceType] = useState("plumbing");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");

  const token = localStorage.getItem("token");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed. Check your details.");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        setPage("dashboard");
        setMessage("");
        await loadRequests(data.token);
      } else {
        setMessage("Login response did not contain a token.");
      }
    } catch {
      setMessage("Server connection failed. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      setMessage("Registration successful! Please login.");
      setPage("login");
      setPassword("");
    } catch {
      setMessage("Server connection failed. Check the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests(authToken = token) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/service-requests",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRequests(Array.isArray(data) ? data : data.requests || []);
      }
    } catch {
      console.log("Could not load service requests.");
    }
  }

  async function handleServiceRequest(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/service-requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            serviceType,
            description,
            address: serviceAddress,
            preferredDate,
            preferredTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not submit service request.");
        return;
      }

      setMessage("Service request submitted successfully!");
      setDescription("");
      setPreferredDate("");
      setPreferredTime("");
      setServiceAddress("");
      await loadRequests();
    } catch {
      setMessage("Server connection failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setRequests([]);
    setPage("home");
    setEmail("");
    setPassword("");
    setMessage("You have logged out.");
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">⚡ E&P Service</div>
        <nav className="nav">
          <button onClick={() => { setPage("home"); setMessage(""); }}>
            Home
          </button>
          <button onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>
            Services
          </button>
          {page === "dashboard" ? (
            <button onClick={logout}>Logout</button>
          ) : (
            <>
              <button onClick={() => { setPage("login"); setMessage(""); }}>
                Login
              </button>
              <button onClick={() => { setPage("register"); setMessage(""); }}>
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
              <h1>
                Electrical & Plumbing
                <br />
                Services at Your Doorstep
              </h1>
              <p>
                Reliable home services from trusted professionals.
                Book your electrical and plumbing service easily.
              </p>
              <button className="hero-button" onClick={() => setPage("register")}>
                Get Started
              </button>
            </div>
            <div className="hero-card">
              <div className="hero-card-icon">🏠</div>
              <h3>Trusted Home Service</h3>
              <p>Professional technicians and reliable service for your home.</p>
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
                <p>Wiring, switch repair, fan installation and maintenance.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">🔧</div>
                <h3>Plumbing Services</h3>
                <p>Tap repair, pipe repair, leakage fixing and more.</p>
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
                <button className="hero-button" onClick={() => setPage("login")}>
                  Login
                </button>
                <button className="hero-button" onClick={() => setPage("register")}>
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
            <h1>Customer Login</h1>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
            <p>{message}</p>
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => { setPage("register"); setMessage(""); }}>
                Register
              </button>
            </p>
          </form>
        </section>
      )}

      {page === "register" && (
        <section className="form-page">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1>Create Account</h1>
            <label>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <label>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <label>Password</label>
            <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <label>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} required />
            <button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Register"}
            </button>
            <p>{message}</p>
            <p>
              Already registered?{" "}
              <button type="button" onClick={() => { setPage("login"); setMessage(""); }}>
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
              <p>Welcome to your service portal</p>
            </div>
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>

          <div className="dashboard-body">
            <div className="summary-grid">
              <div className="summary-card">
                <span>📋 My Requests</span>
                <strong>{requests.length}</strong>
              </div>
              <div className="summary-card">
                <span>🔧 Plumbing & Electrical</span>
                <strong>{requests.filter((r) => r.status !== "completed").length}</strong>
              </div>
              <div className="summary-card">
                <span>✅ Completed</span>
                <strong>{requests.filter((r) => r.status === "completed").length}</strong>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <div className="dashboard-panel">
                <div className="panel-heading">
                  <h2>Request Service</h2>
                  <p>Book a new electrical or plumbing service</p>
                </div>
                <form className="request-form" onSubmit={handleServiceRequest}>
                  <label>Service Type</label>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                  </select>

                  <label>Description</label>
                  <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required />

                  <label>Preferred Date</label>
                  <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />

                  <label>Preferred Time</label>
                  <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />

                  <label>Service Address</label>
                  <input value={serviceAddress} onChange={(e) => setServiceAddress(e.target.value)} required />

                  <button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Service Request"}
                  </button>
                </form>
                <p>{message}</p>
              </div>

              <div className="dashboard-panel">
                <h2>Service History</h2>
                {requests.length === 0 ? (
                  <p>No service requests found.</p>
                ) : (
                  requests.map((request) => (
                    <div className="history-row" key={request._id}>
                      <div>{request.serviceType}</div>
                      <div>{request.description}</div>
                      <div>{request.address}</div>
                      <div>{request.status}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;