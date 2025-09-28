FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
# Install k6
RUN apt-get update && apt-get install -y wget
RUN wget -q https://github.com/grafana/k6/releases/download/v0.49.0/k6-v0.49.0-linux-amd64.tar.gz \
    && tar -xzf k6-v0.49.0-linux-amd64.tar.gz \
    && mv k6-v0.49.0-linux-amd64/k6 /usr/bin/ \
    && rm -rf k6-v0.49.0-linux-amd64*
# Install Python for Locust
RUN apt-get install -y python3 python3-pip
RUN pip3 install locust
# Install JMeter
RUN apt-get install -y openjdk-17-jdk
RUN wget -q https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz \
    && tar -xzf apache-jmeter-5.6.3.tgz -C /opt \
    && rm apache-jmeter-5.6.3.tgz
ENV PATH="/opt/apache-jmeter-5.6.3/bin:${PATH}"
COPY . .
CMD ["node", "runner.js"]