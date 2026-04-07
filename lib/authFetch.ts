
const BASE_URL = "http://localhost:8081";

export const authFetch = async (url: string, options: RequestInit = {}) => {

  const token = localStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(BASE_URL + url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    console.error("토큰 만료");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    throw new Error("Unauthorized");
  }

  return response;
};