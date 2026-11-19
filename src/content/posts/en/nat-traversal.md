---
title: "How NAT traversal works: the principles and enterprise practice"
description: How two machines behind NATs connect directly without a server in the middle. Firewall hole punching, STUN, hard NATs, relays, and ICE, and why enterprise firewalls and cloud NAT gateways are always the hardest layer.
date: 2026-11-19
category: network
tags: [Networking, NAT, P2P, WireGuard]
translationKey: nat-traversal
---

A direct peer-to-peer connection (one that doesn't go through a relay server) has the lowest latency and the best bandwidth, but two machines are usually separated by **stateful firewalls** and **NAT**. This post walks through NAT traversal end to end: basic firewall hole punching, hard NATs, relays, ICE path selection, and practical advice for enterprise and cloud environments. It draws mainly on Tailscale's public engineering writing; sources are listed at the end.

## The problem: both sides wait for the other to speak first

Almost every firewall (Windows Firewall, ufw, AWS Security Groups, home routers) defaults to "**allow outbound, block unsolicited inbound**". For UDP, that means: once I've sent a packet to `B:port`, packets coming back from `B:port` are allowed in.

A client talking to a server is fine, because the client always speaks first. But when both machines sit behind firewalls, each one waits for the other to send first, and whoever sends first has their packet dropped by the other side's firewall. Neither gets through.

## Fix one: both sides send at once

The key is that the firewall rule only requires that **this side has sent something first**. So both sides send to each other **at roughly the same time**:

1. A sends to B. B's firewall drops it, but **A's firewall now remembers the session**.
2. B sends to A. B's firewall now remembers too, and A's firewall treats this packet as a reply and lets it in.
3. Both firewalls hold state, and packets flow both ways from then on.

The trick has three requirements:

- **You need the other side's `ip:port`**: a side channel (a coordination server) exchanges addresses. It's cheap: a few seconds of latency is fine and the total traffic is a few KB, so one small server can serve thousands of machines.
- **Timing has to line up**: each side must send while the other side's firewall state still exists, so the side channel coordinates timing too.
- **Keep it alive**: firewalls forget idle UDP sessions, commonly after around 30 seconds, so you need keepalives.

There are also two prerequisites. The protocol **must be UDP** (TCP traversal is possible but much harder; if you need a stream, run QUIC over UDP). And the program must **control the socket it sends and receives on directly**, because traversal packets have to share the same socket as the real traffic.

## NAT makes it harder: you don't know what you look like from outside

A NAT is a firewall that also rewrites addresses. When a laptop at `192.168.0.20:1234` sends a packet out, the home router rewrites the source to a public `2.2.2.2:4242`. The catch: **that public port is chosen at the moment the packet goes out**. The laptop doesn't know it, so it can't tell the other side.

### STUN: ask someone "who do you see?"

STUN (RFC 8489) is straightforward. Send a request to a public server, and it replies "your source looks like `2.2.2.2:4242`". Then share that address with the peer through the side channel.

One detail matters: **the socket you use for STUN must be the socket you send data on**. A NAT creates a separate mapping per socket, so a different socket gets a different public port.

### Easy NAT and hard NAT

STUN has a hidden assumption: **the port the STUN server sees is the port everyone else sees**. That isn't always true:

| | Mapping behaviour | Does STUN help? |
| --- | --- | --- |
| **Easy NAT** | The same public port for every destination (endpoint-independent mapping) | Yes. Most home routers are like this |
| **Hard NAT** | A new public port per destination (endpoint-dependent mapping) | No. The port STUN saw is only valid for the STUN server |

The textbook categories (Full Cone, Restricted Cone, Port-Restricted Cone, Symmetric) are outdated. RFC 4787's two independent dimensions are more accurate: **mapping behaviour** and **filtering behaviour**. The simultaneous-send trick copes with every kind of filtering, so **only the mapping behaviour decides success**. For traversal, "easy versus hard" is enough.

### Where the hard NATs are

Hard NATs cluster in three places, which are also where traversal fails most often:

- **Enterprise firewalls**: the more a device is marketed as "secure", the more likely it's a hard NAT. Defaults vary by vendor:
  - **pfSense / OPNsense**: the underlying FreeBSD PF defaults to hard NAT. A patch from late 2024 gives PF easy-NAT mapping, but users only benefit once router distributions ship it.
  - **Sophos**: preserves source ports by default, which is traversal-friendly.
  - **Palo Alto**: PAN-OS 11.1 added a "Persistent NAT" option you can turn on.
  - **UniFi**: its intrusion-prevention rules may classify P2P traffic as a threat and block it by default.
- **CGNAT**: an extra NAT layer run by the ISP, covered below.
- **Cloud NAT gateways**:

| Cloud | NAT gateway behaviour |
| --- | --- |
| **AWS NAT Gateway** | Always hard NAT, with a random source port per destination. Not configurable |
| **Azure NAT Gateway** | Hard NAT by default, with no setting to change it |
| **Google Cloud NAT** | Hard NAT by default; easy NAT with **static port allocation**, at the cost of a fixed port block per VM, which limits scale |

So **two machines both behind cloud NAT gateways almost never connect directly**. Plan for that when designing cloud architecture.

## When traversal fails: relays

Many implementations give up when they hit a hard NAT. The right approach is to **always have a fallback**: a relay server both sides can reach that forwards packets. The cost is somewhat higher latency and possibly less bandwidth, and only when a direct connection fails.

There's another reason a relay is non-negotiable. Some networks block almost all outbound UDP, such as guest Wi-Fi that only allows DNS. There, a relay is the only way.

The classic relay protocol is TURN (RFC 8656). Tailscale's design is a good reference: it splits relaying into three tiers, tried in order:

**Direct → Peer Relay → DERP**

| | DERP | Peer Relay |
| --- | --- | --- |
| **Run by** | Tailscale, as a shared managed relay | Any machine on your own network |
| **Transport** | TCP over TLS, usually on port 443 | UDP, needing just one open port |
| **Strength** | Gets through even the strictest networks | Sits next to the resources it serves; throughput close to direct |
| **Weakness** | TCP adds latency; shared bandwidth is limited | Both sides must reach that UDP port |

- **DERP** forwards already-encrypted packets by public key, so the relay can't read them. It **doubles as the side channel**: address exchange and hole-punch coordination go through it. It's the final fallback and isn't being replaced.
- **A Peer Relay** only forwards for nodes on the same network that have permission. Early design partners measured throughput close to a direct connection. One cross-border user went from about 2.2 Mbps over DERP to 27.5 Mbps, but that's a single anecdote, not a benchmark.

With STUN, simultaneous send, and a relay as backup, **over 90% of connections end up direct**.

## Advanced tricks for the remaining hard cases

### The birthday paradox: guessing a hard NAT's port

When one side is behind an easy NAT and the other behind a hard NAT, the easy side knows the other's IP but not the port. Brute-forcing all 65,535 ports at 100 packets per second takes up to 10 minutes in the worst case, and it looks like a port scan that intrusion detection might flag.

The birthday paradox helps. The hard side opens **256 sockets** and the easy side probes random ports. Any single match is enough:

| Probes from the easy side | Success rate |
| --- | --- |
| 174 | 50% |
| 256 | 64% |
| 1,024 | 98% |
| 2,048 | 99.9% |

At 100 packets per second, half of attempts connect within 2 seconds, and within 20 seconds success is nearly certain, having probed under 4% of the port space. This matches the most common cases, "home to office" and "home to cloud": home routers tend to be easy, office and cloud gateways tend to be hard.

**With hard NATs on both sides it stops being practical.** Both sides' source ports are random, so the search space is squared. Reaching 99.9% takes about 170,000 probes per side, roughly 28 minutes. The probes can also exhaust the NAT's session table; a Juniper SRX 300, for example, has a 64,000-session limit, which a single brute-force attempt could fill. In that case, just use the relay.

### Port mapping protocols: ask the router to open the door

Three protocols ask the local gateway to forward a public port to you:

- **UPnP IGD**: a 1990s design with XML and SOAP. Complex to implement, with a history of serious vulnerabilities, but the most widespread.
- **NAT-PMP** (RFC 6886): designed by Apple, does only port forwarding, and is simple.
- **PCP** (RFC 6887): the successor to NAT-PMP.

When one works, it's a "supercharged STUN": you learn your public address *and* the NAT opens that port to everyone, so even a hard NAT becomes traversable.

The problem is that these protocols are often disabled, and many devices have a single checkbox that turns off all three, including the safer NAT-PMP and PCP. UPnP's security concerns also make it less and less dependable, so the more fundamental fix is for **NAT devices to use easy-NAT mapping**, with port mapping as a bonus.

One implementation detail: when a router reboots, existing mappings disappear. The client should detect this (NAT-PMP and PCP responses carry an epoch value that resets on reboot) and re-create the mapping, rather than silently falling back to the relay.

### Double NAT and CGNAT

- **Double NAT** is mostly invisible to traversal, because the peer only sees the outermost layer. Port mapping breaks, though: it can only ask the nearest NAT to open a port.
- **CGNAT** is an extra NAT layer run by the ISP so many homes can share a few IPv4 addresses. The special case is **two machines behind the same CGNAT**. STUN reports the outermost address, so connecting needs the NAT to support **hairpinning** (looping a packet addressed to its own public side back inside). Many NATs don't, so again it's the relay.

### IPv6: no NAT, but still firewalls

IPv6 has enough addresses that NAT isn't needed, so STUN, birthday probing, port mapping, and hairpinning can all go. But **stateful firewalls remain**, so simultaneous send, the side channel, and relays are still required.

IPv6 isn't widespread enough yet either: Google's statistics only passed 50% for a single day in March 2026, and it varies widely by region. IPv6 is one more path, not a replacement for the whole IPv4 toolkit.

IPv6-only networks reach IPv4 through NAT64 and DNS64. Phones usually hide this behind CLAT; desktops and servers have to detect the NAT64 prefix themselves by querying `ipv4only.arpa`. This is a niche case.

## Putting it together: the ICE approach

Each network environment needs different tricks, and **diagnosing every network and applying a specific fix doesn't scale**. The core idea of ICE (RFC 8445) is: **try everything at once and keep the best path**.

1. **Gather candidate addresses**: LAN IPv4, IPv6, the public address from STUN, the address from port mapping, and any addresses an operator configured.
2. **Exchange candidate lists over the side channel.**
3. **Probe every candidate**: probes do two jobs. They open NAT and firewall state, and they act as authenticated ping/pong to measure whether each path works.
4. **Pick the best path**: classic ICE ranks by type (LAN first, then public, then through NAT). A better approach is to rank by **measured round-trip latency**. The result is usually the same, without guessing.

Some practical choices:

- **Don't wait for probing to finish before sending data**: start every connection on the relay so data flows immediately, and find better paths in the background. The upgrade to direct usually happens within seconds.
- **Downgrade when a path breaks**: for example when a NAT reboots and loses its state. Fall back to the relay and search again, which is simpler than keeping standby paths warm.
- **End-to-end encryption is mandatory**: once paths change, you can't trust an IP to tell you who the peer is. If the protocol above is already encrypted (WireGuard, or QUIC's TLS), a spoofed probe can at worst send traffic the long way round. Even so, the probe packets themselves should be authenticated and encrypted.

