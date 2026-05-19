import { useState } from "react";
import Web3 from "web3";
import CertificateCard from "../components/CertificateCard";
import CourseCard from "../components/CourseCard";

function AdminPage({
  certificate,
  courses,
  adminData,
  onAddCourse,
  onDeleteCourse,
  onIssueCertificate,
  onVerifyCertificate,
}) {
  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [price, setPrice] = useState("");
  const [certCode, setCertCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [courseCert, setCourseCert] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [searchCertCode, setSearchCertCode] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  async function handleAddCourse() {
    if (imageUrl && imageUrl.length > 120000) {
      alert("Ảnh vẫn còn quá lớn. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }

    await onAddCourse({
      name: courseName,
      description,
      imageUrl,
      price,
    });

    setCourseName("");
    setDescription("");
    setImageUrl("");
    setImageName("");
    setPrice("");
  }

  async function handleCourseImageChange(event) {
    const file = event.target.files[0];

    if (!file) {
      setImageUrl("");
      setImageName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh");
      return;
    }

    const imageDataUrl = await resizeImage(file);
    setImageUrl(imageDataUrl);
    setImageName(file.name);
  }

  async function handleIssueCertificate() {
    await onIssueCertificate({
      certCode,
      studentName,
      courseName: courseCert,
      studentAddress,
    });

    setCertCode("");
    setStudentName("");
    setCourseCert("");
    setStudentAddress("");
  }

  function handleSelectStudent(userAddress) {
    const profile = adminData.userProfiles.find(
      (item) => item.walletAddress.toLowerCase() === userAddress.toLowerCase()
    );

    setStudentAddress(userAddress);

    if (profile?.fullName) {
      setStudentName(profile.fullName);
    }
  }

  function getCourseName(courseId) {
    const course = courses.find((item) => String(item.id) === String(courseId));
    return course ? course.name : `Khóa học #${courseId}`;
  }

  function getBuyerWallet(sale) {
    return sale.buyer || sale.buyerWallet || "";
  }

  function getSaleCourseId(sale) {
    return sale.courseId || sale.blockchainCourseId;
  }

  function getSalePrice(sale) {
    return sale.price || sale.priceWei || "0";
  }

  function getSaleDate(sale) {
    if (sale.purchaseDate) {
      const numericDate = Number(sale.purchaseDate);

      if (!Number.isNaN(numericDate)) {
        return new Date(numericDate * 1000).toLocaleString();
      }

      return new Date(sale.purchaseDate).toLocaleString();
    }

    return formatDate(sale.createdAt);
  }

  function getPurchasedCoursesForUser(userWallet) {
    return adminData.sales.filter(
      (sale) => getBuyerWallet(sale).toLowerCase() === userWallet.toLowerCase()
    );
  }

  function getTotalRevenue() {
    const totalWei = adminData.sales.reduce(
      (total, sale) => total + window.BigInt(getSalePrice(sale)),
      window.BigInt(0)
    );

    return Web3.utils.fromWei(totalWei.toString(), "ether");
  }

  function getCircleStyle() {
    const saleCount = adminData.sales.length;
    const certificateCount = adminData.certificates.length;
    const userCount = adminData.users.length;
    const total = saleCount + certificateCount + userCount;

    if (total === 0) {
      return {
        "--sales-end": "0%",
        "--certificates-end": "0%",
      };
    }

    const salesEnd = (saleCount / total) * 100;
    const certificatesEnd = salesEnd + (certificateCount / total) * 100;

    return {
      "--sales-end": `${salesEnd}%`,
      "--certificates-end": `${certificatesEnd}%`,
    };
  }

  function formatDate(value) {
    if (!value) {
      return "Chưa có dữ liệu";
    }

    return new Date(value).toLocaleString();
  }

  function handleToggleUserDetail(profile) {
    if (selectedUser?.walletAddress === profile.walletAddress) {
      setSelectedUser(null);
      return;
    }

    setSelectedUser(profile);
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxWidth = 220;
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.45));
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
      <section className="panel finance-panel">
        <div className="section-title">
          <span>💎</span>
          <h2>Tổng quan doanh thu</h2>
        </div>

        <div className="finance-overview">
          <div className="revenue-circle" style={getCircleStyle()} />

          <div className="finance-metrics">
            <div className="metric-revenue">
              <span>Doanh thu ETH</span>
              <strong>{getTotalRevenue()}</strong>
            </div>
            <div className="metric-sales">
              <span>Lượt bán khóa học</span>
              <strong>{adminData.sales.length}</strong>
            </div>
            <div className="metric-certificates">
              <span>Chứng chỉ đã cấp</span>
              <strong>{adminData.certificates.length}</strong>
            </div>
            <div className="metric-users">
              <span>Học viên</span>
              <strong>{adminData.users.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <span>📚</span>
          <h2>Thêm khóa học</h2>
        </div>

        <div className="form-grid">
          <input
            placeholder="Tên khóa học"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
          />

          <textarea
            placeholder="Mô tả khóa học"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="file-upload">
            <span>{imageName || "Chọn ảnh khóa học"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCourseImageChange}
            />
          </label>

          <input
            placeholder="Giá ETH"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        {imageUrl && (
          <div className="course-image-preview">
            <img src={imageUrl} alt="Xem trước khóa học" />
          </div>
        )}

        <button className="primary-btn" onClick={handleAddCourse}>
          + Thêm khóa học
        </button>
      </section>

      <section className="panel">
        <div className="section-title">
          <span>🧑‍🏫</span>
          <h2>Danh sách khóa học đang có</h2>
        </div>

        {courses.length > 0 ? (
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard
                course={course}
                key={course.id}
                onDelete={onDeleteCourse}
              />
            ))}
          </div>
        ) : (
          <p className="empty-text">Chưa có khóa học nào.</p>
        )}
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-title">
            <span>📜</span>
            <h2>Cấp chứng chỉ</h2>
          </div>

          <input
            placeholder="Mã chứng chỉ, ví dụ: BC001"
            value={certCode}
            onChange={(e) => setCertCode(e.target.value)}
          />

          <select
            value={studentAddress}
            onChange={(e) => handleSelectStudent(e.target.value)}
          >
            <option value="">Chọn học viên đã đăng ký</option>
            {adminData.userProfiles.map((profile) => (
              <option value={profile.walletAddress} key={profile.walletAddress}>
                {profile.fullName || profile.walletAddress}
              </option>
            ))}
          </select>

          <input
            placeholder="Tên học viên"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />

          <input
            placeholder="Tên khóa học"
            value={courseCert}
            onChange={(e) => setCourseCert(e.target.value)}
          />

          <input
            placeholder="Địa chỉ ví học viên"
            value={studentAddress}
            onChange={(e) => setStudentAddress(e.target.value)}
          />

          <button className="primary-btn" onClick={handleIssueCertificate}>
            Cấp chứng chỉ
          </button>
        </div>

        <div className="panel">
          <div className="section-title">
            <span>🔍</span>
            <h2>Tra cứu chứng chỉ</h2>
          </div>

          <input
            placeholder="Nhập mã chứng chỉ, ví dụ: BC001"
            value={searchCertCode}
            onChange={(e) => setSearchCertCode(e.target.value)}
          />

          <button
            className="primary-btn"
            onClick={() => onVerifyCertificate(searchCertCode)}
          >
            Tra cứu
          </button>

          <CertificateCard certificate={certificate} />
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-title">
            <span>👥</span>
            <h2>Danh sách người dùng</h2>
          </div>

          {adminData.users.length > 0 ? (
            <div className="data-list people-list">
              {adminData.userProfiles.map((profile) => (
                <button
                  className={
                    selectedUser?.walletAddress === profile.walletAddress
                      ? "data-row user-row selected"
                      : "data-row user-row"
                  }
                  key={profile.walletAddress}
                  type="button"
                  onClick={() => handleToggleUserDetail(profile)}
                >
                  <div className="row-avatar">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName || "Học viên"} />
                    ) : (
                      (profile.fullName || profile.walletAddress)
                        .slice(0, 1)
                        .toUpperCase()
                    )}
                  </div>

                  <div className="row-main">
                    <div className="row-heading">
                      <strong>{profile.fullName || "Chưa có tên"}</strong>
                      <span>Học viên</span>
                    </div>

                    <p>{profile.walletAddress}</p>

                    <div className="row-meta">
                      <small>{profile.email || "Chưa có email"}</small>
                      <small>{profile.phone || "Chưa có số điện thoại"}</small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="empty-text">Chưa có người dùng nào.</p>
          )}

          {selectedUser && (
            <div className="user-detail-card">
              <div className="user-detail-header">
                <div className="user-detail-avatar">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt={selectedUser.fullName || "Học viên"} />
                  ) : (
                    <span>
                      {(selectedUser.fullName || selectedUser.walletAddress)
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <span className="detail-kicker">Hồ sơ học viên</span>
                  <h3>{selectedUser.fullName || "Chưa có tên"}</h3>
                  <p>{selectedUser.email || "Chưa có email"}</p>
                </div>
              </div>

              <div className="user-detail-grid">
                <div>
                  <span>Số điện thoại</span>
                  <strong>{selectedUser.phone || "Chưa có số điện thoại"}</strong>
                </div>
                <div>
                  <span>Ngày đăng ký</span>
                  <strong>{formatDate(selectedUser.createdAt)}</strong>
                </div>
                <div>
                  <span>Cập nhật gần nhất</span>
                  <strong>{formatDate(selectedUser.updatedAt)}</strong>
                </div>
                <div>
                  <span>Vai trò</span>
                  <strong>Học viên</strong>
                </div>
              </div>

              <div className="wallet-detail">
                <span>Địa chỉ ví</span>
                <strong>{selectedUser.walletAddress}</strong>
              </div>

              <div className="user-purchases">
                <div className="user-purchases-title">
                  <span>Khóa học đã mua</span>
                  <strong>
                    {getPurchasedCoursesForUser(selectedUser.walletAddress).length}
                  </strong>
                </div>

                {getPurchasedCoursesForUser(selectedUser.walletAddress).length >
                0 ? (
                  <div className="purchase-list">
                    {getPurchasedCoursesForUser(selectedUser.walletAddress).map(
                      (sale, index) => {
                        const courseId = getSaleCourseId(sale);
                        const price = getSalePrice(sale);

                        return (
                          <div
                            className="purchase-item"
                            key={`${getBuyerWallet(sale)}-${courseId}-${index}`}
                          >
                            <div>
                              <strong>{getCourseName(courseId)}</strong>
                              <span>Mã khóa học #{String(courseId)}</span>
                            </div>
                            <div>
                              <strong>
                                {Web3.utils.fromWei(String(price), "ether")} ETH
                              </strong>
                              <span>{getSaleDate(sale)}</span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p className="empty-text">Học viên này chưa mua khóa học nào.</p>
                )}
              </div>

              <button
                className="secondary-btn"
                type="button"
                onClick={() => handleSelectStudent(selectedUser.walletAddress)}
              >
                Chọn để cấp chứng chỉ
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="section-title">
            <span>💰</span>
            <h2>Danh sách khóa học đã bán</h2>
          </div>

          {adminData.sales.length > 0 ? (
            <div className="data-list sales-list">
              {adminData.sales.map((sale, index) => (
                <div className="data-row sale-row" key={`${getBuyerWallet(sale)}-${index}`}>
                  <div className="row-avatar sale-avatar">₿</div>

                  <div className="row-main">
                    <div className="row-heading">
                      <strong>{getCourseName(getSaleCourseId(sale))}</strong>
                      <span>{Web3.utils.fromWei(String(getSalePrice(sale)), "ether")} ETH</span>
                    </div>

                    <p>{getBuyerWallet(sale)}</p>

                    <div className="row-meta">
                      <small>{getSaleDate(sale)}</small>
                      <small>Mã khóa học #{String(getSaleCourseId(sale))}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">Chưa bán khóa học nào.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <span>🎓</span>
          <h2>Danh sách chứng chỉ đã được cấp</h2>
        </div>

        {adminData.certificates.length > 0 ? (
          <div className="certificate-grid">
            {adminData.certificates.map((item) => (
              <CertificateCard certificate={item} key={item[0]} />
            ))}
          </div>
        ) : (
          <p className="empty-text">Chưa cấp chứng chỉ nào.</p>
        )}
      </section>
    </main>
  );
}

export default AdminPage;
