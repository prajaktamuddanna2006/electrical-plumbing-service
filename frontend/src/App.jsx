import { useState } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [customers, setCustomers] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setLoggedIn(true);
      alert("Login successful!");
    } catch (error) {
      console.log(error);
      alert("Backend server is not running");
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/customers"
      );

      const data = await response.json();

      setCustomers(data.customers || []);
    } catch (error) {
      console.log(error);
      alert("Unable to load customers");
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: customerAddress
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add customer");
        return;
      }

      alert("Customer added successfully!");

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");

      loadCustomers();
    } catch (error) {
      console.log(error);
      alert("Unable to connect to backend");
    }
  };

  if (!loggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Electrical & Plumbing</h1>
          <h2>Home Service Software</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (showCustomers) {
    return (
      <div className="app-container">
        <header>
          <h1>Customer Management</h1>

          <button onClick={() => setShowCustomers(false)}>
            Back to Dashboard
          </button>
        </header>

        <div className="customer-section">
          <h2>Add Customer</h2>

          <form onSubmit={handleAddCustomer}>
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Customer Email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              required
            />

            <button type="submit">
              Add Customer
            </button>
          </form>
        </div>

        <div className="customer-section">
          <h2>Customer List</h2>

          <button onClick={loadCustomers}>
            Load Customers
          </button>

          {customers.length === 0 ? (
            <p>No customers found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>Electrical & Plumbing Home Service</h1>

        <button
          onClick={() => {
            localStorage.clear();
            setLoggedIn(false);
          }}
        >
          Logout
        </button>
      </header>

      <div className="welcome">
        <h2>Welcome to Dashboard</h2>
        <p>Manage your Electrical & Plumbing Service</p>
      </div>

      <div className="module-grid">

        <button
          className="module-card"
          onClick={() => {
            setShowCustomers(true);
            loadCustomers();
          }}
        >
          <h3>Customers</h3>
          <p>Manage customer information</p>
        </button>

        <div className="module-card">
          <h3>Technicians</h3>
          <p>Manage technicians</p>
        </div>

        <div className="module-card">
          <h3>Service Requests</h3>
          <p>Manage service requests</p>
        </div>

        <div className="module-card">
          <h3>Assign Jobs</h3>
          <p>Assign jobs to technicians</p>
        </div>

        <div className="module-card">
          <h3>Estimates</h3>
          <p>Manage estimates</p>
        </div>

        <div className="module-card">
          <h3>Work Orders</h3>
          <p>Manage work orders</p>
        </div>

        <div className="module-card">
          <h3>Bills & Payments</h3>
          <p>Manage billing and payments</p>
        </div>

        <div className="module-card">
          <h3>Notifications</h3>
          <p>Manage notifications</p>
        </div>

        <div className="module-card">
          <h3>Reports</h3>
          <p>View reports</p>
        </div>

        <div className="module-card">
          <h3>Service History</h3>
          <p>View service history</p>
        </div>

      </div>
    </div>
  );
}

export default App;