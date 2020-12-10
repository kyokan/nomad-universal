import {Filter} from "./filter";
import {PostType} from "fn-client/lib/application/Post";

export type NapiResponse<payload> = {
  id: number;
  payload: payload;
  error?: boolean;
}

export type PostMeta = {
  replyCount: number;
  likeCount: number;
  pinCount: number;
};

export type ResponsePost = {
  hash: string;
  name: string;
  timestamp: Date;
  parent: string;
  context: string;
  content: string;
  topic: string;
  tags: string[];
  meta: PostMeta;
  title: string;
  type: PostType;
  moderationSetting: 'SETTINGS__FOLLOWS_ONLY' | 'SETTINGS__NO_BLOCKS' | null;
};

/**
 * {"id":1,"subdomain":"jchan6","tld":"nomadsub.","email":"test6@test.com","public_key":"","created_at":"2020-03-02T17:12:17.386019Z","updated_at":"2020-03-02T17:12:17.386019Z"}
 */
export type RelayerSignupResponse = {
  id: number;
  subdomain: string;
  tld: string;
  email: string;
  public_key: string;
  created_at: string;
  updated_at: string;
  message?: string;
}

/**
 * {"expiry":1583284340,"token":"02d3ffc0d0aba25183e10f55fb744152e3de08c78038746be8e03d20804a88c4"}
 */
export type RelayerLoginResponse = {
  expiry: string;
  token: string;
  message?: string;
}

/**
 * {
 *    "content":"hello, world",
 *    "guid":"75abc951-4eac-4781-b0e2-80cd8ea527ca",
 *    "refhash":"2d5917f0cb7ededd467705ce568fa41fbec5c1a4dc581bceb20f57b0df17278c",
 *    "subdomain":"jchan6",
 *    "tags":[],
 *    "timestamp":1583184076,
 *    "tld":"nomadsub."
 * }
 */
export type RelayerNewPostResponse = {
  message?: string;
  network_id: string;
  refhash: string;
  username: string;
  tld: string;
  timestamp: number;
  reference: string;
  body: string;
  topic: string;
  tags: string[];
}

/**
 * {
 *    "guid":"19f9b860-9023-4f1a-95d1-86e44565d475",
 *    "parent":"2d5917f0cb7ededd467705ce568fa41fbec5c1a4dc581bceb20f57b0df17278c",
 *    "refhash":"bf997c0d42a678c753bb03dba0daaf1abcb0c4093e1cae4e8e51a06a35688c91",
 *    "subdomain":"asdf2",
 *    "timestamp":1583197361,
 *    "tld":"nomadsub."
 * }
 */
export type RelayerNewReactionResponse = {
  message?: string;
  id: number;
  network_id: string;
  refhash: string;
  username: string;
  tld: string;
  timestamp: number;
  reference: string;
  type: 'LIKE' | 'PIN';
}

export type RelayerNewFollowResponse = {
  message?: string;
  id: number;
  network_id: string;
  refhash: string;
  username: string;
  tld: string;
  timestamp: number;
  connectee_tld: string;
  connectee_subdomain: string;
  type: 'FOLLOW';
}

export type RelayerNewBlockResponse = {
  message?: string;
  id: number;
  network_id: string;
  refhash: string;
  username: string;
  tld: string;
  timestamp: number;
  connectee_tld: string;
  connectee_subdomain: string;
  type: 'BLOCK';
}

export type FNDPeer = {
  ip: string;
  isBanned: boolean;
  isConnected: boolean;
  peerId: string;
  rxBytes: number;
  txBytes: number;
}

export type CustomViewProps = {
  title: string;
  iconUrl: string;
  heroImageUrl: string;
  filter: Filter;
}

export type UserData = {
  mutedNames: string[];
  hiddenPostHashes: string[];
  savedViews: CustomViewProps[];
  lastFlushed: number;
  updateQueue: string[];
  offset: number;
}
