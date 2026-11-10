// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CourseCertificate {
    // Vi quan tri he thong va tong so khoa hoc da tao.
    address public admin;
    uint public courseCount;

    // Gan admin khi deploy contract.
    constructor(address _admin) {
        require(_admin != address(0), "Admin address required");
        admin = _admin;
    }

    // Thong tin mot khoa hoc.
    struct Course {
        uint id;
        string name;
        string description;
        string imageUrl;
        uint price;
        bool isActive;
    }

    // Thong tin chung chi duoc cap cho hoc vien.
    struct Certificate {
        string certCode;
        string studentName;
        string courseName;
        address studentAddress;
        uint issueDate;
        bool isValid;
    }

    // Luu lich su mua khoa hoc.
    struct Sale {
        uint courseId;
        address buyer;
        uint price;
        uint purchaseDate;
    }

    // Ho so nguoi dung gan voi dia chi vi.
    struct UserProfile {
        string fullName;
        string email;
        string phone;
        address walletAddress;
        uint registeredAt;
        bool exists;
    }

    // Cac bang du lieu chinh tren blockchain.
    mapping(uint => Course) public courses;
    mapping(string => Certificate) public certificates;
    mapping(address => mapping(uint => bool)) public purchasedCourses;
    mapping(address => uint[]) public userCourses;
    mapping(address => string[]) public userCertificates;
    mapping(address => bool) public isRegisteredUser;
    mapping(address => UserProfile) public userProfiles;
    mapping(string => bool) public certificateExists;

    // Danh sach phuc vu trang admin/thong ke.
    address[] public allUsers;
    string[] public allCertificateCodes;
    Sale[] public sales;

    // Chi admin moi duoc goi cac ham quan tri.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    // Admin them khoa hoc moi.
    function addCourse(
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        uint _price
    ) public onlyAdmin {
        courseCount++;

        courses[courseCount] = Course(
            courseCount,
            _name,
            _description,
            _imageUrl,
            _price,
            true
        );
    }

    // Admin an khoa hoc, khong xoa du lieu cu tren blockchain.
    function deleteCourse(uint _courseId) public onlyAdmin {
        require(courses[_courseId].id != 0, "Course not found");
        courses[_courseId].isActive = false;
    }

    // Nguoi dung dang ky ho so ca nhan.
    function registerUser(
        string memory _fullName,
        string memory _email,
        string memory _phone
    ) public {
        require(bytes(_fullName).length > 0, "Full name required");
        require(bytes(_email).length > 0, "Email required");
        require(bytes(_phone).length > 0, "Phone required");

        _registerUser(msg.sender);

        userProfiles[msg.sender] = UserProfile(
            _fullName,
            _email,
            _phone,
            msg.sender,
            block.timestamp,
            true
        );
    }

    // Nguoi dung cap nhat ho so cua chinh minh.
    function updateMyProfile(
        string memory _fullName,
        string memory _email,
        string memory _phone
    ) public {
        require(userProfiles[msg.sender].exists, "User not registered");
        require(bytes(_fullName).length > 0, "Full name required");
        require(bytes(_email).length > 0, "Email required");
        require(bytes(_phone).length > 0, "Phone required");

        userProfiles[msg.sender].fullName = _fullName;
        userProfiles[msg.sender].email = _email;
        userProfiles[msg.sender].phone = _phone;
    }

    // Nguoi dung mua khoa hoc bang ETH.
    function buyCourse(uint _courseId) public payable {
        Course memory course = courses[_courseId];

        require(course.id != 0, "Course not found");
        require(course.isActive, "Course is inactive");
        require(!purchasedCourses[msg.sender][_courseId], "Already purchased");
        require(msg.value >= course.price, "Not enough ETH");

        _registerUser(msg.sender);

        purchasedCourses[msg.sender][_courseId] = true;
        userCourses[msg.sender].push(_courseId);
        sales.push(Sale(_courseId, msg.sender, msg.value, block.timestamp));

        (bool sent, ) = payable(admin).call{value: msg.value}("");
        require(sent, "Payment transfer failed");
    }

    // Admin cap chung chi cho hoc vien.
    function issueCertificate(
        string memory _certCode,
        string memory _studentName,
        string memory _courseName,
        address _studentAddress
    ) public onlyAdmin {
        require(!certificateExists[_certCode], "Certificate exists");

        _registerUser(_studentAddress);

        certificates[_certCode] = Certificate(
            _certCode,
            _studentName,
            _courseName,
            _studentAddress,
            block.timestamp,
            true
        );

        certificateExists[_certCode] = true;
        userCertificates[_studentAddress].push(_certCode);
        allCertificateCodes.push(_certCode);
    }

    // Tra cuu/xac minh chung chi theo ma.
    function verifyCertificate(
        string memory _certCode
    )
        public
        view
        returns (string memory, string memory, string memory, address, uint, bool)
    {
        Certificate memory cert = certificates[_certCode];

        return (
            cert.certCode,
            cert.studentName,
            cert.courseName,
            cert.studentAddress,
            cert.issueDate,
            cert.isValid
        );
    }

    // Lay danh sach khoa hoc cua vi dang goi ham.
    function getMyCourses() public view returns (uint[] memory) {
        return userCourses[msg.sender];
    }

    // Lay danh sach chung chi cua vi dang goi ham.
    function getMyCertificates() public view returns (string[] memory) {
        return userCertificates[msg.sender];
    }

    // Admin xem tat ca nguoi dung.
    function getAllUsers() public view onlyAdmin returns (address[] memory) {
        return allUsers;
    }

    // Xem ho so cua mot nguoi dung.
    function getUserProfile(
        address _user
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            address,
            uint,
            bool
        )
    {
        UserProfile memory profile = userProfiles[_user];

        return (
            profile.fullName,
            profile.email,
            profile.phone,
            profile.walletAddress,
            profile.registeredAt,
            profile.exists
        );
    }

    // Admin lay tat ca ma chung chi da cap.
    function getAllCertificateCodes()
        public
        view
        onlyAdmin
        returns (string[] memory)
    {
        return allCertificateCodes;
    }

    // Admin xem lich su ban khoa hoc.
    function getAllSales() public view onlyAdmin returns (Sale[] memory) {
        return sales;
    }

    // Dang ky dia chi vi vao danh sach neu chua ton tai.
    function _registerUser(address _user) internal {
        if (!isRegisteredUser[_user]) {
            isRegisteredUser[_user] = true;
            allUsers.push(_user);
        }
    }
}
