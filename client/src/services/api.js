const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

export function registerUserApi(profile) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export function loginUserApi(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function updateUserApi(walletAddress, profile) {
  return request(`/auth/users/${walletAddress}`, {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

export function getUsersApi() {
  return request("/auth/users");
}

export function getCoursesApi(options = {}) {
  const query = options.includeInactive ? "?includeInactive=true" : "";
  return request(`/courses${query}`);
}

export function saveCourseApi(course) {
  return request("/courses", {
    method: "POST",
    body: JSON.stringify(course),
  });
}

export function deleteCourseApi(blockchainCourseId, txHash = "") {
  const query = txHash ? `?txHash=${txHash}` : "";
  return request(`/courses/${blockchainCourseId}${query}`, {
    method: "DELETE",
  });
}

export function saveCertificateApi(certificate) {
  return request("/certificates", {
    method: "POST",
    body: JSON.stringify(certificate),
  });
}

export function getCertificatesApi(studentWallet) {
  const query = studentWallet ? `?studentWallet=${studentWallet}` : "";
  return request(`/certificates${query}`);
}

export function saveSaleApi(sale) {
  return request("/sales", {
    method: "POST",
    body: JSON.stringify(sale),
  });
}

export function getSalesApi() {
  return request("/sales");
}
