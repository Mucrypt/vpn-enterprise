#!/usr/bin/env node
'use strict'

const path = require('path')
const fs = require('fs')
const minimist = require('minimist')

function loadVpnCore() {
  const distPath = path.resolve(__dirname, '../packages/vpn-core/dist')
  const entryPath = path.join(distPath, 'index.js')

  if (!fs.existsSync(entryPath)) {
    const msg = [
      'vpn-core is not built yet.',
      `Missing: ${entryPath}`,
      'Build it first:',
      '  npm run build --workspace=@vpn-enterprise/vpn-core',
      'Then re-run:',
      '  npm run generate-client-cli -- <clientName> [--out /tmp/wgtest] [--publicIP x.x.x.x] [--port 51820] [--iface wg0] [--qr]',
    ].join('\n')
    throw new Error(msg)
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  return require(distPath)
}

async function main() {
  const argv = minimist(process.argv.slice(2))

  const clientName = argv._[0] || argv.name || 'cli-client1'
  const outDir = argv.out || argv.dir || '/tmp/wgtest'
  const publicIP = argv.publicIP || argv.publicIp || '127.0.0.1'
  const port = argv.port ? Number(argv.port) : 51820
  const interfaceName = argv.iface || 'wg0'
  const showQR = argv.qr || argv.q

  const core = loadVpnCore()
  const VPNServerManager = core.VPNServerManager

  if (!VPNServerManager) {
    throw new Error(
      'VPNServerManager was not found in @vpn-enterprise/vpn-core dist export',
    )
  }

  const mgr = new VPNServerManager({
    testMode: true,
    wgDir: outDir,
    publicIP,
    interfaceName,
    port,
  })

  try {
    console.log(
      `Creating client '${clientName}' (testMode) -> configs at ${outDir}`,
    )
    const client = await mgr.createClient(clientName)
    const confPath = path.join(outDir, 'clients', `${client.name}.conf`)

    console.log('\nClient created:')
    console.log(JSON.stringify(client, null, 2))

    if (fs.existsSync(confPath)) {
      const conf = fs.readFileSync(confPath, 'utf8')
      console.log('\n--- Generated config ---\n')
      console.log(conf)

      if (showQR) {
        try {
          // eslint-disable-next-line global-require
          const qrcode = require('qrcode-terminal')
          console.log('\n--- QR (scan with WireGuard app) ---\n')
          qrcode.generate(conf, { small: true })
        } catch {
          console.warn(
            'qrcode-terminal not installed. Install with: npm i -D qrcode-terminal',
          )
        }
      }
    } else {
      console.error('Config file not found at', confPath)
      process.exitCode = 1
    }
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err)
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err)
  process.exit(1)
})
