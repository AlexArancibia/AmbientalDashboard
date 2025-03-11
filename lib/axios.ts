import axios from "axios"

// No necesitamos una URL base ya que las rutas API están en el mismo proyecto
const axiosClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para manejar errores
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || "Ha ocurrido un error"
    console.error("API Error:", message)
    return Promise.reject(error)
  },
)

export default axiosClient

