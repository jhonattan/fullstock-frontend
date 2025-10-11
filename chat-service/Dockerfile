# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente
COPY . .

# Compila TypeScript a JavaScript
RUN npx tsc

# Expone el puerto (ajusta si usas otro)
EXPOSE 4000

# Comando para iniciar la app en producción
CMD ["node", "dist/app.js"]