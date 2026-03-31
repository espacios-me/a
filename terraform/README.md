# Cloudflare Email Routing Terraform

This folder manages Cloudflare Email Routing for `espacios.me`.

## What it creates

- a destination address for `thekeifferjapeth@gmail.com`
- a forwarding rule for `hello@espacios.me -> thekeifferjapeth@gmail.com`

## Important

Cloudflare still requires the destination email address to be verified from the Gmail inbox.
Terraform can create the destination resource, but forwarding will not work until the verification email is opened and confirmed.

## Files

- `providers.tf` - Terraform and Cloudflare provider setup
- `variables.tf` - required variables and defaults
- `email-routing.tf` - destination address and forwarding rule resources
- `terraform.tfvars.example` - example values to copy into a local `terraform.tfvars`
- `.gitignore` - ignores local state and secret files

## Setup

1. Copy the example file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Fill in:
- `cloudflare_api_token`
- `account_id`
- `zone_id`

3. Run Terraform:

```bash
terraform init
terraform plan
terraform apply
```

4. Open the verification email sent to `thekeifferjapeth@gmail.com` and confirm it.

## Result

After verification, mail sent to `hello@espacios.me` should forward to `thekeifferjapeth@gmail.com`.
