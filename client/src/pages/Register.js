import { useEffect, useState } from "react";

function Register({ connectedWallet, onConnectWallet, onNavigate, onRegister }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
    }
  }, [connectedWallet]);

  async function handleUseConnectedWallet() {
    const blockchain = await onConnectWallet();

    if (blockchain?.account) {
      setWalletAddress(blockchain.account);
    }
  }

  async function handleRegister() {
    if (!fullName || !email || !phone || !password || !walletAddress) {
      alert("Vui lòng nhập đầy đủ thông tin đăng ký");
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({
        fullName,
        email,
        phone,
        password,
        avatarUrl,
        walletAddress,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files[0];

    if (!file) {
      setAvatarUrl("");
      setAvatarName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh");
      return;
    }

    const imageDataUrl = await resizeImage(file);
    setAvatarUrl(imageDataUrl);
    setAvatarName(file.name);
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxWidth = 240;
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.55));
        };

        image.onerror = reject;
        image.src = reader.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <main className="layout">
      <section className="panel auth-panel">
        <div className="section-title">
          <span>📝</span>
          <h2>Đăng ký</h2>
        </div>

        <input
          placeholder="Họ tên"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="avatar-editor">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Ảnh đại diện" />
            ) : (
              <span>{(fullName || email || "U").slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <label className="file-upload">
            <span>{avatarName || "Chọn ảnh đại diện"}</span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="wallet-field">
          <input
            placeholder="Địa chỉ ví MetaMask"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <button
            className="secondary-btn"
            type="button"
            onClick={handleUseConnectedWallet}
          >
            Lấy ví MetaMask
          </button>
        </div>

        <div className="auth-actions">
          <button
            className="primary-btn"
            onClick={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng ký..." : "Tạo tài khoản"}
          </button>
          <button className="secondary-btn" onClick={() => onNavigate("login")}>
            Đã có tài khoản
          </button>
        </div>
      </section>
    </main>
  );
}

export default Register;
