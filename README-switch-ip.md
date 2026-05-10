# Switch IP quick guide

Edit the `HOST_IP` line in `.env.local.example` (or copy it to `.env.local`) to change the IP used by local scripts and apps.

Steps:

1. Open `.env.local.example`.
2. Replace the `HOST_IP` value with the desired IPv4 address (for example, `HOST_IP=172.19.64.1`).
3. Save the file.
4. If your apps read `.env.local`, copy or rename the file:

   cp .env.local.example .env.local

Notes:

- Keep one active `HOST_IP` line — comment out or remove other `HOST_IP` lines.
- Use the example commented values as quick references for common interfaces.
