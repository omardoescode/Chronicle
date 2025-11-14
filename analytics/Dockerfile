FROM maven:3.9.4-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -e -DskipTests clean package

FROM flink:1.20.0
WORKDIR /opt/flink/usrlib
COPY --from=builder /build/target/*.jar /opt/flink/usrlib/
