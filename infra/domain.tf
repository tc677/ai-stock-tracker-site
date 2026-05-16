# Everything domain-related is gated on var.domain_name being set.
# Leave var.domain_name empty and these resources don't get created -
# the dashboard stays on its *.cloudfront.net default URL.

locals {
  has_domain  = var.domain_name != ""
  domain_list = local.has_domain ? [var.domain_name, "www.${var.domain_name}"] : []
}

# Route 53 hosted zone is auto-created by Route 53 when you register a
# domain through it. Look it up here so we can add records.
data "aws_route53_zone" "main" {
  count        = local.has_domain ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

# ACM certificate for both root and www, in us-east-1 (CloudFront's
# required region for viewer certs).
resource "aws_acm_certificate" "main" {
  count                     = local.has_domain ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS-validation records, one per name on the cert.
resource "aws_route53_record" "cert_validation" {
  for_each = local.has_domain ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

# Waits until ACM observes the validation records and issues the cert.
resource "aws_acm_certificate_validation" "main" {
  count                   = local.has_domain ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# A-record alias for the apex (canmyaitrade.com -> CloudFront).
resource "aws_route53_record" "apex" {
  count   = local.has_domain ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# A-record alias for www (also points at CloudFront; the CloudFront
# Function below redirects www -> apex).
resource "aws_route53_record" "www" {
  count   = local.has_domain ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# CloudFront Function (runs at the edge, ~free) that 301-redirects
# www.<domain> to the apex.
resource "aws_cloudfront_function" "redirect_www" {
  count   = local.has_domain ? 1 : 0
  name    = "${var.project}-redirect-www"
  runtime = "cloudfront-js-2.0"
  comment = "301 redirect www.${var.domain_name} -> ${var.domain_name}"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var host = request.headers.host && request.headers.host.value;
      if (host && host.indexOf('www.') === 0) {
        var apex = host.slice(4);
        return {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: 'https://' + apex + request.uri }
          }
        };
      }
      return request;
    }
  EOT
}
