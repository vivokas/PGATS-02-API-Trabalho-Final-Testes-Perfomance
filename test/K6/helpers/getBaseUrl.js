// Obtém a BASE_URL da variável de ambiente
export function getBaseUrl() {
  return __ENV.BASE_URL || "http://localhost:3001";
}
