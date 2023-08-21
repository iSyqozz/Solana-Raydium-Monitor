# DexSpyder Raydium Monitor

DexSpyder Raydium Monitor is a background monitor that detects newly created Raydium pools and sends information about them as Discord embeds to the specified clients.

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Auto Launch](#auto-launch)
- [Contributing](#contributing)
- [License](#license)

## Description

DexSpyder Monitor is a utility written in TypeScript that monitors newly created Raydium pools on the Solana blockchain. It sends real-time updates to Discord channels through embeds, notifying clients about new pool creations. The application leverages the Metaplex and Solana JavaScript libraries for blockchain interactions.

## Installation

1. Clone this repository to your local machine.
2. Navigate to the cloned directory: `cd <cloned-dir-name>`.
3. Install dependencies using your package manager of choice: `npm install` or `yarn install`.

## Usage

1. Update the `clients.json` file with the Discord webhook URLs of your clients.
2. Configure your Discord webhook to receive embeds.
3. Set the RPC URL for Solana by replacing `'YOUR-RPC-URL-HERE'` in the `main()` function.
4. Run the application: `npm start` or `yarn start`.

## Configuration

- `clients.json`: Contains an array of clients with their Discord webhook URLs. Clients can be configured with optional branding information for customized embeds.

## Auto Launch

The provided auto launch bash script ensures that the application is always running in the background. If it's not running, the script restarts it.

```bash
#!/bin/bash

while true; do
    if ! pgrep -f "fetch_metadata.js" > /dev/null; then
        echo "fetch_metadata.js is not running"
        echo "starting fetch_metadata.js"
        nohup node fetch_metadata.js & disown
    fi
    sleep 5
done
```

## Contributing

Contributions are welcome! If you find a bug or want to enhance the application, feel free to create an issue or submit a pull request!

