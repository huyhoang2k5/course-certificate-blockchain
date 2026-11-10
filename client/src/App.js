import { useEffect, useState } from "react";
import Web3 from "web3";
import "./App.css";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Stats from "./components/Stats";
import AdminPage from "./pages/AdminPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserPage from "./pages/UserPage";
import {
  connectBlockchain,
  createCertificate,
  createCourse,
  findCertificate,
  getAdminData,
  getCertificatesByCodes,
  getCourses,
  getUserCertificateCodes,
  getUserCourseIds,
  purchaseCourse,
  removeCourse,
} from "./services/blockchain";
import {
  deleteCourseApi,
  saveCertificateApi,
  saveCourseApi,
  saveSaleApi,
  getCoursesApi,
  getCertificatesApi,
  getUsersApi,
  getSalesApi,
  loginUserApi,
  registerUserApi,
  updateUserApi,
} from "./services/api";

const SESSION_KEY = "educert_session";

function App() {
  const [account, setAccount] = useState("");
  const [admin, setAdmin] = useState("");
  const [role, setRole] = useState("");
  const [contract, setContract] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseCount, setCourseCount] = useState(0);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState([]);
  const [userCertificateCodes, setUserCertificateCodes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userCertificates, setUserCertificates] = useState([]);
  const [adminData, setAdminData] = useState({
    users: [],
    userProfiles: [],
    certificates: [],
    sales: [],
  });
  const [certificate, setCertificate] = useState(null);
  const [searchCertCode, setSearchCertCode] = useState("");
  const [currentPage, setCurrentPage] = useState("login");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveSession(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user,
        savedAt: Date.now(),
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function restoreSession() {
    const rawSession = localStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return;
    }

    try {
      const session = JSON.parse(rawSession);

      if (!session?.user) {
        clearSession();
        return;
      }

      const blockchain = await loadBlockchain();

      if (!blockchain) {
        return;
      }

      const user = session.user;

      if (
        user.walletAddress &&
        user.walletAddress.toLowerCase() !== blockchain.account.toLowerCase()
      ) {
        clearSession();
        setLoginError(
          "Ví MetaMask hiện tại khác với tài khoản đã lưu. Hãy đăng nhập lại."
        );
        return;
      }

      applyAuthenticatedUser(user, blockchain);
    } catch (error) {
      clearSession();
    }
  }

  async function applyAuthenticatedUser(user, blockchain) {
    if (user.role === "admin") {
      if (blockchain.admin.toLowerCase() !== blockchain.account.toLowerCase()) {
        clearSession();
        setLoginError(
          `Ví đang chọn chưa phải admin của smart contract. Contract admin hiện là ${blockchain.admin}.`
        );
        setCurrentPage("login");
        return false;
      }

      setRole("admin");
      setAdminData(await withDatabaseUsers(blockchain.adminData, "admin"));
      setCurrentPage("admin");
      return true;
    }

    setRole("user");
    setUserProfile({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      walletAddress: user.walletAddress,
      exists: true,
    });
    setCurrentPage("user");
    return true;
  }

  async function loadBlockchain() {
    try {
      setLoginError("");
      const blockchain = await connectBlockchain();

      setAccount(blockchain.account);
      setAdmin(blockchain.admin);
      setRole(blockchain.role);
      setContract(blockchain.contract);
      const mergedCourses = await withDatabaseCourses(blockchain.courses);
      setCourses(mergedCourses);
      setCourseCount(mergedCourses.length);
      setPurchasedCourseIds(blockchain.purchasedCourseIds);
      setUserCertificateCodes(blockchain.certificateCodes);
      setUserProfile(blockchain.userProfile);
      setUserCertificates(blockchain.userCertificates);
      setAdminData(await withDatabaseUsers(blockchain.adminData, blockchain.role));
      return blockchain;
    } catch (error) {
      setLoginError(error.message);
      return null;
    }
  }

  async function connectWalletOnly() {
    if (!window.ethereum) {
      alert("Không tìm thấy MetaMask. Hãy mở app bằng trình duyệt đã cài MetaMask.");
      return null;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts.length) {
      alert("Bạn chưa chọn tài khoản MetaMask.");
      return null;
    }

    setAccount(accounts[0]);
    return {
      account: accounts[0],
    };
  }

  async function handleLogin(credentials) {
    setIsLoggingIn(true);
    const blockchain = await loadBlockchain();
    setIsLoggingIn(false);

    if (blockchain) {
      if (!credentials.email || !credentials.password) {
        setLoginError("Vui lòng nhập email và mật khẩu");
        return;
      }

      try {
        const { user } = await loginUserApi({
          email: credentials.email,
          password: credentials.password,
          walletAddress: blockchain.account,
        });

        if (user.role === "admin") {
          if (user.walletAddress.toLowerCase() !== blockchain.account.toLowerCase()) {
            setLoginError(
              `Tài khoản admin phải dùng đúng ví ${user.walletAddress}. Hãy đổi MetaMask sang ví admin rồi đăng nhập lại.`
            );
            return;
          }

          if (blockchain.admin.toLowerCase() !== blockchain.account.toLowerCase()) {
            setLoginError(
              `Ví đang chọn chưa phải admin của smart contract. Contract admin hiện là ${blockchain.admin}. Hãy chọn đúng ví deploy contract hoặc migrate lại bằng ví admin.`
            );
            return;
          }

          saveSession(user);
          await applyAuthenticatedUser(user, blockchain);
          return;
        }

        saveSession(user);
        await applyAuthenticatedUser(user, blockchain);
      } catch (error) {
        setLoginError(error.message);
        return;
      }
    }
  }

  function handleLogout() {
    clearSession();
    setAccount("");
    setAdmin("");
    setRole("");
    setContract(null);
    setCourses([]);
    setCourseCount(0);
    setPurchasedCourseIds([]);
    setUserCertificateCodes([]);
    setUserProfile(null);
    setUserCertificates([]);
    setAdminData({
      users: [],
      userProfiles: [],
      certificates: [],
      sales: [],
    });
    setCertificate(null);
    setSearchCertCode("");
    setCurrentPage("login");
  }

  async function refreshCourses(activeContract = contract) {
    if (!activeContract) {
      return [];
    }

    const courseList = await withDatabaseCourses(await getCourses(activeContract));
    setCourses(courseList);
    setCourseCount(courseList.length);
    return courseList;
  }

  async function withDatabaseCourses(blockchainCourses) {
    try {
      const { courses: databaseCourses } = await getCoursesApi();
      const databaseCourseMap = new Map(
        databaseCourses.map((course) => [String(course.blockchainCourseId), course])
      );

      const mergedCourses = blockchainCourses.map((course) => {
        const databaseCourse = databaseCourseMap.get(String(course.id));

        if (!databaseCourse) {
          return course;
        }

        return {
          ...course,
          name: databaseCourse.name || course.name,
          description: databaseCourse.description || course.description,
          imageUrl: databaseCourse.imageUrl || course.imageUrl,
        };
      });

      const blockchainCourseIds = new Set(
        blockchainCourses.map((course) => String(course.id))
      );
      const databaseOnlyCourses = databaseCourses
        .filter((course) => !blockchainCourseIds.has(String(course.blockchainCourseId)))
        .map((course) => ({
          id: course.blockchainCourseId,
          name: course.name,
          description: course.description,
          imageUrl: course.imageUrl,
          price: course.priceWei,
          isActive: course.isActive,
          databaseOnly: true,
        }));

      return [...mergedCourses, ...databaseOnlyCourses];
    } catch (error) {
      return blockchainCourses;
    }
  }

  async function refreshUserData(
    activeContract = contract,
    activeAccount = account
  ) {
    if (!activeContract || !activeAccount) {
      return;
    }

    const [courseIds, certificateCodes] = await Promise.all([
      getUserCourseIds(activeContract, activeAccount),
      getUserCertificateCodes(activeContract, activeAccount),
    ]);

    setPurchasedCourseIds(courseIds);
    setUserCertificateCodes(certificateCodes);
    setUserCertificates(
      await getCertificatesByCodes(activeContract, certificateCodes)
    );
  }

  async function refreshAdminData(
    activeContract = contract,
    activeAccount = account
  ) {
    if (!activeContract || !activeAccount || role !== "admin") {
      return;
    }

    setAdminData(await withDatabaseUsers(await getAdminData(activeContract, activeAccount), role));
  }

  async function withDatabaseUsers(nextAdminData, activeRole) {
    if (activeRole !== "admin") {
      return nextAdminData;
    }

    try {
      const { users } = await getUsersApi();
      const { sales } = await getSalesApi();
      const { certificates } = await getCertificatesApi();
      const userProfiles = users
        .filter((user) => user.role !== "admin")
        .map((user) => ({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          walletAddress: user.walletAddress,
          exists: true,
        }));

      return {
        ...nextAdminData,
        users: userProfiles.map((user) => user.walletAddress),
        userProfiles,
        sales,
        certificateCodes: certificates.map((certificate) => certificate.certCode),
        certificates: certificates.map((certificate) => [
          certificate.certCode,
          certificate.studentName,
          certificate.courseName,
          certificate.studentWallet,
          Math.floor(new Date(certificate.issueDate).getTime() / 1000),
          certificate.isValid,
        ]),
      };
    } catch (error) {
      return nextAdminData;
    }
  }

  async function persistDatabase(label, action) {
    try {
      await action();
    } catch (error) {
      console.warn(`Không thể lưu ${label} vào MongoDB`, error);
    }
  }

  async function getCurrentWallet() {
    if (!window.ethereum) {
      return "";
    }

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    return accounts[0] || "";
  }

  async function ensureAdminWallet() {
    const currentWallet = await getCurrentWallet();

    if (!currentWallet || !admin) {
      alert("Chưa kết nối đúng ví admin.");
      return false;
    }

    if (currentWallet.toLowerCase() !== admin.toLowerCase()) {
      alert(
        `Bạn đang chọn ví ${currentWallet}. Hãy đổi MetaMask sang ví admin ${admin} rồi thử lại.`
      );
      return false;
    }

    if (account.toLowerCase() !== currentWallet.toLowerCase()) {
      setAccount(currentWallet);
    }

    return true;
  }

  async function handleAddCourse(course) {
    if (!contract) {
      alert("Chưa kết nối contract");
      return;
    }

    if (!(await ensureAdminWallet())) {
      return;
    }

    try {
      const blockchainCourseId = String(Number(courseCount) + 1);
      const receipt = await createCourse(contract, admin, course);
      await persistDatabase("khóa học", () =>
        saveCourseApi({
          blockchainCourseId,
          name: course.name,
          description: course.description,
          imageUrl: course.imageUrl,
          priceWei: Web3.utils.toWei(course.price, "ether"),
          adminWallet: admin,
          isActive: true,
          txHash: receipt.transactionHash,
        })
      );
      await refreshCourses();
      await refreshAdminData();
      alert("Đã thêm khóa học");
    } catch (error) {
      if (isUserRejectedTransaction(error)) {
        alert("Bạn đã hủy giao dịch thêm khóa học.");
        return;
      }

      alert(error.message || "Không thêm được khóa học. Vui lòng thử lại.");
    }
  }

  async function handleDeleteCourse(courseId) {
    if (!contract) {
      alert("Chưa kết nối contract");
      return;
    }

    if (!(await ensureAdminWallet())) {
      return;
    }

    const isConfirmed = window.confirm("Bạn có chắc muốn xóa khóa học này?");

    if (!isConfirmed) {
      return;
    }

    try {
      const course = courses.find((item) => String(item.id) === String(courseId));

      if (course?.databaseOnly) {
        await deleteCourseApi(courseId);
        await refreshCourses();
        await refreshAdminData();
        alert("Đã xóa khóa học");
        return;
      }

      const receipt = await removeCourse(contract, admin, courseId);
      await persistDatabase("trạng thái xóa khóa học", () =>
        deleteCourseApi(courseId, receipt.transactionHash)
      );
      await refreshCourses();
      await refreshAdminData();
      alert("Đã xóa khóa học");
    } catch (error) {
      if (isUserRejectedTransaction(error)) {
        alert("Bạn đã hủy giao dịch xóa khóa học.");
        return;
      }

      alert(
        "Không xóa được khóa học. Hãy chắc chắn bạn đang dùng ví admin và khóa học còn tồn tại."
      );
    }
  }

  async function handleBuyCourse(id, price) {
    if (!contract) {
      alert("Chưa kết nối contract");
      return;
    }

    try {
      const course = courses.find((item) => String(item.id) === String(id));
      const receipt = await purchaseCourse(contract, account, id, price);
      await persistDatabase("lượt mua khóa học", () =>
        saveSaleApi({
          blockchainCourseId: String(id),
          courseName: course?.name || `Khóa học #${id}`,
          buyerWallet: account,
          buyerName: userProfile?.fullName || "",
          priceWei: String(price),
          purchaseDate: new Date().toISOString(),
          txHash: receipt.transactionHash,
        })
      );
      await refreshUserData();
      await refreshAdminData();
      alert("Mua khóa học thành công");
    } catch (error) {
      if (isUserRejectedTransaction(error)) {
        alert("Bạn đã hủy giao dịch mua khóa học.");
        return;
      }

      alert(error.message || "Không mua được khóa học. Vui lòng thử lại.");
    }
  }

  async function handleIssueCertificate(certificateData) {
    if (!contract) {
      alert("Chưa kết nối contract");
      return;
    }

    if (!(await ensureAdminWallet())) {
      return;
    }

    try {
      const receipt = await createCertificate(contract, admin, certificateData);
      await persistDatabase("chứng chỉ", () =>
        saveCertificateApi({
          certCode: certificateData.certCode,
          studentName: certificateData.studentName,
        studentWallet: certificateData.studentAddress,
        courseName: certificateData.courseName,
        issuerWallet: admin,
        issueDate: new Date().toISOString(),
        isValid: true,
        txHash: receipt.transactionHash,
        })
      );
      await refreshAdminData();
      alert("Cấp chứng chỉ thành công");
    } catch (error) {
      if (isUserRejectedTransaction(error)) {
        alert("Bạn đã hủy giao dịch cấp chứng chỉ.");
        return;
      }

      alert(error.message || "Không cấp được chứng chỉ. Vui lòng thử lại.");
    }
  }

  async function handleVerifyCertificate(certCode) {
    if (!contract) {
      alert("Chưa kết nối contract");
      return;
    }

    const cert = await findCertificate(contract, certCode);
    setCertificate(cert);
  }

  function isUserRejectedTransaction(error) {
    const message = String(error?.message || error || "").toLowerCase();

    return (
      error?.code === 4001 ||
      message.includes("user denied") ||
      message.includes("user rejected") ||
      message.includes("denied transaction signature")
    );
  }

  async function handleRegister(profile) {
    const activeWallet = account
      ? { account }
      : await connectWalletOnly();
    const activeAccount = activeWallet?.account;

    if (!activeAccount) {
      alert("Chưa kết nối MetaMask");
      return false;
    }

    if (profile.walletAddress.toLowerCase() !== activeAccount.toLowerCase()) {
      alert("Địa chỉ ví nhập vào phải trùng với ví MetaMask đang kết nối");
      return false;
    }

    try {
      await registerUserApi({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        password: profile.password,
        avatarUrl: profile.avatarUrl,
        walletAddress: activeAccount,
      });
      alert("Đăng ký thành công. Bạn có thể đăng nhập để vào trang người dùng");
      setCurrentPage("login");
      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  }

  async function handleUpdateProfile(profile) {
    if (!account) {
      alert("Chưa kết nối MetaMask");
      return;
    }

    try {
      const { user } = await updateUserApi(account, profile);
      saveSession(user);
      setUserProfile({
        ...userProfile,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        walletAddress: user.walletAddress,
        exists: true,
      });
      alert("Đã cập nhật thông tin người dùng");
    } catch (error) {
      alert(error.message);
    }
  }

  function renderPage() {
    if (currentPage === "login") {
      return (
        <Login
          account={account}
          onLogin={handleLogin}
          onNavigate={setCurrentPage}
          error={loginError}
          isLoading={isLoggingIn}
        />
      );
    }

    if (currentPage === "register") {
      return (
        <Register
          connectedWallet={account}
          onConnectWallet={connectWalletOnly}
          onNavigate={setCurrentPage}
          onRegister={handleRegister}
        />
      );
    }

    if (currentPage === "admin") {
      if (role !== "admin") {
        return (
          <UserPage
            courses={courses}
            purchasedCourseIds={purchasedCourseIds}
            userCertificateCodes={userCertificateCodes}
            userProfile={userProfile}
            userCertificates={userCertificates}
            certificate={certificate}
            onBuyCourse={handleBuyCourse}
            onUpdateProfile={handleUpdateProfile}
            onVerifyCertificate={handleVerifyCertificate}
            searchCertCode={searchCertCode}
            setSearchCertCode={setSearchCertCode}
          />
        );
      }

      return (
        <AdminPage
          certificate={certificate}
          courses={courses}
          adminData={adminData}
          onAddCourse={handleAddCourse}
          onDeleteCourse={handleDeleteCourse}
          onIssueCertificate={handleIssueCertificate}
          onVerifyCertificate={handleVerifyCertificate}
        />
      );
    }

    return (
      <UserPage
        courses={courses}
        purchasedCourseIds={purchasedCourseIds}
        userCertificateCodes={userCertificateCodes}
        userProfile={userProfile}
        userCertificates={userCertificates}
        certificate={certificate}
        onBuyCourse={handleBuyCourse}
        onUpdateProfile={handleUpdateProfile}
        onVerifyCertificate={handleVerifyCertificate}
        searchCertCode={searchCertCode}
        setSearchCertCode={setSearchCertCode}
      />
    );
  }

  return (
    <div className="app">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        role={role}
      />
      <Hero account={account} admin={admin} role={role} />
      <Stats courseCount={courseCount} />
      {renderPage()}
    </div>
  );
}

export default App;
