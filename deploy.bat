@echo off
echo Building the project...
npm run build

echo Setting up gh-pages branch...
git checkout -b gh-pages 2>nul || git checkout gh-pages

echo Preparing deployment files...
for /f %%i in ('dir /b') do (
    if not "%%i"=="dist" if not "%%i"==".git" if not "%%i"=="deploy.bat" if not "%%i"=="deploy.sh" (
        rd /s /q "%%i" 2>nul
        del /q "%%i" 2>nul
    )
)

echo Moving build files...
xcopy /s /e /y dist\* . >nul
rmdir /s /q dist

echo Deploying to GitHub Pages...
git add .
git commit -m "Deploy to GitHub Pages" || echo No changes to commit
git push origin gh-pages --force

echo Deployment complete!
echo Your game is now available at: https://[your-username].github.io/ufo360/