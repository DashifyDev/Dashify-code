# Test Stripe webhooks locally using Stripe CLI
#
# Prerequisites:
#   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
#   2. Run `stripe login` to authenticate
#
# Setup (run in separate terminals):
#   Terminal 1: npm run dev
#   Terminal 2: npm run stripe:dev
#              ^^^ IMPORTANT: Copy the whsec_xxx signing secret the CLI prints.
#              Add to .env: STRIPE_TEST_WEBHOOK_SECRET=whsec_xxxxx
#              Restart npm run dev so it picks up the new env.
#   Terminal 3: npm run stripe:test  <- this script
#
# Note: Use the whsec from stripe listen output—NOT from Stripe Dashboard.
#
# Usage:
#   .\scripts\test-stripe-webhooks.ps1              # trigger all events
#   .\scripts\test-stripe-webhooks.ps1 -Event checkout # trigger specific event only

param(
    [ValidateSet("all", "checkout", "subscription-updated", "subscription-deleted", "payment-succeeded", "payment-failed")]
    [string]$Event = "all"
)

$ErrorActionPreference = "Stop"

$events = @{
    "checkout"            = "checkout.session.completed"
    "subscription-updated" = "customer.subscription.updated"
    "subscription-deleted" = "customer.subscription.deleted"
    "payment-succeeded"   = "invoice.payment_succeeded"
    "payment-failed"      = "invoice.payment_failed"
}

function Trigger-Event {
    param([string]$eventName)
    Write-Host "`n>>> Triggering $eventName..." -ForegroundColor Cyan
    stripe trigger $eventName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to trigger $eventName" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "Triggered. Check your dev server logs for webhook handling." -ForegroundColor Green
}

Write-Host "Stripe webhook test script" -ForegroundColor Yellow
Write-Host "Make sure: 1) npm run dev is running  2) npm run stripe:dev is forwarding events" -ForegroundColor Gray
Write-Host ""

if ($Event -eq "all") {
    foreach ($key in $events.Keys) {
        Trigger-Event -eventName $events[$key]
        Start-Sleep -Seconds 1
    }
    Write-Host "`nDone. All 5 events triggered." -ForegroundColor Green
} else {
    Trigger-Event -eventName $events[$Event]
}
