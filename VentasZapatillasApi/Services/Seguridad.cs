using System.Security.Cryptography;


namespace ventasZapatiilasAPI.Services
{
    public class Seguridad
    {
        
        private const int SaltSize = 16;       // 128 bits para el salt
        private const int HashSize = 32;       // 256 bits para el hash resultante
        private const int Iterations = 100000; // Alto número de iteraciones para resistencia a fuerza bruta

        // ----------------------------------------------------------------------
        // MÉTODO PRINCIPAL: CREAR HASH
        // ----------------------------------------------------------------------
        /// <summary>
        /// Crea un hash de la contraseña usando PBKDF2 y genera un salt.
        /// Retorna un array de bytes que contiene el salt seguido del hash.
        /// </summary>
        /// <param name="password">Contraseña de texto plano.</param>
        /// <returns>Array de bytes (Salt + Hash) para almacenar en la DB.</returns>
        public static byte[] CrearHash(string password)
        {
            // 1. Generar Salt (valor aleatorio único)
            byte[] salt;
            using (var rng = RandomNumberGenerator.Create())
            {
                salt = new byte[SaltSize];
                rng.GetBytes(salt);
            }

            // 2. Aplicar PBKDF2
            // Rfc2898DeriveBytes es la implementación de PBKDF2 en .NET
            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            byte[] hash = pbkdf2.GetBytes(HashSize);

            // 3. Combinar Salt y Hash para almacenamiento
            // El array final debe almacenar el salt y luego el hash para poder verificarlos después.
            byte[] hashBytes = new byte[SaltSize + HashSize];
            Array.Copy(salt, 0, hashBytes, 0, SaltSize);
            Array.Copy(hash, 0, hashBytes, SaltSize, HashSize);

            return hashBytes;
        }

        // ----------------------------------------------------------------------
        // MÉTODO DE VERIFICACIÓN (Necesario para el Login)
        // ----------------------------------------------------------------------
        /// <summary>
        /// Verifica una contraseña de texto plano con el hash almacenado en la DB.
        /// </summary>
        /// <param name="password">Contraseña de texto plano ingresada por el usuario.</param>
        /// <param name="storedHash">El hash completo (Salt + Hash) almacenado en la DB.</param>
        /// <returns>True si la contraseña es correcta, False en caso contrario.</returns>
        public static bool VerificarPassword(string password, byte[] storedHash)
        {
            byte[] salt = new byte[SaltSize];
            Array.Copy(storedHash, 0, salt, 0, SaltSize);

            byte[] originalHash = new byte[HashSize];
            Array.Copy(storedHash, SaltSize, originalHash, 0, HashSize);

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256);
            byte[] newHash = pbkdf2.GetBytes(HashSize);

            return CryptographicOperations.FixedTimeEquals(originalHash, newHash);
        }
    }
}