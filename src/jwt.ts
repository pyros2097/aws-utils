import * as Axios from 'axios';
import * as jsonwebtoken from 'jsonwebtoken';
const jwkToPem = require('jwk-to-pem');

export interface ClaimVerifyResult {
  readonly sub: string;
}

interface TokenHeader {
  kid: string;
  alg: string;
}
interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}
interface PublicKeyMeta {
  instance: PublicKey;
  pem: string;
}

interface PublicKeys {
  keys: PublicKey[];
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}

interface Claim {
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  username: string;
  sub: string;
  client_id: string;
}

const cognitoPoolId = process.env.USER_POOL || '';
const region = process.env.AWS_REGION || '';
if (!cognitoPoolId) {
  throw new Error('env var required for cognito pool');
}
if (!region) {
  throw new Error('env var required for region');
}
const cognitoIssuer = `https://cognito-idp.${region}.amazonaws.com/${cognitoPoolId}`;

let cacheKeys: MapOfKidToPublicKey | undefined;
const getPublicKeys = async (): Promise<MapOfKidToPublicKey> => {
  if (!cacheKeys) {
    const url = `${cognitoIssuer}/.well-known/jwks.json`;
    const publicKeys = await Axios.default.get<PublicKeys>(url);
    cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {} as MapOfKidToPublicKey);
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};

export const getToken = async (token: string): Promise<ClaimVerifyResult> => {
  const tokenSections = (token || '').split('.');
  if (tokenSections.length < 2) {
    throw new Error('requested token is invalid');
  }
  const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
  const header = JSON.parse(headerJSON) as TokenHeader;
  const keys = await getPublicKeys();
  const key = keys[header.kid];
  if (key === undefined) {
    throw new Error('claim made for unknown kid');
  }
  const claim = jsonwebtoken.verify(token, key.pem) as Claim;
  const currentSeconds = Math.floor(new Date().valueOf() / 1000);
  if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
    throw new Error('claim is expired or invalid');
  }
  if (claim.iss !== cognitoIssuer) {
    throw new Error('claim issuer is invalid');
  }
  if (claim.token_use !== 'id') {
    throw new Error('claim use is not id');
  }
  return { sub: claim.sub };
};
