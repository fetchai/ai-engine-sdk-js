#!/usr/bin/env bash
set -eux

# effectively log the user in
pnpm config set //registry.npmjs.org/:_authToken $NPM_TOKEN

# build the package
pnpm run build:release

# publish the package
cd dist
pnpm publish --access public --no-git-checks
