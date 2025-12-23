/**
 * Valida formato de email
 */
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida fortaleza de contraseña
 * Mínimo 8 caracteres, al menos una mayúscula y un número
 */
export const isValidPassword = (password: string) => {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[0-9]/.test(password);
};

/**
 * Valida username
 * 3-20 caracteres alfanuméricos
 */
export const isValidUsername = (username: string) => {
  const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
  return usernameRegex.test(username);
};
