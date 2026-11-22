# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn
RUN chmod +x mvnw
COPY backend/src src
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install Python3, Tesseract OCR, OpenCV, and dependencies for local OCR engine
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-pillow \
    py3-numpy \
    py3-opencv \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    && pip install --no-cache-dir --break-system-packages pytesseract

COPY ocr /app/ocr
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

