import React, { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [showHome, setShowHome] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  const [serviceType, setServiceType] = useState("Electrical");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [serviceMessage, setServiceMessage] = useState("");

  const [myRequests, setMyRequests] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignMessage, setAssignMessage] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setLoggedIn(true);
        setShowHome(false);
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      const loginToken = data.token || data.accessToken;
      const loginUser = data.user || data;

      if (!loginToken) {
        setMessage("Token not received from server");
        return;
      }

      localStorage.setItem("token", loginToken);
      localStorage.setItem("user", JSON.stringify(loginUser));

      setToken(loginToken);
      setUser(loginUser);
      setLoggedIn(true);
      setShowHome(false);
      setMessage("Login successful");

      setEmail("");
      setPassword("");
    } catch {
      setMessage("Backend server is not running");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setLoggedIn(false);
    setUser(null);
    setToken("");

    setMyRequests([]);
    setAdminRequests([]);
    setTechnicians([]);
    setMessage("");

    setShowHome(true);
  };

  const handleServiceRequest = async (e) => {
    e.preventDefault();
    setServiceMessage("");

    try {
      const response = await fetch(`${API}/api/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType: serviceType.toLowerCase(),
          description,
          address,
          preferredDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServiceMessage(data.message || "Request failed");
        return;
      }

      setServiceMessage("Service Request successfully submitted");

      setDescription("");
      setAddress("");
      setPreferredDate("");

      loadMyRequests();
    } catch {
      setServiceMessage("Unable to submit request");
    }
  };

  const loadMyRequests = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/service-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) return;

      const requests = Array.isArray(data)
        ? data
        : data.requests || data.data || [];

      setMyRequests(requests);
    } catch {
      setMyRequests([]);
    }
  };

  const loadAdminData = async () => {
    if (!token) return;

    try {
      const requestResponse = await fetch(
        `${API}/api/service-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const requestData = await requestResponse.json();

      if (requestResponse.ok) {
        const requests = Array.isArray(requestData)
          ? requestData
          : requestData.requests || requestData.data || [];

        setAdminRequests(requests);
      }

      const technicianResponse = await fetch(
        `${API}/api/technicians`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const technicianData = await technicianResponse.json();

      if (technicianResponse.ok) {
        const techs = Array.isArray(technicianData)
          ? technicianData
          : technicianData.technicians ||
            technicianData.data ||
            [];

        setTechnicians(techs);
      }
    } catch {
      setAdminRequests([]);
      setTechnicians([]);
    }
  };

  const assignTechnician = async (e) => {
    e.preventDefault();
    setAssignMessage("");

    if (!selectedRequest || !selectedTechnician) {
      setAssignMessage("Please select request and technician");
      return;
    }

    try {
      const response = await fetch(`${API}/api/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceRequest: selectedRequest._id,
          technician: selectedTechnician,
          scheduledDate,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAssignMessage(data.message || "Assignment failed");
        return;
      }

      setAssignMessage("Technician assigned successfully");

      setSelectedRequest(null);
      setSelectedTechnician("");
      setScheduledDate("");
      setPriority("medium");

      loadAdminData();
    } catch {
      setAssignMessage("Unable to assign technician");
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(
        `${API}/api/service-requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Status update failed");
        return;
      }

      alert(`Request status updated to ${newStatus}`);

      loadMyRequests();
    } catch {
      alert("Unable to update request status");
    }
  };

  useEffect(() => {
    if (!loggedIn || !token) return;

    const role = String(user?.role || "").toLowerCase();

    if (role === "admin" || role === "dispatcher") {
      loadAdminData();
    } else {
      loadMyRequests();
    }
  }, [loggedIn, token, user]);

  if (showHome && !loggedIn) {
    return (
      <div className="home-page">
        <div className="home-container">
          <h1>Electrical & Plumbing Service</h1>
          <h2>Home Service Web Application</h2>

          <p>
            Professional Electrical and Plumbing services
            at your doorstep.
          </p>

          <p>
            Book a service easily and get trusted technicians
            for your home.
          </p>

          <button onClick={() => setShowHome(false)}>
            Login / Register
          </button>

          <h2>Our Services</h2>

          <div className="services">
            <div className="card">
              <h3>⚡ Electrical Services</h3>
              <p>Electrical repair and maintenance services.</p>
            </div>

            <div className="card">
              <h3>🔧 Plumbing Services</h3>
              <p>Plumbing repair and home maintenance services.</p>
            </div>

            <div className="card">
              <h3>🏠 Home Maintenance</h3>
              <p>Reliable home service at your convenience.</p>
            </div>
          </div>

          <p>Fast, reliable and convenient home services.</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-box">

          <button onClick={() => setShowHome(true)}>
            ← Back to Home
          </button>

          <h1>Electrical & Plumbing</h1>
          <p>Home Service Web Application</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Login</button>
          </form>

          {message && (
            <p className="message">{message}</p>
          )}
        </div>
      </div>
    );
  }

  const role = String(user?.role || "").toLowerCase();

  const isAdmin =
    role === "admin" || role === "dispatcher";

  const isTechnician = role === "technician";

  const assignedRequests = myRequests.filter(
    (request) =>
      request.status === "assigned" ||
      request.status === "in-progress"
  );

  const completedRequests = myRequests.filter(
    (request) => request.status === "completed"
  );

  return (
    <div className="app">

      <header className="topbar">
        <div>
          <h1>Electrical & Plumbing Service</h1>
          <p>Home Service Web Application</p>
        </div>

        <div className="user-area">
          <span>
            Welcome,{" "}
            {user?.name ||
              user?.username ||
              user?.email ||
              "User"}
          </span>

          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="dashboard">

        <section className="welcome-card">
          <h2>
            {isAdmin
              ? "Admin Dashboard"
              : isTechnician
              ? "Technician Dashboard"
              : "Customer Dashboard"}
          </h2>

          <p>
            Role: {user?.role || "Customer"}
          </p>
        </section>

        {isAdmin ? (
          <>
            <section className="cards">

              <div className="card">
                <h3>Service Requests</h3>
                <strong>{adminRequests.length}</strong>
              </div>

              <div className="card">
                <h3>Technicians</h3>
                <strong>{technicians.length}</strong>
              </div>

              <div className="card">
                <h3>Reports</h3>
                <strong>View</strong>
              </div>

            </section>

            <section className="dashboard-section">
              <h2>Service Requests</h2>

              {adminRequests.length === 0 ? (
                <p>No service requests found.</p>
              ) : (
                <div className="request-list">

                  {adminRequests.map((request) => (
                    <div
                      className="request-card"
                      key={request._id}
                    >

                      <h3>
                        {request.serviceType ||
                          "Service Request"}
                      </h3>

                      <p>
                        <strong>Description:</strong>{" "}
                        {request.description || "N/A"}
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {request.address || "N/A"}
                      </p>

                      <p>
                        <strong>Date:</strong>{" "}
                        {request.preferredDate || "N/A"}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {request.status || "Pending"}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAssignMessage("");
                          setSelectedTechnician("");
                          setScheduledDate("");
                          setPriority("medium");
                        }}
                      >
                        Assign Technician
                      </button>

                    </div>
                  ))}

                </div>
              )}
            </section>

            {selectedRequest && (
              <section className="dashboard-section">

                <h2>Assign Technician</h2>

                <p>
                  Request:{" "}
                  <strong>
                    {selectedRequest.serviceType ||
                      "Service Request"}
                  </strong>
                </p>

                <form onSubmit={assignTechnician}>

                  <select
                    value={selectedTechnician}
                    onChange={(e) =>
                      setSelectedTechnician(e.target.value)
                    }
                    required
                  >
                    <option value="">
                      Select Technician
                    </option>

                    {technicians.map((technician) => {

                      const techId =
                        technician.user?._id ||
                        technician._id;

                      const techName =
                        technician.user?.name ||
                        technician.name ||
                        technician.user?.email ||
                        "Technician";

                      return (
                        <option
                          key={techId}
                          value={techId}
                        >
                          {techName}
                        </option>
                      );
                    })}

                  </select>

                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) =>
                      setScheduledDate(e.target.value)
                    }
                    required
                  />

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value)
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  <button type="submit">
                    Assign Technician
                  </button>

                </form>

                {assignMessage && (
                  <p className="message">
                    {assignMessage}
                  </p>
                )}

              </section>
            )}
          </>
        ) : isTechnician ? (
          <>
            <section className="cards">

              <div className="card">
                <h3>Assigned Requests</h3>
                <strong>
                  {assignedRequests.length}
                </strong>
              </div>

              <div className="card">
                <h3>Upcoming Visit</h3>
                <strong>--</strong>
              </div>

              <div className="card">
                <h3>Completed</h3>
                <strong>
                  {completedRequests.length}
                </strong>
              </div>

            </section>

            <section className="dashboard-section">

              <h2>Assigned Service Requests</h2>

              {assignedRequests.length === 0 ? (
                <p>No assigned service requests.</p>
              ) : (
                <div className="request-list">

                  {assignedRequests.map((request) => (
                    <div
                      className="request-card"
                      key={request._id}
                    >

                      <h3>
                        {request.serviceType ||
                          "Service Request"}
                      </h3>

                      <p>
                        <strong>Description:</strong>{" "}
                        {request.description || "N/A"}
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {request.address || "N/A"}
                      </p>

                      <p>
                        <strong>Preferred Date:</strong>{" "}
                        {request.preferredDate || "N/A"}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {request.status || "Pending"}
                      </p>

                      {request.status === "assigned" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRequestStatus(
                              request._id,
                              "in-progress"
                            )
                          }
                        >
                          Start Work
                        </button>
                      )}

                      {request.status === "in-progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateRequestStatus(
                              request._id,
                              "completed"
                            )
                          }
                        >
                          Mark Completed
                        </button>
                      )}

                    </div>
                  ))}

                </div>
              )}

            </section>
          </>
        ) : (
          <>
            <section className="cards">

              <div className="card">
                <h3>My Requests</h3>
                <strong>{myRequests.length}</strong>
              </div>

              <div className="card">
                <h3>Upcoming Visit</h3>
                <strong>--</strong>
              </div>

              <div className="card">
                <h3>Invoices</h3>
                <strong>--</strong>
              </div>

            </section>

            <section className="dashboard-section">

              <h2>Request Service</h2>

              <form
                className="service-form"
                onSubmit={handleServiceRequest}
              >

                <label>Service Type</label>

                <select
                  value={serviceType}
                  onChange={(e) =>
                    setServiceType(e.target.value)
                  }
                >
                  <option value="Electrical">
                    Electrical
                  </option>

                  <option value="Plumbing">
                    Plumbing
                  </option>
                </select>

                <label>Problem Description</label>

                <textarea
                  placeholder="Describe your problem"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  required
                />

                <label>Service Address</label>

                <textarea
                  placeholder="Enter service address"
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  required
                />

                <label>Preferred Date</label>

                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) =>
                    setPreferredDate(e.target.value)
                  }
                  required
                />

                <button type="submit">
                  Submit Service Request
                </button>

                {serviceMessage && (
                  <p className="message">
                    {serviceMessage}
                  </p>
                )}

              </form>
            </section>

            <section className="dashboard-section">

              <h2>My Service Requests</h2>

              {myRequests.length === 0 ? (
                <p>No service requests yet.</p>
              ) : (
                <div className="request-list">

                  {myRequests.map((request) => (
                    <div
                      className="request-card"
                      key={request._id}
                    >

                      <h3>
                        {request.serviceType ||
                          "Service Request"}
                      </h3>

                      <p>
                        <strong>Description:</strong>{" "}
                        {request.description || "N/A"}
                      </p>

                      <p>
                        <strong>Address:</strong>{" "}
                        {request.address || "N/A"}
                      </p>

                      <p>
                        <strong>Preferred Date:</strong>{" "}
                        {request.preferredDate || "N/A"}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {request.status || "Pending"}
                      </p>

                    </div>
                  ))}

                </div>
              )}

            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default App;