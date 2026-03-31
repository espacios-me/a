variable "cloudflare_api_token" {
  description = "Cloudflare API token with access to Email Routing and Zone configuration"
  type        = string
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare account ID for espacios.me"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID for espacios.me"
  type        = string
}

variable "destination_email" {
  description = "Forwarding destination email address"
  type        = string
  default     = "thekeifferjapeth@gmail.com"
}

variable "route_local_part" {
  description = "Local part for the forwarding address"
  type        = string
  default     = "hello"
}

variable "route_domain" {
  description = "Domain for the forwarding address"
  type        = string
  default     = "espacios.me"
}
