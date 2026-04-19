# Test Evidence

## SPEC-06

Command: `npm test`

Result: 2 test suites passed, 11 tests passed, 0 failures.

Covered scenarios:

- Tenant registration, JWT login, protected routes and multi-tenant widget isolation.
- CORS preflight, invalid JSON payloads and oversized request payloads.
- Honeypot rejection without database insertion.
- Five accepted submissions followed by `429 Too Many Requests` for the same IP/widget.
- Geo provider fallback from `ip-api.com` to `ipapi.co`.
- Graceful lead persistence with `geo_data` set to `null` when both providers fail.
- Successful `201` response when the notification side effect throws an error.
- Swagger UI available at `GET /api-docs/` with the OpenAPI document loaded.

## SPEC-07

Command: `npm test`

Result: 2 test suites passed, 11 tests passed, 0 failures.

Dashboard evidence:

- Authenticated widget owner receives submissions ordered newest first.
- Authenticated widget owner receives `total_submissions` and location aggregates.
- A different tenant receives an empty result for the foreign widget and cannot read its leads.
- `capstone.yaml`, `README.md`, `BUILDLOG.md`, `.env.example` and this file are present at the repository root.