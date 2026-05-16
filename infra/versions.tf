terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.81"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Switch to S3 backend once you've created the bucket. See README.
  # backend "s3" {
  #   bucket  = "stock-dashboard-tfstate-CHANGEME"
  #   key     = "infra.tfstate"
  #   region  = "us-east-1"
  #   encrypt = true
  # }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project   = "stock-dashboard"
      ManagedBy = "opentofu"
    }
  }
}

# CloudFront WAF must live in us-east-1 regardless of app region.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags {
    tags = {
      Project   = "stock-dashboard"
      ManagedBy = "opentofu"
    }
  }
}