## Enterprise and cloud practice

- **Assume the corporate side won't get through**: enterprise gateways are where traversal fails most. When designing a P2P feature, plan the relay as part of the normal path, not an exception.
- **Don't rely on NAT gateways for cloud hosts**: for machines that need direct connections, in order of preference:
  1. Give it a public IPv4 (an Elastic IP on AWS) and allow the WireGuard UDP port, ideally only from your other nodes' IP ranges. This is the strongest recommendation for critical infrastructure.
  2. Run your own NAT instance, or pfSense / OPNsense configured for easy NAT.
  3. On GCP, switch to static port allocation.
  4. Put a UDP load balancer (AWS NLB, Azure Standard LB) in front, though this isn't officially supported.
  5. As a last resort, put a relay inside the VPC.
- **A self-hosted relay beats a detour**: one UDP relay at the network edge or inside the VPC needs **one** firewall exception, and a whole office or VPC no longer has to detour through a shared external relay. Latency and bandwidth are much better.
- **The final fallback should run over HTTPS**: the strictest networks allow only DNS or HTTP(S), so the outermost relay should run on TLS port 443, and it should be close to users to keep the detour short.
- **Check the firewall's NAT and IPS settings**: see whether easy-NAT mapping can be enabled (such as Palo Alto's Persistent NAT), and whether intrusion-prevention rules treat P2P traffic as a threat.
- **Treat UPnP separately**: UPnP has security concerns, but NAT-PMP and PCP are comparatively simple. If the device allows it, don't switch all three off with one checkbox.
- **Don't use the birthday trick routinely**: it fills session tables and looks like a port scan, which can trigger an IDS. Many machines doing it at once behind one gateway can bring the gateway down.
- **Account for idle timeouts**: enterprise firewalls may have short UDP timeouts, so the keepalive interval has to be shorter.
- **Don't authenticate by IP**: every path needs end-to-end authentication and encryption.

