# Same Day Home Solutions

This application is designed to run locally on your computer and load Word templates from the project folder without CORS errors.

## Launching the app

### macOS one-click launch

Double-click `launch.command`.

That script:

1. Starts a local HTTP server from the project folder.
2. Uses the stable localhost port `60691` when available.
3. Opens Google Chrome.
4. Loads the app from `http://localhost:60691/`.

### Windows launch

Double-click `launch.bat`.

### npm scripts

- `npm run open` starts the local server and opens Google Chrome automatically.
- `npm run dev` starts the local server without opening a browser.

## Why this is required

The document engine loads DOCX templates with `fetch()`. When the app is opened directly with `file://`, Chrome blocks template requests. Serving the app over `http://localhost` keeps template loading on the same origin and eliminates those CORS errors.

## What to expect

- The Dashboard opens automatically when the app launches.
- Templates are loaded from the local `templates/` folder.
- Contract generation works normally from the local server.
