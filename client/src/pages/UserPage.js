import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard";
import CertificateCard from "../components/CertificateCard";

function UserPage({
  courses,
  purchasedCourseIds,
  userCertificateCodes,
  userProfile,
  userCertificates,
  certificate,
  onBuyCourse,
  onUpdateProfile,
  onVerifyCertificate,
  searchCertCode,
  setSearchCertCode,
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const purchasedCourses = courses.filter((course) =>
    purchasedCourseIds.map(String).includes(String(course.id))
  );

  useEffect(() => {
    if (!userProfile) {
      return;
    }

    setFullName(userProfile.fullName || "");
    setEmail(userProfile.email || "");
    setPhone(userProfile.phone || "");
    setPassword(userProfile.password || "");
    setAvatarUrl(userProfile.avatarUrl || "");
    setAvatarName("");
  }, [userProfile]);

  async function handleUpdateProfile() {
    if (!fullName || !email || !phone) {
      alert("Vui lòng nhập đầy đủ thông tin cá nhân");
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateProfile({
        fullName,
        email,
        phone,
        password,
        avatarUrl,
      });
    } finally {
      setIsUpdating(false);
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

  function handleExportCertificatePdf(item) {
    const issueDate = new Date(Number(item[4]) * 1000).toLocaleString();
    const popup = window.open("", "_blank", "width=1200,height=820");

    if (!popup) {
      alert("Trình duyệt đã chặn cửa sổ xuất PDF");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Certificate ${escapeHtml(item[0])}</title>
          <style>
            * { box-sizing: border-box; }
            @page {
              size: A4 landscape;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 28px;
              font-family: "Segoe UI", Arial, sans-serif;
              background: #e8eef7;
              color: #0f172a;
            }
            .certificate {
              width: 1123px;
              min-height: 794px;
              margin: 0 auto;
              padding: 44px;
              position: relative;
              overflow: hidden;
              background:
                radial-gradient(circle at 18% 18%, rgba(21, 94, 239, 0.12), transparent 28%),
                radial-gradient(circle at 84% 12%, rgba(18, 161, 80, 0.10), transparent 26%),
                linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
              border: 1px solid #d6e1ef;
              box-shadow: 0 24px 80px rgba(15, 23, 42, 0.18);
              text-align: center;
            }
            .certificate::before {
              content: "";
              position: absolute;
              inset: 22px;
              border: 8px solid #155eef;
              pointer-events: none;
            }
            .certificate::after {
              content: "";
              position: absolute;
              inset: 38px;
              border: 2px solid #f59e0b;
              pointer-events: none;
            }
            .watermark {
              position: absolute;
              inset: 0;
              display: grid;
              place-items: center;
              font-size: 132px;
              font-weight: 900;
              color: rgba(21, 94, 239, 0.045);
              transform: rotate(-18deg);
              letter-spacing: 8px;
              user-select: none;
            }
            .content {
              position: relative;
              z-index: 1;
              min-height: 706px;
              padding: 28px 42px 18px;
              display: flex;
              flex-direction: column;
            }
            .topline {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 24px;
              margin-bottom: 34px;
              text-align: left;
            }
            .brand {
              color: #155eef;
              font-size: 28px;
              font-weight: 900;
              letter-spacing: 0;
            }
            .brand small {
              display: block;
              margin-top: 6px;
              color: #64748b;
              font-size: 13px;
              font-weight: 700;
            }
            .cert-id {
              padding: 10px 14px;
              border-radius: 999px;
              background: #eef4ff;
              color: #155eef;
              border: 1px solid #d8e6ff;
              font-weight: 800;
              font-size: 13px;
              word-break: break-all;
            }
            h1 {
              font-size: 52px;
              line-height: 1.06;
              margin: 0 0 10px;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .subtitle {
              color: #64748b;
              font-size: 17px;
              margin-bottom: 30px;
            }
            .presented {
              color: #475569;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .student {
              display: inline-block;
              min-width: 520px;
              max-width: 760px;
              margin: 0 auto 14px;
              padding: 0 22px 12px;
              border-bottom: 3px solid #155eef;
              font-size: 46px;
              line-height: 1.15;
              font-weight: 900;
              color: #155eef;
              word-break: break-word;
            }
            .course {
              max-width: 780px;
              margin: 0 auto 26px;
              font-size: 25px;
              line-height: 1.35;
              font-weight: 800;
              color: #111827;
            }
            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              text-align: left;
              margin: 8px auto 24px;
              width: min(790px, 100%);
              font-size: 14px;
            }
            .detail {
              border: 1px solid #dce6f3;
              border-radius: 14px;
              padding: 13px 15px;
              background: rgba(255, 255, 255, 0.78);
              word-break: break-all;
            }
            .detail span {
              display: block;
              color: #64748b;
              font-size: 12px;
              font-weight: 800;
              margin-bottom: 6px;
              text-transform: uppercase;
            }
            .valid {
              display: inline-block;
              margin: 0 auto;
              padding: 10px 18px;
              border-radius: 999px;
              background: #dcfce7;
              color: #166534;
              font-weight: 800;
              border: 1px solid #bbf7d0;
            }
            .footer {
              margin-top: auto;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 36px;
              align-items: end;
              text-align: left;
              color: #475569;
              font-size: 13px;
            }
            .signature {
              text-align: right;
            }
            .signature-line {
              display: inline-block;
              min-width: 220px;
              border-top: 2px solid #0f172a;
              padding-top: 10px;
              color: #0f172a;
              font-weight: 850;
            }
            .verify {
              line-height: 1.55;
            }
            .verify strong {
              display: block;
              color: #0f172a;
            }
            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }
              .certificate {
                box-shadow: none;
                margin: 0;
                width: 297mm;
                min-height: 210mm;
              }
            }
          </style>
        </head>
        <body>
          <main class="certificate">
            <div class="watermark">CERTIFIED</div>
            <div class="content">
              <div class="topline">
                <div class="brand">
                  EduCert Chain
                  <small>Blockchain Course Certification</small>
                </div>
                <div class="cert-id">Certificate ID: ${escapeHtml(item[0])}</div>
              </div>

              <h1>Certificate of Completion</h1>
              <div class="subtitle">Chứng chỉ hoàn thành khóa học được xác minh trên blockchain</div>
              <div class="presented">This certificate is proudly presented to</div>
              <div class="student">${escapeHtml(item[1])}</div>
              <div class="course">for successfully completing <br />${escapeHtml(item[2])}</div>

              <section class="details">
                <div class="detail">
                  <span>Mã chứng chỉ</span>
                  ${escapeHtml(item[0])}
                </div>
                <div class="detail">
                  <span>Ngày cấp</span>
                  ${escapeHtml(issueDate)}
                </div>
                <div class="detail">
                  <span>Địa chỉ ví học viên</span>
                  ${escapeHtml(item[3])}
                </div>
                <div class="detail">
                  <span>Trạng thái xác minh</span>
                  ${item[5] ? "Hợp lệ" : "Không hợp lệ"}
                </div>
              </section>

              <div class="valid">${item[5] ? "Chứng chỉ hợp lệ" : "Chứng chỉ không hợp lệ"}</div>

              <div class="footer">
                <div class="verify">
                  <strong>Blockchain Verification</strong>
                  Certificate data is stored and verifiable through EduCert Chain.
                </div>
                <div class="signature">
                  <span class="signature-line">EduCert Chain Administrator</span>
                </div>
              </div>
            </div>
          </main>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return (
    <main className="layout">
      <section className="panel">
        <div className="section-title">
          <span>👤</span>
          <h2>Thông tin người dùng</h2>
        </div>

        <div className="profile-shell">
          <aside className="profile-summary">
            <div className="profile-cover"></div>
            <div className="profile-avatar profile-avatar-large">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Ảnh đại diện" />
              ) : (
                <span>{(fullName || email || "U").slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <div className="profile-identity">
              <span>Hồ sơ học viên</span>
              <h3>{fullName || "Chưa cập nhật tên"}</h3>
              <p>{email || "Chưa có email"}</p>
            </div>

            <div className="profile-wallet">
              <span>Ví MetaMask</span>
              <strong>{userProfile?.walletAddress || "Chưa kết nối ví"}</strong>
            </div>

            <label className="file-upload">
              <span>{avatarName || "Cập nhật ảnh đại diện"}</span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </aside>

          <div className="profile-form-card">
            <div className="profile-form-head">
              <div>
                <span>Thông tin cá nhân</span>
                <h3>Cập nhật hồ sơ</h3>
              </div>
              <small>{userProfile?.exists ? "Đã đăng ký" : "Chưa đăng ký"}</small>
            </div>

            <div className="form-grid profile-grid">
              <label className="field-block">
                <span>Họ tên</span>
                <input
                  placeholder="Nhập họ tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Email</span>
                <input
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Số điện thoại</span>
                <input
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="field-block">
                <span>Mật khẩu</span>
                <input
                  placeholder="Mật khẩu mới nếu muốn đổi"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>

            <button
              className="primary-btn profile-save-btn"
              onClick={handleUpdateProfile}
              disabled={isUpdating || !userProfile?.exists}
            >
              {isUpdating ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </button>
          </div>
        </div>

        {!userProfile?.exists && (
          <p className="empty-text profile-note">
            Tài khoản này chưa đăng ký thông tin học viên.
          </p>
        )}
      </section>

      <section className="panel">
        <div className="section-title">
          <span>🧑‍🏫</span>
          <h2>Danh sách khóa học</h2>
        </div>

        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} onBuy={onBuyCourse} />
          ))}
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-title">
            <span>📚</span>
            <h2>Khóa học đã mua</h2>
          </div>

          {purchasedCourses.length > 0 ? (
            <div className="course-grid compact-course-grid">
              {purchasedCourses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </div>
          ) : (
            <p className="empty-text">Bạn chưa mua khóa học nào.</p>
          )}
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

          <CertificateCard
            certificate={certificate}
            onExportPdf={handleExportCertificatePdf}
          />

          {userCertificateCodes.length > 0 && (
            <div className="certificate-list">
              <h3>Chứng chỉ đã cấp</h3>
              {userCertificateCodes.map((code) => (
                <button
                  className="certificate-code"
                  key={code}
                  onClick={() => onVerifyCertificate(code)}
                >
                  {code}
                </button>
              ))}
            </div>
          )}

          {userCertificates.length > 0 && (
            <div className="certificate-list">
              <h3>Chi tiết chứng chỉ của bạn</h3>
              <div className="certificate-grid">
                {userCertificates.map((item) => (
                  <CertificateCard
                    certificate={item}
                    key={item[0]}
                    onExportPdf={handleExportCertificatePdf}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default UserPage;
