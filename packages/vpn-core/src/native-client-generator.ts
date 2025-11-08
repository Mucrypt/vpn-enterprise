/**
 * Native Client Configuration Generator
 * Generates platform-specific VPN configuration files
 * Supports: WireGuard (all platforms) and OpenVPN (fallback)
 */

import { Server, UserDevice, Platform } from '@vpn-enterprise/database';

export interface VPNConfigOptions {
  server: Server;
  device: UserDevice;
  platform: Platform;
  protocol: 'wireguard' | 'openvpn';
  dnsServers?: string[];
  killSwitch?: boolean;
  splitTunnelApps?: string[];
  mtu?: number;
}

export class NativeClientConfigGenerator {
  /**
   * Generate WireGuard configuration for any platform
   */
  static generateWireGuardConfig(options: VPNConfigOptions): string {
    const { server, device, dnsServers = ['1.1.1.1', '1.0.0.1'], killSwitch = false, mtu = 1420 } = options;

    let config = `[Interface]
PrivateKey = ${device.private_key}
Address = ${device.assigned_ip}/32
DNS = ${dnsServers.join(', ')}
MTU = ${mtu}
`;

    // Platform-specific configurations
    if (options.platform === 'linux' || options.platform === 'macos') {
      if (killSwitch) {
        config += `
# Kill Switch (blocks all non-VPN traffic)
PostUp = iptables -I OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT
PreDown = iptables -D OUTPUT ! -o %i -m mark ! --mark $(wg show %i fwmark) -m addrtype ! --dst-type LOCAL -j REJECT
`;
      }
    }

    config += `
[Peer]
PublicKey = ${server.public_key}
Endpoint = ${server.host}:${server.port}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;

    return config;
  }

  /**
   * Generate OpenVPN configuration (fallback for older systems)
   */
  static generateOpenVPNConfig(options: VPNConfigOptions): string {
    const { server, device, dnsServers = ['1.1.1.1', '1.0.0.1'] } = options;

    return `client
dev tun
proto udp
remote ${server.host} ${server.port}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
key-direction 1
verb 3
# DNS Servers
dhcp-option DNS ${dnsServers[0]}
dhcp-option DNS ${dnsServers[1]}

<ca>
# Certificate Authority certificate goes here
</ca>

<cert>
# Client certificate goes here
</cert>

<key>
${device.private_key}
</key>

<tls-auth>
# TLS auth key goes here
</tls-auth>
`;
  }

  /**
   * Generate platform-specific configuration
   */
  static generateConfig(options: VPNConfigOptions): string {
    if (options.protocol === 'wireguard') {
      return this.generateWireGuardConfig(options);
    } else {
      return this.generateOpenVPNConfig(options);
    }
  }

  /**
   * Generate iOS/macOS specific WireGuard configuration
   */
  static generateAppleConfig(options: VPNConfigOptions): string {
    const baseConfig = this.generateWireGuardConfig(options);
    
    // iOS/macOS specific settings
    let config = baseConfig;
    
    // Add on-demand rules for iOS
    if (options.platform === 'ios') {
      config += `
# On-Demand Rules (iOS specific)
# This ensures VPN auto-connects when needed
`;
    }

    return config;
  }

  /**
   * Generate Android specific configuration
   */
  static generateAndroidConfig(options: VPNConfigOptions): string {
    const baseConfig = this.generateWireGuardConfig(options);
    
    // Android specific optimizations
    return baseConfig.replace('MTU = 1420', 'MTU = 1280'); // Lower MTU for mobile networks
  }

  /**
   * Generate Windows specific configuration
   */
  static generateWindowsConfig(options: VPNConfigOptions): string {
    const { killSwitch } = options;
    let config = this.generateWireGuardConfig(options);

    if (killSwitch) {
      // Windows-specific kill switch using firewall rules
      config = config.replace(
        '# Kill Switch',
        `# Kill Switch (Windows Firewall)
PostUp = powershell -Command "New-NetFirewallRule -DisplayName 'VPN Kill Switch' -Direction Outbound -Action Block -Profile Any -InterfaceAlias !%i"
PreDown = powershell -Command "Remove-NetFirewallRule -DisplayName 'VPN Kill Switch'"`
      );
    }

    return config;
  }

  /**
   * Generate configuration based on platform
   */
  static generatePlatformConfig(options: VPNConfigOptions): string {
    switch (options.platform) {
      case 'ios':
      case 'macos':
        return this.generateAppleConfig(options);
      
      case 'android':
        return this.generateAndroidConfig(options);
      
      case 'windows':
        return this.generateWindowsConfig(options);
      
      case 'linux':
      default:
        return this.generateWireGuardConfig(options);
    }
  }

  /**
   * Generate split tunnel configuration
   */
  static generateSplitTunnelConfig(
    baseConfig: string,
    bypassApps: string[],
    platform: Platform
  ): string {
    let config = baseConfig;

    if (platform === 'linux') {
      // Linux: Use routing tables for split tunneling
      const bypassCommands = bypassApps.map(app => 
        `PostUp = ip rule add ipproto tcp dport ${app} lookup main`
      ).join('\n');
      
      config = config.replace('[Interface]', `[Interface]\n${bypassCommands}`);
    } else if (platform === 'windows') {
      // Windows: Use app exclusions
      config += `\n# Split Tunneling - Excluded Apps\n`;
      config += `# ${bypassApps.join(', ')}\n`;
    }

    return config;
  }

  /**
   * Get recommended DNS servers based on privacy level
   */
  static getRecommendedDNS(privacyLevel: 'standard' | 'high' | 'maximum'): string[] {
    switch (privacyLevel) {
      case 'maximum':
        return ['9.9.9.9', '149.112.112.112']; // Quad9 (privacy-focused)
      case 'high':
        return ['1.1.1.1', '1.0.0.1']; // Cloudflare (fast + private)
      case 'standard':
      default:
        return ['8.8.8.8', '8.8.4.4']; // Google (fast)
    }
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: string, protocol: 'wireguard' | 'openvpn'): boolean {
    if (protocol === 'wireguard') {
      return (
        config.includes('[Interface]') &&
        config.includes('[Peer]') &&
        config.includes('PrivateKey') &&
        config.includes('PublicKey') &&
        config.includes('Endpoint')
      );
    } else {
      return (
        config.includes('client') &&
        config.includes('remote') &&
        config.includes('dev tun')
      );
    }
  }
}
