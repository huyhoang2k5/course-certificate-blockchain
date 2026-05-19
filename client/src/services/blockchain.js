import Web3 from "web3";
import CourseCertificate from "../contracts/CourseCertificate.json";

const GANACHE_CHAIN_ID = "0x539";
const GANACHE_NETWORK = {
  chainId: GANACHE_CHAIN_ID,
  chainName: "Ganache Localhost",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://127.0.0.1:7545"],
};

export function getWeb3() {
  if (!window.ethereum) {
    throw new Error(
      "Không tìm thấy MetaMask. Hãy mở app bằng trình duyệt đã cài MetaMask."
    );
  }

  return new Web3(window.ethereum);
}

export async function connectBlockchain() {
  await switchToGanache();

  const web3 = getWeb3();

  await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const accounts = await web3.eth.getAccounts();

  if (!accounts.length) {
    throw new Error("Bạn chưa chọn tài khoản MetaMask để đăng nhập.");
  }

  const networkId = String(await web3.eth.net.getId());
  const chainId = String(await web3.eth.getChainId());
  const deployedNetwork = await getDeployedNetwork(web3, networkId, chainId);

  if (!deployedNetwork) {
    const deployedIds = Object.keys(CourseCertificate.networks || {});
    const knownAddresses = deployedIds
      .map((id) => CourseCertificate.networks[id]?.address)
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Contract chưa có trên Ganache hiện tại. Network ${networkId} / chain ${chainId}; artifact có network ${deployedIds.join(
        ", "
      ) || "không có"}${knownAddresses ? `, địa chỉ cũ: ${knownAddresses}` : ""}. Hãy chạy lại: truffle migrate --reset --network development rồi copy artifact sang client.`
    );
  }

  const contract = new web3.eth.Contract(
    CourseCertificate.abi,
    deployedNetwork.address
  );

  const admin = await contract.methods.admin().call();
  const courses = await getCourses(contract);
  const { purchasedCourseIds, certificateCodes } = await getSafeUserData(
    contract,
    accounts[0]
  );
  const adminData = await getSafeAdminData(contract, accounts[0], admin);
  const role = isSameAddress(accounts[0], admin) ? "admin" : "user";

  return {
    account: accounts[0],
    admin,
    role,
    contract,
    courses,
    courseCount: courses.length,
    purchasedCourseIds,
    certificateCodes,
    userProfile: await getUserProfile(contract, accounts[0]),
    userCertificates: await getCertificatesByCodes(contract, certificateCodes),
    adminData,
  };
}

function isSameAddress(firstAddress, secondAddress) {
  return firstAddress.toLowerCase() === secondAddress.toLowerCase();
}

async function switchToGanache() {
  if (!window.ethereum) {
    throw new Error(
      "Không tìm thấy MetaMask. Hãy mở app bằng trình duyệt đã cài MetaMask."
    );
  }

  const currentChainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (currentChainId === GANACHE_CHAIN_ID) {
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GANACHE_CHAIN_ID }],
    });
  } catch (error) {
    if (error.code !== 4902) {
      throw new Error(
        "Vui lòng chuyển MetaMask sang mạng Ganache Localhost để đăng nhập."
      );
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [GANACHE_NETWORK],
    });
  }
}

async function getDeployedNetwork(web3, networkId, chainId) {
  const networks = CourseCertificate.networks || {};
  const candidates = [
    networks[networkId],
    networks[chainId],
    networks["5777"],
    networks["1337"],
    getOnlyLocalNetwork(networks),
  ].filter(Boolean);

  for (const network of candidates) {
    const code = await web3.eth.getCode(network.address);

    if (code && code !== "0x") {
      return network;
    }
  }

  return null;
}

function getOnlyLocalNetwork(networks) {
  const networkIds = Object.keys(networks);

  if (networkIds.length === 1) {
    return networks[networkIds[0]];
  }

  return null;
}

export async function getCourses(contract) {
  const count = await contract.methods.courseCount().call();
  const courseList = [];

  for (let i = 1; i <= Number(count); i += 1) {
    const course = await contract.methods.courses(i).call();
    if (course.isActive) {
      courseList.push(course);
    }
  }

  return courseList;
}

async function getSafeUserData(contract, account) {
  try {
    const [purchasedCourseIds, certificateCodes] = await Promise.all([
      getUserCourseIds(contract, account),
      getUserCertificateCodes(contract, account),
    ]);

    return {
      purchasedCourseIds,
      certificateCodes,
    };
  } catch (error) {
    console.warn("Không thể đọc dữ liệu người dùng từ contract", error);

    return {
      purchasedCourseIds: [],
      certificateCodes: [],
    };
  }
}

async function getSafeAdminData(contract, account, admin) {
  if (!isSameAddress(account, admin)) {
    return {
      users: [],
      userProfiles: [],
      certificateCodes: [],
      certificates: [],
      sales: [],
    };
  }

  try {
    const [users, certificateCodes, sales] = await Promise.all([
      contract.methods.getAllUsers().call({ from: account }),
      contract.methods.getAllCertificateCodes().call({ from: account }),
      contract.methods.getAllSales().call({ from: account }),
    ]);
    const studentUsers = users.filter((user) => !isSameAddress(user, admin));

    return {
      users: studentUsers,
      userProfiles: await getUserProfiles(contract, studentUsers),
      certificateCodes,
      certificates: await getCertificatesByCodes(contract, certificateCodes),
      sales,
    };
  } catch (error) {
    console.warn("Không thể đọc dữ liệu admin từ contract", error);

    return {
      users: [],
      userProfiles: [],
      certificateCodes: [],
      certificates: [],
      sales: [],
    };
  }
}

export async function getAdminData(contract, account) {
  const admin = await contract.methods.admin().call();
  return getSafeAdminData(contract, account, admin);
}

export async function getCertificatesByCodes(contract, certificateCodes) {
  return Promise.all(
    certificateCodes.map((code) => contract.methods.verifyCertificate(code).call())
  );
}

export async function registerStudent(contract, account, profile) {
  const admin = await contract.methods.admin().call();

  if (isSameAddress(account, admin)) {
    throw new Error("Ví admin không đăng ký như học viên.");
  }

  return contract.methods
    .registerUser(
      profile.fullName,
      profile.email,
      profile.phone
    )
    .send({
      from: account,
      gas: 6000000,
    });
}

export async function updateStudentProfile(contract, account, profile) {
  return contract.methods
    .updateMyProfile(
      profile.fullName,
      profile.email,
      profile.phone
    )
    .send({
      from: account,
    });
}

export async function getUserProfile(contract, userAddress) {
  const profile = await contract.methods.getUserProfile(userAddress).call();

  return {
    fullName: profile[0],
    email: profile[1],
    phone: profile[2],
    walletAddress: profile[3],
    registeredAt: profile[4],
    exists: profile[5],
  };
}

export async function getUserProfiles(contract, userAddresses) {
  return Promise.all(
    userAddresses.map((userAddress) => getUserProfile(contract, userAddress))
  );
}

export async function createCourse(contract, account, course) {
  const web3 = getWeb3();

  return contract.methods
    .addCourse(
      course.name,
      course.description,
      course.imageUrl,
      web3.utils.toWei(course.price, "ether")
    )
    .send({
      from: account,
    });
}

export async function removeCourse(contract, account, courseId) {
  return contract.methods.deleteCourse(courseId).send({
    from: account,
    gas: 200000,
  });
}

export async function purchaseCourse(contract, account, courseId, price) {
  return contract.methods.buyCourse(courseId).send({
    from: account,
    value: price,
  });
}

export async function getUserCourseIds(contract, account) {
  return contract.methods.getMyCourses().call({
    from: account,
  });
}

export async function getUserCertificateCodes(contract, account) {
  return contract.methods.getMyCertificates().call({
    from: account,
  });
}

export async function createCertificate(contract, account, certificate) {
  return contract.methods
    .issueCertificate(
      certificate.certCode,
      certificate.studentName,
      certificate.courseName,
      certificate.studentAddress
    )
    .send({
      from: account,
    });
}

export async function findCertificate(contract, certCode) {
  return contract.methods.verifyCertificate(certCode).call();
}
