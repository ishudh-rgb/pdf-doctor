.PHONY: install dev build lint typecheck test test-e2e ci health

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

ci: lint typecheck test build test:e2e

test-e2e:
	npm run test:e2e

health:
	curl -fsS http://localhost:3000/api/health | jq .
