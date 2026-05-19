import { useState } from "react";

function Login({ account, onLogin, onNavigate, error, isLoading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    onLogin({
      email,
      password,
    });
  }

  return (
    <main className="layout">
      <section className="panel auth-panel">
        <div className="section-title">
          <span>🔐</span>
          <h2>Đăng nhập</h2>
        </div>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="auth-actions">
          <button
            className="primary-btn"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <button
            className="secondary-btn"
            onClick={() => onNavigate("register")}
            disabled={isLoading}
          >
            Đăng ký
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {account && (
          <div className="wallet-note">
            <p>Ví đã kết nối</p>
            <strong>{account}</strong>
          </div>
        )}
      </section>
    </main>
  );
}

export default Login;
