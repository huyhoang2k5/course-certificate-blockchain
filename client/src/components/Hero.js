function Hero({ account, admin, role }) {
  return (
    <section className="hero">
      <div>
        <span className="badge">Ứng dụng Blockchain nội bộ Ganache</span>
        <h1>Bán khóa học trực tuyến và cấp chứng chỉ Blockchain</h1>
        <p>
          EduCert Chain cho phép thêm khóa học, mua khóa học bằng ETH giả lập,
          cấp chứng chỉ và xác minh chứng chỉ trực tiếp trên Blockchain.
        </p>
      </div>

      <div className="wallet-card">
        <p>Ví MetaMask đang kết nối</p>
        <strong>{account || "Chưa kết nối ví"}</strong>
        {role && (
          <span className="role-badge">
            {role === "admin" ? "Tài khoản admin" : "Tài khoản người dùng"}
          </span>
        )}
        {admin && <small>Admin contract: {admin}</small>}
      </div>
    </section>
  );
}

export default Hero;
