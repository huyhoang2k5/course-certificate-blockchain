import { useState } from "react";
import Web3 from "web3";

function CourseCard({ course, onBuy, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  function handleAction(event, action) {
    event.stopPropagation();
    action();
  }

  return (
    <button
      className={isExpanded ? "course-card expanded" : "course-card"}
      type="button"
      onClick={() => setIsExpanded((current) => !current)}
    >
      <div className="course-image">
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.name} />
        ) : (
          <span>📘</span>
        )}
      </div>

      <div className="course-content">
        <div className="course-heading">
          <span className="course-tag">Blockchain</span>
          <span className="course-toggle">
            {isExpanded ? "Thu gọn" : "Chi tiết"}
          </span>
        </div>

        <h3>{course.name}</h3>

        {isExpanded && (
          <div className="course-detail">
            <span>Mô tả khóa học</span>
            <p>{course.description}</p>
          </div>
        )}

        <div className="course-footer">
          <strong>{Web3.utils.fromWei(course.price, "ether")} ETH</strong>

          {onBuy && (
            <button
              className="buy-btn"
              onClick={(event) =>
                handleAction(event, () => onBuy(String(course.id), course.price))
              }
            >
              Mua khóa học
            </button>
          )}

          {onDelete && (
            <button
              className="delete-btn"
              onClick={(event) =>
                handleAction(event, () => onDelete(String(course.id)))
              }
            >
              Xóa
            </button>
          )}
        </div>
      </div>
    </button>
  );
}

export default CourseCard;
