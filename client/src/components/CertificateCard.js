function CertificateCard({ certificate, onExportPdf }) {
  if (!certificate) {
    return null;
  }

  return (
    <div className="certificate-card">
      <div className="cert-header">
        <span>🎓</span>
        <h3>Chứng chỉ Blockchain</h3>
      </div>

      <p>
        <b>Mã chứng chỉ:</b> {certificate[0]}
      </p>
      <p>
        <b>Học viên:</b> {certificate[1]}
      </p>
      <p>
        <b>Khóa học:</b> {certificate[2]}
      </p>
      <p>
        <b>Ví:</b> {certificate[3]}
      </p>
      <p>
        <b>Ngày cấp:</b>{" "}
        {new Date(Number(certificate[4]) * 1000).toLocaleString()}
      </p>

      <div className="valid-badge">
        {certificate[5] ? "✅ Hợp lệ" : "❌ Không hợp lệ"}
      </div>

      {onExportPdf && (
        <div className="cert-actions">
          <button className="pdf-btn" onClick={() => onExportPdf(certificate)}>
            Xuất PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default CertificateCard;
