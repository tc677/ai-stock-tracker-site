variable "region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "stock-dashboard"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_name" {
  type    = string
  default = "stockdash"
}

variable "db_username" {
  type    = string
  default = "stockdash_app"
}

variable "alpaca_key_id" {
  type      = string
  sensitive = true
}

variable "alpaca_secret_key" {
  type      = string
  sensitive = true
}

variable "alpaca_base_url" {
  type    = string
  default = "https://paper-api.alpaca.markets"
}

variable "domain_name" {
  type        = string
  default     = ""
  description = "Optional custom domain (e.g. dashboard.example.com). Leave empty to use the CloudFront default URL."
}

variable "github_repo" {
  type        = string
  default     = "tc677/ai-stock-tracker-site"
  description = "GitHub repo (<owner>/<name>) allowed to assume the deploy role via OIDC."
}

variable "alert_email" {
  type        = string
  description = "Email address that receives CloudWatch alarm notifications."
}

variable "starting_equity" {
  type        = number
  default     = 10000
  description = "Account starting balance, in USD. Used as the baseline for YTD return calculations."
}

variable "puller_schedule" {
  type        = string
  default     = "cron(* 13-21 ? * MON-FRI *)"
  description = "EventBridge Scheduler expression for the puller. Default fires every minute Mon-Fri during a UTC window that covers US market hours in both EST and EDT. Alpaca's free tier (200 req/min) handles this comfortably."
}
