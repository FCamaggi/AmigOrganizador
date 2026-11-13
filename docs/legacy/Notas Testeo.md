# Notas Testeo v1

## Login y registro

Colores elegidos para el texto se parece mucho al fondo y no logra verse bien

Al intentar registrar UsuarioA
Consola:

:5000/api/auth/register:1 Failed to load resource: the server responded with a status of 400 (Bad Request)

Error en registro: AxiosError

Frontend:
El email ya está registrado

Y al intentar login

consola:

POST http://localhost:5000/api/auth/login 401 (Unauthorized)
Error en login: AxiosError {message: 'Request failed with status code 401', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}

frontend:
Credenciales inválidas
