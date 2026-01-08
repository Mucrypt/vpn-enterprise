# Terraform Infrastructure - VPN Enterprise

Production-grade Infrastructure as Code using Terraform modules and multi-environment setup.

## 🎯 What You'll Learn

Following your course instructor's approach:
1. **Terraform basics** - syntax, resources, variables
2. **Modules** - reusable infrastructure components
3. **State management** - remote state with S3
4. **Multi-environment** - dev, staging, prod
5. **Best practices** - DRY principle, security, cost optimization

## 📁 Structure

```
terraform/
├── modules/                   # Reusable infrastructure modules
│   ├── networking/           # VPC, subnets, security groups, NAT
│   ├── compute/              # EC2, Auto Scaling Groups, Launch Templates
│   ├── database/             # RDS PostgreSQL, ElastiCache Redis
│   ├── load-balancer/        # Application Load Balancer, target groups
│   ├── secrets/              # AWS Secrets Manager
│   ├── monitoring/           # CloudWatch logs, alarms, dashboards
│   └── iam/                  # IAM roles, policies, instance profiles
│
├── environments/             # Environment-specific configurations
│   ├── dev/                  # Development (t3.micro, single AZ)
│   │   ├── main.tf          # Calls modules with dev params
│   │   ├── variables.tf     # Dev-specific variables
│   │   ├── terraform.tfvars # Dev values
│   │   └── outputs.tf       # Export EC2 IPs, endpoints
│   ├── staging/              # Staging (t3.small, multi-AZ)
│   └── prod/                 # Production (t3.medium, HA)
│
├── backend.tf                # S3 backend for state management
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install Terraform
cd ~
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform version

# Configure AWS CLI (already done ✅)
aws configure

# Verify access
aws sts get-caller-identity
```

### Deploy Development Environment

```bash
# Navigate to dev environment
cd infrastructure/terraform/environments/dev

# Initialize Terraform (downloads providers & modules)
terraform init

# Preview changes (IMPORTANT: always review first)
terraform plan

# Apply changes (creates infrastructure)
terraform apply

# Save outputs for Ansible
terraform output -json > ../../../../infrastructure/ansible/inventory/dev_hosts.json
```

### Deploy Staging or Production

```bash
# Same commands, different directory
cd infrastructure/terraform/environments/staging
terraform init
terraform plan
terraform apply
```

## 📖 Understanding Modules

### Why Modules?

Instead of this (repeated code):
```hcl
# In dev
resource "aws_vpc" "dev" {
  cidr_block = "10.0.0.0/16"
  # ... 50 more lines
}

# In staging - DUPLICATE CODE!
resource "aws_vpc" "staging" {
  cidr_block = "10.1.0.0/16"
  # ... 50 more lines (same as above)
}
```

We use this (DRY principle):
```hcl
# In dev
module "networking" {
  source = "../../modules/networking"
  environment = "dev"
  vpc_cidr = "10.0.0.0/16"
}

# In staging - REUSES MODULE!
module "networking" {
  source = "../../modules/networking"
  environment = "staging"
  vpc_cidr = "10.1.0.0/16"
}
```

## 🔄 Typical Workflow

```
1. Edit Terraform code (add/modify resources)
   ↓
2. terraform plan (preview changes)
   ↓
3. Review plan carefully
   ↓
4. terraform apply (execute changes)
   ↓
5. AWS API updates your infrastructure
   ↓
6. terraform output (get endpoint info)
   ↓
7. Pass to Ansible for configuration
```

## 🌍 Environment Strategy

### Development
- **Purpose**: Testing new features
- **Resources**: Minimal (t3.micro, single AZ)
- **Cost**: ~$30-40/month
- **Data**: Fake/test data
- **Uptime**: Can stop when not in use

### Staging
- **Purpose**: Pre-production validation
- **Resources**: Medium (t3.small, multi-AZ)
- **Cost**: ~$70-90/month
- **Data**: Production-like data
- **Uptime**: Business hours

### Production
- **Purpose**: Serve real users
- **Resources**: Full (t3.medium, HA, backups)
- **Cost**: ~$140-180/month
- **Data**: Real user data
- **Uptime**: 24/7, monitored

## 📝 Variables Example

Each environment has different values:

**`dev/terraform.tfvars`**:
```hcl
environment     = "dev"
instance_type   = "t3.micro"
min_instances   = 1
max_instances   = 2
multi_az        = false
backup_retention = 1
```

**`prod/terraform.tfvars`**:
```hcl
environment     = "prod"
instance_type   = "t3.medium"
min_instances   = 2
max_instances   = 10
multi_az        = true
backup_retention = 30
```

