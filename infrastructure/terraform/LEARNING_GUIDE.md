# Terraform Learning Guide - VPN Enterprise

Step-by-step guide following your instructor's approach.

## �� Learning Objectives

By the end of this guide, you'll understand:
1. ✅ Terraform basic syntax (HCL - HashiCorp Configuration Language)
2. ✅ How to create AWS resources
3. ✅ Using variables for flexibility
4. ✅ Creating reusable modules
5. ✅ Managing state (local & remote)
6. ✅ Multi-environment deployment

## 📚 Week 1: Terraform Basics

### Lesson 1: Your First Resource

Create a simple VPC:

```hcl
# main.tf
resource "aws_vpc" "my_first_vpc" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "my-first-vpc"
  }
}
```

**Run it:**
```bash
terraform init
terraform plan
terraform apply
```

**What happened?**
1. `terraform init` - Downloaded AWS provider
2. `terraform plan` - Showed what will be created
3. `terraform apply` - Created the VPC in AWS

### Lesson 2: Variables

Instead of hardcoding, use variables:

```hcl
# variables.tf
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# main.tf
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  
  tags = {
    Name = "${var.environment}-vpc"
  }
}
```

**Use it:**
```bash
terraform apply -var="environment=dev"
```

### Lesson 3: Outputs

Get information back from Terraform:

```hcl
# outputs.tf
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}
```

**After apply:**
```bash
terraform output
terraform output -json > outputs.json
```

### Lesson 4: Multiple Resources

Create VPC + Subnet:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id  # Reference VPC!
  cidr_block = "10.0.1.0/24"
  
  tags = {
    Name = "public-subnet"
  }
}
```

**Key Concept**: Resources can reference each other using `resource_type.resource_name.attribute`

## 📚 Week 2: Modules

### Why Modules?

**Problem**: You create dev environment, then copy-paste for staging = duplicate code!

**Solution**: Create a module once, use it many times!

### Creating Your First Module

**Directory structure:**
```
modules/
  networking/
    main.tf
    variables.tf
    outputs.tf
```

**Module code (`modules/networking/main.tf`):**
```hcl
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  
  tags = {
    Name = "${var.environment}-vpc"
  }
}

resource "aws_subnet" "public" {
  count      = length(var.public_subnets)
  vpc_id     = aws_vpc.main.id
  cidr_block = var.public_subnets[count.index]
}
```

**Module variables (`modules/networking/variables.tf`):**
```hcl
variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "public_subnets" {
  type = list(string)
}
```

**Using the module:**
```hcl
# environments/dev/main.tf
module "networking" {
  source = "../../modules/networking"
  
  environment     = "dev"
  vpc_cidr        = "10.0.0.0/16"
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
}

# Access module outputs
output "vpc_id" {
  value = module.networking.vpc_id
}
```

### Module Benefits

✅ **DRY** (Don't Repeat Yourself)  
✅ **Reusable** across environments  
✅ **Maintainable** - fix bug once  
✅ **Testable** - test module separately  

## 📚 Week 3: State Management

### What is State?

Terraform stores info about your infrastructure in a **state file** (`terraform.tfstate`).

**State contains:**
- What resources exist
- Their current configuration
- Dependencies between resources

### Local State (Default)

**Stored in:** `terraform.tfstate` file

**Problems:**
- ❌ Can't collaborate with team
- ❌ No locking (conflicts possible)
- ❌ Risk of deletion/corruption

### Remote State (Recommended)

**Stored in:** S3 bucket

**Benefits:**
- ✅ Team collaboration
- ✅ State locking with DynamoDB
- ✅ Versioning & backup
- ✅ Encryption

**Setup:**

1. Create S3 bucket for state:
```bash
aws s3api create-bucket \
  --bucket vpn-enterprise-terraform-state \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket vpn-enterprise-terraform-state \
  --versioning-configuration Status=Enabled
```

2. Create DynamoDB table for locking:
```bash
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

3. Configure backend:
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

4. Initialize:
```bash
terraform init
# It will migrate local state to S3
```

## 📚 Week 4: Multi-Environment

### Environment Strategy

```
environments/
├── dev/
│   ├── main.tf
│   ├── variables.tf
│   ├── terraform.tfvars
│   └── backend.tf
├── staging/
│   └── ... (same structure)
└── prod/
    └── ... (same structure)
```

### Environment Configuration

**`environments/dev/terraform.tfvars`:**
```hcl
environment     = "dev"
instance_type   = "t3.micro"
min_instances   = 1
max_instances   = 2
```

**`environments/prod/terraform.tfvars`:**
```hcl
environment     = "prod"
instance_type   = "t3.medium"
min_instances   = 2
max_instances   = 10
```

### Deploy Each Environment

```bash
# Deploy dev
cd environments/dev
terraform init
terraform apply

# Deploy prod
cd ../prod
terraform init
terraform apply
```

## 🎓 Practice Exercises

### Exercise 1: Create a Security Group
```hcl
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Allow HTTP traffic"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### Exercise 2: Use Count for Multiple Resources
```hcl
resource "aws_subnet" "private" {
  count      = 3
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.${count.index + 10}.0/24"
  
  tags = {
    Name = "private-subnet-${count.index + 1}"
  }
}
```

### Exercise 3: Use For_Each
```hcl
variable "subnets" {
  type = map(string)
  default = {
    "web"  = "10.0.1.0/24"
    "app"  = "10.0.2.0/24"
    "db"   = "10.0.3.0/24"
  }
}

resource "aws_subnet" "main" {
  for_each = var.subnets
  
  vpc_id     = aws_vpc.main.id
  cidr_block = each.value
  
  tags = {
    Name = "${each.key}-subnet"
  }
}
```

## 🔍 Common Commands Reference

```bash
# Initialize (download providers)
terraform init

# Format code
terraform fmt

# Validate syntax
terraform validate

# Preview changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List resources
terraform state list

# Get outputs
terraform output

# Destroy everything
terraform destroy

# Import existing resource
terraform import aws_instance.example i-1234567890abcdef0
```

## 🎯 Next Steps

Now that you understand the basics, proceed to:

1. **Deploy Dev Environment**: `cd environments/dev && terraform apply`
2. **Review Created Resources**: Check AWS Console
3. **Configure with Ansible**: See `ansible/README.md`
4. **Deploy Application**: Run Ansible playbooks

## 📖 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Provider Reference](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Learn Terraform](https://learn.hashicorp.com/terraform)

---

**Remember**: Always run `terraform plan` before `apply`!
