# BUILDLOG

## Project Approach

This project was built incrementally from SPEC-01 through SPEC-07. The implementation favors small Express routers, parameterized PostgreSQL queries, Zod boundary validation, and services that can be replaced in tests.

## Where AI Helped

- Scaffolding the Node.js and Docker Compose setup.
- Designing the PostgreSQL schema and tenant-scoped repository queries.
- Implementing JWT authentication, widget CRUD, public widget delivery, and the hardened submission path.
- Generating focused Supertest/Jest acceptance probes and the Postman collection.
- Reviewing the final documentation and evidence pack.

## Where AI Was Wrong or Incomplete

- The initial project setup accidentally left two JSON objects concatenated in `package.json` after an interrupted `npm init`; this was detected by `npm install` and repaired.
- PostgreSQL startup initially failed because an unrelated `meetzen-postgres` container already owned port `5432`; the conflict was diagnosed and the project container was started after that container was stopped.
- The first public widget implementation referenced `POST /api/submissions` before that route existed, which caused the browser to show `Unable to send your message right now.`; the missing route was then implemented and tested.
- A first shell-based SQL test expanded `$1` and `$2` before PostgreSQL received them; the command was corrected by protecting the shell string.

## Verification

The final automated suite runs with `npm test` and covers authentication, tenant isolation, public CORS, validation, rate limiting, honeypot rejection, geo fallback, notification failure resilience, and dashboard analytics.
