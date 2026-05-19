function Navbar({ currentPage, onNavigate, onLogout, role }) {
  const isAuthPage = currentPage === "login" || currentPage === "register";

  return (
    <nav className="navbar">
      <div className="logo">🎓 EduCert Chain</div>
      <div className="nav-links">
        {isAuthPage ? (
          <>
            <button
              className={
                currentPage === "login" ? "nav-button active" : "nav-button"
              }
              onClick={() => onNavigate("login")}
            >
              Đăng nhập
            </button>
            <button
              className={
                currentPage === "register" ? "nav-button active" : "nav-button"
              }
              onClick={() => onNavigate("register")}
            >
              Đăng ký
            </button>
          </>
        ) : (
          <>
            {role !== "admin" && (
              <button
                className={
                  currentPage === "user" ? "nav-button active" : "nav-button"
                }
                onClick={() => onNavigate("user")}
              >
                Người dùng
              </button>
            )}
            {role === "admin" && (
              <button
                className={
                  currentPage === "admin" ? "nav-button active" : "nav-button"
                }
                onClick={() => onNavigate("admin")}
              >
                Admin
              </button>
            )}
            <button className="nav-button" onClick={onLogout}>
              Đăng xuất
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
