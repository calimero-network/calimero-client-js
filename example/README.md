# Calimero SDK Example

This example demonstrates basic usage of the Calimero SDK for context management, event subscriptions, and method execution.

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and fill in your actual values:

   ```env
   VITE_CALIMERO_CLIENT_APP_ID=your_client_application_id_here
   VITE_CALIMERO_APP_PATH=your_application_path_here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Features

- **Context Management**: Fetch, create, and manage Calimero contexts
- **Event Subscriptions**: Subscribe/unsubscribe to context events
- **Method Execution**: Execute contract methods via modal interface
- **Real-time Events**: View live event logs from subscribed contexts

## Environment Variables

- `VITE_CALIMERO_CLIENT_APP_ID`: Your Calimero client application ID
- `VITE_CALIMERO_APP_PATH`: Path to your Calimero application WASM file

**Note**: Never commit your actual `.env` file to version control. The `.env.example` file is provided as a template.
