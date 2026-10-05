import { useState } from "react";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login successful!");

      setLoggedIn(true);
    } catch (error) {
      alert("Unable to connect to server");
    }
  };

  // DASHBOARD
  if (loggedIn) {
    return (
      <div style={styles.dashboard}>

        <div style={styles.header}>
          <h1>Electrical & Plumbing</h1>
          <p>Home Service Management System</p>
        </div>

        <h2 style={styles.heading}>
          Dashboard
        </h2>

        <div style={styles.welcomeBox}>
          <h2>Welcome to Electrical & Plumbing Home Service</h2>
          <p>
            Manage customers, technicians, service requests and
            other services from one place.
          </p>
        </div>

        <div style={styles.grid}>

          <div style={styles.box}>
            <div style={styles.icon}>👥</div>
            <h3>Customers</h3>
            <p>Manage customers</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>🔧</div>
            <h3>Technicians</h3>
            <p>Manage technicians</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>📋</div>
            <h3>Service Requests</h3>
            <p>View service requests</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>🧰</div>
            <h3>Assign Jobs</h3>
            <p>Assign jobs to technicians</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>📝</div>
            <h3>Estimates</h3>
            <p>Manage estimates</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>🛠️</div>
            <h3>Work Orders</h3>
            <p>Manage work orders</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>💰</div>
            <h3>Bills & Payments</h3>
            <p>Manage payments</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>🔔</div>
            <h3>Notifications</h3>
            <p>View notifications</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>📊</div>
            <h3>Reports</h3>
            <p>View reports</p>
          </div>

          <div style={styles.box}>
            <div style={styles.icon}>📜</div>
            <h3>Service History</h3>
            <p>View completed services</p>
          </div>

        </div>

        <button
          style={styles.logout}
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setLoggedIn(false);
          }}
        >
          Logout
        </button>

      </div>
    );
  }

  // LOGIN PAGE
  return (
    <div style={styles.page}>

      <div style={styles.card}>

        <div style={styles.bigIcon}>
          ⚡ 🔧
        </div>

        <h1>
          Electrical & Plumbing
        </h1>

        <h2 style={styles.subtitle}>
          Home Service
        </h2>

        <p style={styles.welcome}>
          Login to your account
        </p>

        <form onSubmit={handleLogin}>

          <label style={styles.label}>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button
            type="submit"
            style={styles.loginButton}
          >
            Login
          </button>

        </form>

        <p style={styles.footer}>
          Electrical & Plumbing Service Management System
        </p>

      </div>

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f2f4f7",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "420px",
    padding: "40px",
    background: "white",
    borderRadius: "15px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  bigIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  subtitle: {
    fontWeight: "normal",
  },

  welcome: {
    color: "#666",
    marginBottom: "25px",
  },

  label: {
    display: "block",
    textAlign: "left",
    marginBottom: "7px",
    fontWeight: "bold",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "18px",
    border: "1px solid #ccc",
    borderRadius: "7px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  loginButton: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "7px",
    background: "#222",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
  },

  footer: {
    marginTop: "25px",
    fontSize: "12px",
    color: "#888",
  },

  dashboard: {
    minHeight: "100vh",
    padding: "35px",
    background: "#f2f4f7",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "#222",
    color: "white",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
  },

  heading: {
    fontSize: "30px",
    marginBottom: "20px",
  },

  welcomeBox: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "25px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },

  box: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },

  icon: {
    fontSize: "38px",
  },

  logout: {
    marginTop: "30px",
    padding: "12px 30px",
    background: "#c62828",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default App;