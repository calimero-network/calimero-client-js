[![SDK publish gh action](https://github.com/calimero-network/calimero-client-js/actions/workflows/calimero_sdk_publish.yml/badge.svg)](https://github.com/calimero-network/core/actions/workflows/calimero_sdk_publish.yml)
[![npm version](https://badge.fury.io/js/@calimero-network%2Fcalimero-client.svg)](https://badge.fury.io/js/@calimero-network%2Fcalimero-client)

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets-global.website-files.com/6256e0ccf395021e66e913b6/65cb5711287e06754d171147_calimero_logo_white.svg">
    <img alt="Daytona logo" style="" src="https://assets-global.website-files.com/6256e0ccf395021e66e913b6/65cb5711287e06754d171147_calimero_logo_white.svg" width="40%">
  </picture>
</div>

### TypeScript Client SDK Overview

The **Calimero TypeScript Client SDK** helps developers interact with decentralized apps by handling server communication. It simplifies the process, letting you focus on building your app while the SDK manages the technical details. Built with TypeScript, it ensures a smoother development experience with reliable tools.

The SDK has two main parts: `RpcClient` for sending queries and updates to the server, and `SubscriptionsClient` for subscribing to real-time updates. Both are designed to be easy to use and flexible, making it simple to adapt to future updates.

### Quick Examples

1. **Using `JsonRpcClient`**:

   ```typescript
   const rpcClient = new JsonRpcClient(
     process.env['NEXT_PUBLIC_API_URL'],
     '/jsonrpc',
   );
   const params = {
     applicationId: process.env['NEXT_PUBLIC_APPLICATION_ID'],
     method: 'create_post',
     argsJson: { title: 'My First Post', text: 'This is my first post' },
   };
   const response = await rpcClient.mutate(params);
   console.log(response);
   ```

2. **Using `WsSubscriptionsClient`**:
   ```typescript
   const subscriptionsClient = new WsSubscriptionsClient(
     process.env['NEXT_PUBLIC_API_URL'],
     '/ws',
   );
   await subscriptionsClient.connect();
   subscriptionsClient.subscribe([process.env['NEXT_PUBLIC_APPLICATION_ID']]);
   subscriptionsClient.addCallback((data) => console.log(data));
   ```

The SDK keeps things simple, letting you build decentralized apps efficiently without worrying about server details.
