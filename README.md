# UFO 360 Game

An exciting 3D UFO flight game built with React, Three.js, and TypeScript.

## Deployment Instructions

This project is configured for deployment to GitHub Pages using multiple methods.

### Method 1: GitHub Actions (Automatic Deployment)

This repository includes a GitHub Actions workflow that automatically deploys the game to GitHub Pages whenever you push to the `main` branch.

1. Push your changes to the `main` branch
2. The GitHub Actions workflow will automatically build and deploy the game to GitHub Pages
3. Your game will be available at: `https://[your-username].github.io/ufo360/`

### Method 2: Using the Deploy Script

You can use the provided deployment scripts:

**On Windows:**
```
deploy.bat
```

**On macOS/Linux:**
```
chmod +x deploy.sh
./deploy.sh
```

### Method 3: Manual Deployment with npm

1. Build the project:
   ```
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

### Method 4: Manual Deployment

If you prefer to deploy manually:

1. Build the project:
   ```
   npm run build
   ```

2. The built files will be in the `dist` folder

3. Deploy the contents of the `dist` folder to any static hosting service

### Local Development

To run the game locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Game Controls

- **Spacebar** or **Up Arrow**: Flap/UFO thrust
- **Mouse/Touch**: Camera control in setup mode
- **Scroll/Pinch**: Zoom in/out in camera setup mode
- **P** or **Escape**: Pause/Resume game

## Project Structure

- `src/` - Source code
- `components/` - React components
- `hooks/` - Custom React hooks
- `dist/` - Built files (generated after build)
- `.github/workflows/` - GitHub Actions workflows

Enjoy the game!