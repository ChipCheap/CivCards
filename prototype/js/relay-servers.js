// The servers a browser asks for its public address and, when two networks block a direct connection,
// relays messages through. They come from the developer's free Metered account. The credentials are
// public in the page source, which is accepted: the account is capped and has no payment card.
// The port-443 entries matter most: networks that block everything else still allow that port, because
// ordinary HTTPS uses it. Giving PeerJS this list replaces its own servers, whose relay runs on port
// 3478 only.
const METERED_USERNAME = "50c281f331e3d2bad5e1773c";
const METERED_CREDENTIAL = "vM6tLoo0ka7uzYVp";

export const RELAY_SERVERS = Object.freeze([
  { urls: "stun:stun.relay.metered.ca:80" },
  { urls: "turn:global.relay.metered.ca:80", username: METERED_USERNAME, credential: METERED_CREDENTIAL },
  { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: METERED_USERNAME, credential: METERED_CREDENTIAL },
  { urls: "turn:global.relay.metered.ca:443", username: METERED_USERNAME, credential: METERED_CREDENTIAL },
  { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: METERED_USERNAME, credential: METERED_CREDENTIAL },
]);