## 🗄️ State Management

### Local State (Default)
- Stored in `terraform.tfstate` file
- ⚠️ **Problem**: Can't collaborate, no locking

### Remote State (Recommended)
- Stored in S3 bucket
- DynamoDB for state locking
- ✅ Team collaboration
- ✅ Prevents conflicts
- ✅ State versioning

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "vpn-enterprise-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}
```

## 🔐 Managing Secrets

**DON'T** do this:
```hcl
resource "aws_db_instance" "db" {
  password = "MyPassword123!"  # ❌ Hardcoded!
}
```

**DO** this:
```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db.id
  secret_string = random_password.db_password.result
}

resource "aws_db_instance" "db" {
  password = random_password.db_password.result
}
```

## 📊 Outputs for Ansible

Terraform exports data for Ansible to use:

```hcl
# outputs.tf
output "ec2_public_ips" {
  value = module.compute.instance_public_ips
}

output "rds_endpoint" {
  value = module.database.rds_endpoint
}

output "alb_dns_name" {
  value = module.load_balancer.dns_name
}
```

Then Ansible reads these:
```yaml
# In Ansible playbook
- name: Configure app with RDS endpoint
  template:
    src: app_config.j2
    dest: /app/.env
  vars:
    db_host: "{{ terraform_outputs.rds_endpoint }}"
```

## 🛠️ Common Commands

```bash
# Initialize (first time only)
terraform init

# Format code (clean up)
terraform fmt -recursive

# Validate syntax
terraform validate

# Preview changes
terraform plan

# Show planned changes with resources
terraform plan -out=tfplan

# Apply changes
terraform apply

# Apply without confirmation (CI/CD)
terraform apply -auto-approve

# Destroy everything
terraform destroy

# Show current state
terraform show

# List resources
terraform state list

# Get output values
terraform output

# Refresh state from AWS
terraform refresh

# Import existing resource
terraform import aws_instance.example i-1234567890abcdef0
```

## 🔍 Debugging

```bash
# Enable detailed logs
export TF_LOG=DEBUG
terraform plan

# Save plan for inspection
terraform plan -out=plan.tfplan
terraform show plan.tfplan

# Check specific resource
terraform state show aws_instance.app

# Graph dependencies
terraform graph | dot -Tpng > graph.png
```

## 🎓 Learning Path

### Week 1: Basics
- [ ] Install Terraform
- [ ] Understand HCL syntax
- [ ] Create first resource (VPC)
- [ ] Use variables
- [ ] Understand state

### Week 2: Modules
- [ ] Create networking module
- [ ] Reuse module in multiple envs
- [ ] Pass variables between modules
- [ ] Use module outputs

### Week 3: Multi-Environment
- [ ] Set up dev environment
- [ ] Set up staging environment
- [ ] Configure remote state
- [ ] Implement workspaces

### Week 4: Advanced
- [ ] State management strategies
- [ ] Import existing resources
- [ ] Refactor code to modules
- [ ] CI/CD integration

## 🚨 Common Mistakes to Avoid

1. **Not running `plan` first** - Always preview changes
2. **Hardcoding values** - Use variables and locals
3. **No remote state** - Use S3 backend for teams
4. **Ignoring state file** - Never edit manually
5. **Not using modules** - DRY principle
6. **Deleting state file** - Keep backups
7. **Running in wrong directory** - Check environment
8. **Not tagging resources** - Tag everything for cost tracking

## 💡 Best Practices

✅ **Always use modules** for reusability  
✅ **One environment per directory**  
✅ **Remote state for collaboration**  
✅ **Tag all resources** (Environment, Project, Owner)  
✅ **Use variables** for all values that change  
✅ **Pin provider versions** for consistency  
✅ **Enable state locking** with DynamoDB  
✅ **Keep secrets in Secrets Manager**  
✅ **Document with comments**  
✅ **Version control everything**  

## 📚 Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Modules Guide](https://www.terraform.io/docs/language/modules/develop/index.html)
- [State Management Best Practices](https://www.terraform.io/docs/language/state/remote.html)

## 🆘 Troubleshooting

### "Error: Duplicate resource"
- Check for resources defined multiple times
- Ensure unique names/IDs

### "Error: Backend initialization required"
- Run `terraform init` again

### "Error: Resource not found"
- Resource was deleted outside Terraform
- Use `terraform import` or remove from state

### "Error: State locked"
- Another process is running
- Force unlock: `terraform force-unlock <LOCK_ID>`

---

**Next Step**: Create your first environment! See `environments/dev/README.md`
