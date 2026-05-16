output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
  description = "Public URL of the dashboard (the default *.cloudfront.net name)"
}

output "site_url" {
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.main.domain_name}"
  description = "Canonical site URL - custom domain when set, CloudFront default otherwise"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_web_service_name" {
  value = aws_ecs_service.web.name
}

output "ecs_puller_task_family" {
  value = aws_ecs_task_definition.puller.family
}

output "alb_dns_name" {
  value       = aws_lb.web.dns_name
  description = "Internal ALB DNS - not reachable from the internet, only via CloudFront."
}

output "ecr_web_repo" {
  value = aws_ecr_repository.web.repository_url
}

output "ecr_puller_repo" {
  value = aws_ecr_repository.puller.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "Paste this into GitHub repo Settings → Secrets and variables → Actions → Variables → AWS_ROLE_ARN"
}

output "alerts_topic_arn" {
  value = aws_sns_topic.alerts.arn
}
