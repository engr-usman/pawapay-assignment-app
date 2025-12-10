# 🌐 assignment-app — Client IP Capture Service

**assignment-app** is a lightweight web application built for the PawaPay SRE Assignment. It demonstrates deployment of a containerized microservice on AWS using ECR, EKS, RDS, Helm, and CI/CD automation.

The application exposes two public endpoints:
- `/client-ip` → captures the client's public IP and stores it in PostgreSQL (RDS)
- `/client-ip/list` → returns all stored IP addresses

The service is written in Node.js (Express), packaged using Docker, and deployed using a Helm chart built on top of the official `application-helm` dependency.

---

## 🚀 Features

- ✅ Capture client public IP from `X-Forwarded-For` or socket
- ✅ Store IPs in PostgreSQL 15.x hosted on AWS RDS
- ✅ Fetch list of all stored IP entries
- ✅ Lightweight REST API built on Express.js
- ✅ Dockerized for containerized deployments
- ✅ Helm chart for Kubernetes deployments (EKS)
- ✅ GitHub Actions workflow for CI/CD & ECR image publishing
- ✅ Health-check endpoint for liveness/readiness probes

---

## 🧱 Project Structure

```
assignment-app/
├── src/
│   └── index.js               # Core Express application
├── helm/
│   ├── Chart.yaml             # Helm chart definition
│   ├── values.yaml            # Application configuration overrides
│   └── templates/
│       └── db-secret.yaml     # Kubernetes secret template for DB credentials
├── .github/
│   └── workflows/
│       └── build-and-push.yml # CI/CD pipeline for Docker image publishing
├── Dockerfile                 # Multi-stage build Dockerfile
├── package.json               # Node.js dependencies and scripts
├── package-lock.json          # Dependency lockfile for reproducible builds
└── README.md                  # Project documentation
```

---

## 🔧 API Endpoints

### 1. `GET /client-ip`

Captures the caller's public IP and inserts it into the RDS database.

**Response Example:**
```json
{
  "message": "IP saved",
  "ip": "147.161.160.195"
}
```

### 2. `GET /client-ip/list`

Returns a list of all saved IP addresses.

**Response Example:**
```json
[
  {
    "id": 5,
    "ip_address": "147.161.160.195",
    "created_at": "2025-12-10T10:32:54.400Z"
  }
]
```

### 3. `GET /healthz`

Health check endpoint used by Kubernetes probes.

---

## 🗄️ Database Schema (PostgreSQL 15.x)

The schema is automatically initialized at application startup:

```sql
CREATE TABLE IF NOT EXISTS client_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🐳 Running the Application Locally with Docker

### Set Environment Variables

First, configure your environment variables for RDS connectivity:

```bash
export DB_HOST=<your-rds-endpoint>
export DB_PORT=5432
export DB_USER=<username>
export DB_PASSWORD=<password>
export DB_NAME=<db_name>
export DB_SSL=true
export PORT=8080
```

### Build and Run the Container

```bash
docker build -t assignment-app:local .

docker run -p 8080:8080 \
  -e DB_HOST \
  -e DB_PORT \
  -e DB_USER \
  -e DB_PASSWORD \
  -e DB_NAME \
  -e DB_SSL \
  assignment-app:local
```

### Test Locally

```bash
curl http://localhost:8080/client-ip
curl http://localhost:8080/client-ip/list
```

---

## ☸️ Helm Deployment (EKS)

### Add the Dependency Repository

```bash
helm repo add pawapay https://pawapay.github.io/application-helm
helm dependency update ./helm
```

### Deploy the Chart

```bash
helm upgrade --install assignment-app ./helm \
  --namespace assignment-app \
  --create-namespace \
  --set deployment.image.tag=<IMAGE_TAG_FROM_CI>
```

### Retrieve the Public URL

```bash
kubectl get ingress -n assignment-app
```

---

## 🤖 CI/CD with GitHub Actions

A workflow is included to:
- Build the Docker image
- Authenticate with Amazon ECR
- Push the image to the repository

**Workflow file:** `.github/workflows/build-and-push.yml`

### Required GitHub Secrets

| Secret Name | Description |
|------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key (or use OIDC Authentication) |
| `AWS_REGION` | Deployment region (e.g., `us-east-1`) |

Push to the `main` branch to trigger automated image builds.

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_HOST` | PostgreSQL RDS endpoint |
| `DB_PORT` | Database port (default: 5432) |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `DB_SSL` | Enable SSL for RDS (true/false) |
| `PORT` | Application port (default: 8080) |

These are injected into Kubernetes via Helm and stored securely via Kubernetes Secrets.

---

## 📦 Dockerfile

A multi-stage Dockerfile is included to ensure:
- Small production image
- Only production dependencies
- Fast container startup

---

## 📝 Notes & Assumptions

- PostgreSQL version used: **15.5**
- SSL is **enabled** for RDS connections
- Kubernetes ingress is handled using **ingress-nginx** or **AWS Load Balancer Controller**
- Application expects RDS to allow inbound connections from EKS worker nodes
- All sensitive values are stored in **Kubernetes Secrets**, not hardcoded

---

## 👤 Author

[Syed Usman Ahmad | DevOps Expert]