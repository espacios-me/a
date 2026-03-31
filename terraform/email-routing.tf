locals {
  route_address = "${var.route_local_part}@${var.route_domain}"
}

resource "cloudflare_email_routing_address" "destination" {
  account_id = var.account_id
  email      = var.destination_email
}

resource "cloudflare_email_routing_rule" "hello_forward" {
  zone_id  = var.zone_id
  name     = "${local.route_address} -> ${var.destination_email}"
  enabled  = true
  priority = 0

  actions = [
    {
      type  = "forward"
      value = [var.destination_email]
    }
  ]

  matchers = [
    {
      type  = "literal"
      field = "to"
      value = local.route_address
    }
  ]
}

output "forwarding_address" {
  value       = local.route_address
  description = "The routed email address managed by this Terraform config"
}

output "destination_email" {
  value       = var.destination_email
  description = "The verified destination used for forwarding"
}
