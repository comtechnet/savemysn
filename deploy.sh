!/usr/bin/env sh

# Copied from https://vitejs.dev/guide/static-deploy.html#github-pages

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

# if you are deploying to a custom domain
echo 'savemystuff.net' > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:ChrisEdgington/savemy-site.git master:main

cd -