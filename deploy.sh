#!/bin/bash

# Exit on any error
set -e

# Build the project
echo "Building the project..."
npm run build

# Check if gh-pages branch exists, create it if not
echo "Setting up gh-pages branch..."
git checkout -b gh-pages 2>/dev/null || git checkout gh-pages

# Remove all files except dist folder
echo "Preparing deployment files..."
find . -maxdepth 1 ! -name 'dist' ! -name '.git' ! -name '.' -exec rm -rf {} +

# Move dist folder contents to root
echo "Moving build files..."
mv dist/* .
rmdir dist

# Commit and push to gh-pages branch
echo "Deploying to GitHub Pages..."
git add .
git commit -m "Deploy to GitHub Pages" || echo "No changes to commit"
git push origin gh-pages --force

echo "Deployment complete!"
echo "Your game is now available at: https://[your-username].github.io/ufo360/"