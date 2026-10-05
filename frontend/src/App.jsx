import { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    alert("Login button clicked");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.icon}>⚡ 🔧</div>

        <h1 style={styles.title}>
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
            style={styles.button}
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

  icon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  title: {
    margin: "0",
    fontSize: "27px",
  },

  subtitle: {
    margin: "5px 0 20px",
    fontSize: "21px",
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

  button: {
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
};

export default App;