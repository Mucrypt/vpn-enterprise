#!/usr/bin/env node
"use strict";
const path = require('path');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

async function main() {
  const clientName = argv._[0] || argv.name || 'cli-client1';
  const outDir = argv.out || argv.dir || '/tmp/wgtest';
  const publicIP = argv.publicIP || '127.0.0.1';
  const port = argv.port ? Number(argv.port) : 51820;
  const interfaceName = argv.iface || 'wg0';
  const showQR = argv.qr || argv.q;

  // require vpn-core built dist
  const core = require(path.resolve(__dirname, '../packages/vpn-core/dist'));
  const VPNServerManager = core.VPNServerManager;

  const mgr = new VPNServerManager({ testMode: true, wgDir: outDir, publicIP, interfaceName, port });

  try {
    console.log(`Creating client '${clientName}' (testMode) -> configs at ${outDir}`);
    const client = await mgr.createClient(clientName);
    const confPath = path.join(outDir, 'clients', `${client.name}.conf`);

    console.log('\nClient created:');
    console.log(JSON.stringify(client, null, 2));

    if (fs.existsSync(confPath)) {
      const conf = fs.readFileSync(confPath, 'utf8');
      console.log('\n--- Generated config ---\n');
      console.log(conf);

      if (showQR) {
        // Try to print terminal QR (qrcode-terminal)
        try {
          const qrcode = require('qrcode-terminal');
          console.log('\n--- QR (scan with WireGuard app) ---\n');
          qrcode.generate(conf, { small: true });
        } catch (e) {
          console.warn('`qrcode-terminal` not installed. Install it with `npm i -g qrcode-terminal` to see a QR in terminal.');
        }
      }
    } else {
      console.error('Config file not found at', confPath);
    }
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

main();
