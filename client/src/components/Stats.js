import { useState } from "react";

function Stats({ courseCount }) {
  const [activeStat, setActiveStat] = useState("");

  const stats = [
    {
      id: "courses",
      tone: "blue",
      icon: "C",
      value: courseCount,
      label: "Khóa học",
      title: "Khóa học trên hệ thống",
      description:
        "Đây là tổng số khóa học đang được mở bán. Mỗi khóa học có tên, mô tả, học phí ETH và ảnh minh họa để học viên dễ lựa chọn trước khi mua.",
      points: [
        "Xem danh sách khóa học",
        "Mua khóa học bằng ví MetaMask",
        "Theo dõi khóa học đã mua",
      ],
    },
    {
      id: "web3",
      tone: "green",
      icon: "W3",
      value: "Web3",
      label: "Kết nối Blockchain",
      title: "Web3 kết nối Blockchain là gì?",
      description:
        "Web3 cho phép website kết nối trực tiếp với ví MetaMask và smart contract. Khi học viên mua khóa học hoặc admin cấp chứng chỉ, giao dịch được ghi nhận trên blockchain.",
      points: [
        "Kết nối ví MetaMask",
        "Giao dịch qua smart contract",
        "Dữ liệu quan trọng có thể kiểm tra lại",
      ],
    },
    {
      id: "verified",
      tone: "amber",
      icon: "OK",
      value: "100%",
      label: "Xác minh minh bạch",
      title: "Xác minh minh bạch có uy tín không?",
      description:
        "Chứng chỉ được cấp bằng mã chứng chỉ riêng và lưu trên blockchain. Khi tra cứu, hệ thống đối chiếu dữ liệu từ smart contract nên khó bị chỉnh sửa tùy ý.",
      points: [
        "Có mã chứng chỉ riêng",
        "Tra cứu trạng thái hợp lệ",
        "Tăng độ tin cậy khi kiểm chứng",
      ],
    },
  ];

  function toggleStat(id) {
    setActiveStat((current) => (current === id ? "" : id));
  }

  return (
    <section className="stats">
      {stats.map((stat) => (
        <button
          type="button"
          className={`stat-card stat-card-button stat-${stat.tone} ${
            activeStat === stat.id ? "expanded" : ""
          }`}
          key={stat.id}
          onClick={() => toggleStat(stat.id)}
        >
          <span className="stat-main">
            <span className="stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
            <span>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </span>
            <small>{activeStat === stat.id ? "Thu gọn" : "Xem thêm"}</small>
          </span>

          {activeStat === stat.id && (
            <span className="stat-detail">
              <strong>{stat.title}</strong>
              <span>{stat.description}</span>
              <span className="stat-points">
                {stat.points.map((point) => (
                  <em key={point}>{point}</em>
                ))}
              </span>
            </span>
          )}
        </button>
      ))}
    </section>
  );
}

export default Stats;
