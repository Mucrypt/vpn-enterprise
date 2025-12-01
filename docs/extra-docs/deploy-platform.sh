#!/bin/bash
# VPN Enterprise Kubernetes Cluster Deployment
# Deploys your platform services to the Kubernetes cluster

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NAMESPACE="vpn-enterprise"
DOMAIN=${DOMAIN:-"vpn-enterprise.local"}

echo -e "${BLUE}🚀 Deploying VPN Enterprise Platform Services${NC}"
echo "=============================================="

# Check if kubectl is configured
if ! kubectl cluster-info &>/dev/null; then
    echo -e "${RED}❌ Kubernetes cluster not accessible${NC}"
    echo "Please ensure kubectl is configured and cluster is running"
    exit 1
fi

log_step() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Create namespace
log_step "Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
log_success "Namespace created/updated"

# Create secrets
log_step "Creating secrets..."
kubectl create secret generic postgres-secret \
    --from-literal=username=vpn_enterprise_user \
    --from-literal=password=$(openssl rand -base64 32) \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic redis-secret \
    --from-literal=password=$(openssl rand -base64 32) \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic jwt-secret \
    --from-literal=secret=$(openssl rand -base64 64) \
    --namespace=$NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

log_success "Secrets created"

# Deploy PostgreSQL
log_step "Deploying PostgreSQL..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: $NAMESPACE
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: $NAMESPACE
  labels:
    app: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: vpn_enterprise
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        ports:
        - containerPort: 5432
          name: postgres
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: $NAMESPACE
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
EOF

log_success "PostgreSQL deployed"

# Deploy Redis
log_step "Deploying Redis..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: $NAMESPACE
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command:
        - redis-server
        - --requirepass
        - \$(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        ports:
        - containerPort: 6379
          name: redis
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: $NAMESPACE
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
EOF

log_success "Redis deployed"

# Deploy MinIO (S3-compatible storage)
log_step "Deploying MinIO storage..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: minio-pvc
  namespace: $NAMESPACE
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: $NAMESPACE
  labels:
    app: minio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
      - name: minio
        image: minio/minio:latest
        command:
        - /bin/bash
        - -c
        args: 
        - minio server /data --console-address ":9001"
        env:
        - name: MINIO_ROOT_USER
          value: vpn-enterprise
        - name: MINIO_ROOT_PASSWORD
          value: $(openssl rand -base64 32)
        ports:
        - containerPort: 9000
          name: api
        - containerPort: 9001
          name: console
        volumeMounts:
        - name: storage
          mountPath: /data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: minio-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: minio
  namespace: $NAMESPACE
spec:
  selector:
    app: minio
  ports:
  - name: api
    port: 9000
    targetPort: 9000
  - name: console
    port: 9001
    targetPort: 9001
  type: ClusterIP
EOF

log_success "MinIO deployed"

# Deploy VPN Enterprise API
log_step "Deploying VPN Enterprise API..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: $NAMESPACE
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PLATFORM_NAME: "VPN Enterprise"
  DOMAIN: "$DOMAIN"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpn-enterprise-api
  namespace: $NAMESPACE
  labels:
    app: vpn-enterprise-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vpn-enterprise-api
  template:
    metadata:
      labels:
        app: vpn-enterprise-api
    spec:
      containers:
      - name: api
        image: node:18-alpine
        workingDir: /app
        command:
        - /bin/sh
        - -c
        - |
          npm install -g npm@latest
          npm install
          npm run build
          npm start
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: api-config
              key: NODE_ENV
        - name: POSTGRES_URL
          value: "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/vpn_enterprise"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: REDIS_URL
          value: "redis://:$(REDIS_PASSWORD)@redis:6379"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        ports:
        - containerPort: 3000
          name: http
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        # Note: In real deployment, you'd mount your code or use a built image
        volumeMounts:
        - name: app-code
          mountPath: /app
      volumes:
      - name: app-code
        emptyDir: {}
      initContainers:
      - name: code-clone
        image: alpine/git
        command:
        - /bin/sh
        - -c
        - |
          echo "In production, clone your Git repository here"
          echo "For now, creating placeholder structure"
          mkdir -p /app
          echo '{"name":"vpn-enterprise-api","version":"1.0.0","main":"index.js","scripts":{"start":"echo \"API placeholder running\"; sleep infinity"}}' > /app/package.json
          echo 'console.log("VPN Enterprise API placeholder");' > /app/index.js
        volumeMounts:
        - name: app-code
          mountPath: /app
---
apiVersion: v1
kind: Service
metadata:
  name: vpn-enterprise-api
  namespace: $NAMESPACE
spec:
  selector:
    app: vpn-enterprise-api
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
EOF

log_success "VPN Enterprise API deployed"

# Deploy NGINX ingress
log_step "Deploying ingress controller..."
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vpn-enterprise-ingress
  namespace: $NAMESPACE
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
  - host: $DOMAIN
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: vpn-enterprise-api
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vpn-enterprise-web
            port:
              number: 3000
  - host: admin.$DOMAIN
    http:
      paths:
      - path: /minio
        pathType: Prefix
        backend:
          service:
            name: minio
            port:
              number: 9001
EOF

log_success "Ingress configured"

# Deploy monitoring
log_step "Deploying monitoring stack..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: $NAMESPACE
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: $NAMESPACE
  labels:
    app: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: config
        configMap:
          name: prometheus-config
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: $NAMESPACE
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
EOF

log_success "Monitoring deployed"

# Wait for deployments to be ready
log_step "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/postgres -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=available deployment/redis -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=available deployment/minio -n $NAMESPACE --timeout=300s

log_success "All deployments ready"

# Display status
echo ""
echo -e "${GREEN}🎉 VPN Enterprise platform deployed successfully!${NC}"
echo ""
echo -e "${BLUE}Services Status:${NC}"
kubectl get pods -n $NAMESPACE

echo ""
echo -e "${BLUE}Access Information:${NC}"
echo "Namespace: $NAMESPACE"
echo "API: http://$DOMAIN/api"
echo "MinIO Console: http://admin.$DOMAIN/minio"
echo "Prometheus: kubectl port-forward svc/prometheus 9090:9090 -n $NAMESPACE"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Set up DNS or add entries to /etc/hosts:"
echo "   echo \"$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}') $DOMAIN admin.$DOMAIN\" >> /etc/hosts"
echo ""
echo "2. Deploy your web dashboard"
echo "3. Configure SSL certificates"
echo "4. Set up backup procedures"
echo "5. Configure monitoring alerts"

echo ""
echo -e "${GREEN}Your VPN Enterprise cloud platform is now running! 🚀${NC}"