## Checklist

- **What you need**: a UDP protocol, direct control of the socket, a side channel to the peer, a couple of STUN servers, and a set of relay servers (ideally both a UDP relay and an HTTPS fallback relay).
- **Steps**:
  1. List the `ip:port` of every local network interface.
  2. Ask STUN for your public address, and work out whether the NAT is easy or hard.
  3. Try the port mapping protocols, and re-create mappings after a router reboot.
  4. If there's NAT64, get a public IPv4 address through it.
  5. Exchange addresses and keys over the side channel.
  6. Start sending data through the relay.
  7. Probe every candidate address, using the birthday trick for hard NATs if needed.
  8. Choose paths in the order direct, self-hosted relay, shared relay; upgrade seamlessly when a better one appears and downgrade when one breaks.
  9. Encrypt and authenticate end to end throughout.

No single trick gets through every NAT. **Stack all of them, keep a relay that always works, and you can connect from anywhere.**

## References

- David Anderson, "[How NAT traversal works](https://tailscale.com/blog/how-nat-traversal-works)", Tailscale Blog; [Chinese translation](https://arthurchiao.art/blog/how-nat-traversal-works-zh/) by Arthur Chiao
- Tailscale, "[NAT traversal improvements, pt. 1](https://tailscale.com/blog/nat-traversal-improvements-pt-1)", "[pt. 2: cloud environments](https://tailscale.com/blog/nat-traversal-improvements-pt-2-cloud-environments)", "[pt. 3: looking ahead](https://tailscale.com/blog/nat-traversal-improvements-pt3-looking-ahead)"
- Tailscale, "[Introducing Tailscale Peer Relays](https://tailscale.com/blog/peer-relays-beta)"; [Peer Relays documentation](https://tailscale.com/kb/1591/peer-relays)
- APNIC Blog, "[Google hits 50% IPv6](https://blog.apnic.net/2026/04/28/google-hits-50-ipv6)"
- RFC 4787 (NAT behaviour for UDP), RFC 6886 (NAT-PMP), RFC 6887 (PCP), RFC 8445 (ICE), RFC 8489 (STUN), RFC 8656 (TURN)
