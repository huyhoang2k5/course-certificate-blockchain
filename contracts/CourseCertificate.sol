// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CourseCertificate {
    address public admin;
    uint public courseCount;

    constructor(address _admin) {
        require(_admin != address(0), "Admin address required");
        admin = _admin;
    }

    struct Course {
        uint id;
        string name;
        string description;
        string imageUrl;
        uint price;
        bool isActive;
    }

    struct Certificate {
        string certCode;
        string studentName;
        string courseName;
        address studentAddress;
        uint issueDate;
        bool isValid;
    }

    struct Sale {
        uint courseId;
        address buyer;
        uint price;
        uint purchaseDate;
    }

    struct UserProfile {
        string fullName;
        string email;
        string phone;
        address walletAddress;
        uint registeredAt;
        bool exists;
    }

    mapping(uint => Course) public courses;
    mapping(string => Certificate) public certificates;
    mapping(address => mapping(uint => bool)) public purchasedCourses;
    mapping(address => uint[]) public userCourses;
    mapping(address => string[]) public userCertificates;
    mapping(address => bool) public isRegisteredUser;
    mapping(address => UserProfile) public userProfiles;
    mapping(string => bool) public certificateExists;

    address[] public allUsers;
    string[] public allCertificateCodes;
    Sale[] public sales;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

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

    function deleteCourse(uint _courseId) public onlyAdmin {
        require(courses[_courseId].id != 0, "Course not found");
        courses[_courseId].isActive = false;
    }

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

    function getMyCourses() public view returns (uint[] memory) {
        return userCourses[msg.sender];
    }

    function getMyCertificates() public view returns (string[] memory) {
        return userCertificates[msg.sender];
    }

    function getAllUsers() public view onlyAdmin returns (address[] memory) {
        return allUsers;
    }

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

    function getAllCertificateCodes()
        public
        view
        onlyAdmin
        returns (string[] memory)
    {
        return allCertificateCodes;
    }

    function getAllSales() public view onlyAdmin returns (Sale[] memory) {
        return sales;
    }

    function _registerUser(address _user) internal {
        if (!isRegisteredUser[_user]) {
            isRegisteredUser[_user] = true;
            allUsers.push(_user);
        }
    }
}
