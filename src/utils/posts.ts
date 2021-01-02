import {ResponsePost} from "./types";
import {Envelope as DomainEnvelope} from 'fn-client/lib/application/Envelope';
import {Post as DomainPost} from 'fn-client/lib/application/Post';
import {INDEXER_API} from "./api";
import {DraftPost} from "../ducks/drafts/type";
import {PostType, RelayerPostModel} from "../types/posts";
import {serializeUsername} from "./user";
import {Post} from "../ducks/posts";
import {markup} from "./rte";

export function getCSSImageURLFromPostHash (link: string): string {
  return `url(${replaceLink(link)})`;
}

export function getCSSImageURLFromAvatarType (_avatarType: string, username: string) {
  const avatarType = _avatarType.trim().replace(/\u21b5/g,'') || 'identicon';
  if (avatarType === '_') {
    return `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVAAAAEYAQMAAAAwLTybAAAAA1BMVEXy8vJkA4prAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAI0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAA4McALwgAAQoNfCUAAAAASUVORK5CYII=')`;
  }
  return `url(${INDEXER_API}/avatars/${avatarType}/${username}.svg)`
}

export function getImageURLFromPostHash (link: string): string {
  return replaceLink(link);
}

export function getImageURLFromAvatarType (_avatarType: string, username: string): string {
  const avatarType = _avatarType.trim().replace(/\u21b5/g,'') || 'identicon';
  if (avatarType === '_') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAVAAAAEYAQMAAAAwLTybAAAAA1BMVEXy8vJkA4prAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAI0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAA4McALwgAAQoNfCUAAAAASUVORK5CYII=';
  }

  if (!username) {
    return '';
  }
  return `${INDEXER_API}/avatars/${avatarType}/${username}.svg`;
}

export const mapDomainEnvelopeToPost = (env: DomainEnvelope<DomainPost>): ResponsePost => {
  return {
    title: env.message.title || '',
    content: env.message.body || '',
    name: serializeUsername(env.subdomain, env.tld),
    timestamp: env.createdAt || 0,
    parent: env.message.reference || '',
    context: '',
    topic: env.message.topic || '',
    tags: env.message.tags || [],
    hash: env.refhash,
    type: env.message.type,
    moderationSetting: env.message.moderationSetting || null,
    videoUrl: env.message.videoUrl,
    thumbnailUrl: env.message.thumbnailUrl,
    meta: {
      replyCount: env.message.replyCount,
      likeCount: env.message.likeCount,
      pinCount: env.message.pinCount,
    },
  };
};

export const mapDraftToPostPayload = (draft?: DraftPost): RelayerPostModel => {
  if (!draft) {
    return {
      parent: '',
      context: '',
      content: '',
      topic: '',
      tags: [],
      title: '',
      subtype: '',
    };
  }

  let content = draft.content;

  return {
    parent: draft.parent,
    context: draft.context,
    content: content,
    topic: draft.topic,
    tags: draft.tags,
    title: draft.title,
    subtype: draft.subtype || '',
    videoUrl: draft.videoUrl,
    thumbnailUrl: draft.thumbnailUrl,
  };
};

export function getLinkFromPost(post: Post): string {
  const {
    type: postType,
    title,
    content
  } = post;

  if (postType === PostType.LINK) {
    let replacedHref = title;

    try {
      const {protocol} = new URL(title);

      switch (protocol) {
        case 'sia:':
          replacedHref = title.replace('sia://', 'https://siasky.net/');
          break;
        default:
          break;
      }
    } catch (e) {}

    return replacedHref;
  }

  const parser = new DOMParser();
  const html = markup(content);
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const link = links && links[0];
  return link.href;
}

export function replaceLink(link: string): string {
  let replacedHref = link;

  try {
    const {protocol} = new URL(link);

    switch (protocol) {
      case 'sia:':
        replacedHref = link.replace('sia://', 'https://siasky.net/');
        break;
      default:
        break;
    }
  } catch (e) {}

  return replacedHref;
}

export function getModIcon(moderationType?: string|null): string {
  let modIcon = 'public';

  switch (moderationType) {
    case "SETTINGS__FOLLOWS_ONLY":
      modIcon = 'lock';
      break;
    case "SETTINGS__NO_BLOCKS":
      modIcon = 'admin_panel_settings';
      break;
  }

  return modIcon;
}
