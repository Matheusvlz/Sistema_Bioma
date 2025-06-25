const API_BASE_URL = "http://192.168.15.26:8082"; // Substitua pela URL real da sua API

// Requisição genérica (opcional)
export async function apiRequest<T>(
  endpoint: string,
  method: string = "POST",
  body?: any,
  headers: HeadersInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Erro na requisição");
  }

  return response.json();
}

// Função específica para login
export async function login(email: string, password: string) {
  console.log(email);
  return apiRequest<{name: string; email: string }>(
    "/login",
    "POST",
    { email, password }
  );
}
