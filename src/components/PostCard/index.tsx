import React, {MouseEvent, ReactElement, ReactNode, useCallback, useEffect, useState} from "react";
import './post-card.scss';
import Markup from "../Markup";
import PostButton from "../PostButton";
import HeartIcon from "../../static/assets/icons/heart.svg";
import classNames from "classnames";
import {PostMeta, usePostId} from "../../ducks/posts";
import {
  useCurrentBlocks,
  useCurrentFollowings,
  useCurrentLikes,
  useCurrentUsername,
  useIdentity,
  userCurrentMutedNames,
  useUser,
  useUsersMap
} from "../../ducks/users";
import {useReplies, useReplyId} from "../../ducks/drafts/replies";
import Icon from "../Icon";
import PostCardHeader from "./PostCardHeader";
import Menuable, {MenuProps} from "../Menuable";
import {parseUsername, undotName} from "../../utils/user";
import {markup} from "../../utils/rte";
import LinkPreview from "../LinkPreview";
import {PostType} from "../../types/posts";
import {getModIcon, replaceLink} from "../../utils/posts";
import ReplyModal from "../ReplyModal";

type Props = {
  type: 'card' | 'compact' | 'title';
  id: string;
  className?: string;
  hash: string;
  title: string;
  topic: string;
  avatar: string;
  creator: string;
  content: string;
  parent: string;
  timestamp: number;
  attachments: string[];
  tags: string[];
  onSelectPost?: (hash: string, creator: string, id: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  onLikePost?: (hash: string) => void;
  onBlockUser?: (username: string) => void;
  onFollowUser?: (username: string) => void;
  onSendReply?: (hash: string) => void;
  onNameClick?: (name: string) => void;
  onTagClick?: (tagName: string) => void;
  onOpenLink: (url: string) => void;
  onRemoveModeration?: () => void;
  meta?: PostMeta;
  canReply?: boolean;
  selected?: boolean;
  pending?: boolean;
  shouldRemoveModeration?: boolean;
  postType: PostType;
  moderationSetting?: 'SETTINGS__FOLLOWS_ONLY'|'SETTINGS__NO_BLOCKS'|null;
};



export default function PostCard(props: Props): ReactElement {
  const {
    type = 'card',
  } = props;

  switch (type) {
    case "card":
      return <Card {...props} />;
    case "compact":
    case "title":
    default:
      return <></>;
  }
}

function Card(props: Props): ReactElement {
  const {
    hash,
    className,
    creator,
    timestamp,
    avatar,
    onSelectPost,
    onLikePost,
    onNameClick,
    title,
    meta,
    canReply,
    attachments,
    tags,
    selected,
    onSendReply,
    pending,
    content,
    onFileUpload,
    postType,
  } = props;

  const { replyCount = 0, likeCount = 0 } = meta || {};
  const [isContentOverflow, setContentOverflow] = useState(false);
  const [isShowingReply, setShowingReply] = useState<boolean>(false);
  const [isSendingLike, setSeningLike] = useState(false);
  const currentLikes = useCurrentLikes();
  const currentUser = useCurrentUsername();
  const user = useUser(currentUser);

  const likePost = useCallback(async (e: MouseEvent) => {
    e.stopPropagation();
    if (!isSendingLike && onLikePost) {
      setSeningLike(true);
      await onLikePost(hash);
      setSeningLike(false);
    }
  }, [hash, onLikePost, isSendingLike]);
  const openPost = useOpenPost(props);

  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (postType === PostType.LINK) {
      const link = replaceLink(title);
      setPreviewUrl(link);
      return;
    }

    const parser = new DOMParser();
    const html = markup(content);
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');
    const link = links && links[0];

    if (link?.href !== previewUrl) {
      setPreviewUrl(link?.href);
    }
  }, [title, postType, content, previewUrl]);

  return (
    <div
      tabIndex={onSelectPost ? 1 : undefined}
      ref={el => setContentOverflow((el?.clientHeight || 0) >= 268)}
      className={classNames('post-card', className, {
        'post-card--selectable': onSelectPost,
        'post-card--avatarless': !avatar,
        'post-card--content-overflow': isContentOverflow,
        'post-card--has-attachment': attachments.length,
        'post-card--selected': selected,
        'post-card--pending': pending,
      })}
      onClick={openPost}
    >
      { renderLikedBy(hash, creator) }
      <PostCardHeader
        avatar={avatar}
        creator={creator}
        timestamp={pending ? 'pending' : timestamp}
        onNameClick={onNameClick}
      />
      { renderContent(props) }
      {
        previewUrl && (
          <LinkPreview
            onOpenLink={props.onOpenLink}
            className="post-card__preview"
            url={previewUrl}
          />
        )
      }
      <div className="post-card__footer" onClick={e => e.stopPropagation()}>
        {
          !!canReply && (
            <PostButton
              className="post-card__footer__reply-btn"
              material="reply"
              text={`${replyCount}`}
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                setShowingReply(!isShowingReply)
              }}
              title={`Reply`}
              active={isShowingReply}
              disabled={!user?.confirmed}
            />
          )
        }
        {
          !!onLikePost && (
            <PostButton
              className="post-card__footer__like-btn"
              material={!!currentLikes[hash] ? "favorite" : "favorite_border"}
              text={`${likeCount}`}
              onClick={likePost}
              active={!!currentLikes[hash]}
              disabled={!user?.confirmed || isSendingLike}
            />
          )
        }
        <PostButton
          className={classNames("post-card__footer__mod-btn", {
            'post-card__footer__mod-btn--removed': props.shouldRemoveModeration,
          })}
          material={getModIcon(props.shouldRemoveModeration ? '' : props.moderationSetting)}
          onClick={props.onRemoveModeration}
          disabled={!props.onRemoveModeration}
        />
        { renderPostMenu(props) }
      </div>
      {renderQuickReplyEditor(hash, isShowingReply, setShowingReply, onSendReply, onFileUpload, props)}
    </div>
  );
}

function renderPostMenu(props: Props): ReactNode {
  const {
    onSelectPost,
    onBlockUser,
    onFollowUser,
    selected,
    creator,
  } = props;
  const postItems: MenuProps[] = [];
  const userItems: MenuProps[] = [];
  const openPost = useOpenPost(props);
  const currentUsername = useCurrentUsername();
  const currentBlocks = useCurrentBlocks();
  const currentFollowings = useCurrentFollowings();
  const user = useUser(currentUsername);

  let items: MenuProps[] = [];

  if (!selected && onSelectPost) {
    postItems.push({
      text: 'Open Post',
      onClick: openPost,
    });
  }

  if (onBlockUser && currentUsername !== creator && !currentBlocks[creator] && user?.confirmed) {
    userItems.push({
      text: `Block @${undotName(creator)}`,
      onClick: () => {
        try {
          if (onBlockUser) onBlockUser(creator);
        } catch (err) {

        }
      }
    });
  }

  if (onFollowUser && currentUsername !== creator && !currentFollowings[creator] && user?.confirmed) {
    userItems.push({
      text: `Follow @${undotName(creator)}`,
      onClick: () => {
        if (onFollowUser) onFollowUser(creator);
      }
    });
  }

  if (postItems.length) {
    items = items.concat(postItems);
  }

  if (postItems.length && userItems.length) {
    items.push({ divider: true });
  }

  if (userItems.length) {
    items = items.concat(userItems);
  }

  return !!items.length && (
    <Menuable items={items}>
      <PostButton
        material="more_horiz"
        title="More"
      />
    </Menuable>
  );
}

function renderContent(props: Props): ReactNode {
  const {
    content,
    parent,
    onSelectPost,
    onNameClick,
  } = props;

  const openPost = useOpenPost(props);
  const parentPost = usePostId(parent);

  const replyTitle = parentPost.creator
    ? (
      <>
        <div className="post-card__content__title__text">Replying to</div>
        <span
          className="post-card__content__title__creator"
          onClick={e => {
            e.stopPropagation();
            if (onNameClick) onNameClick(parentPost.creator)
          }}
        >
         @{undotName(parentPost.creator)}
       </span>
      </>
    )
    : '';

  return (
    <div
      className="post-card__content"
      onClick={onSelectPost && openPost}
    >
      { (replyTitle) && (
        <div className="post-card__content__title">
          {replyTitle}
        </div>
      )}
      <Markup content={content} onClick={props.onOpenLink} />
    </div>
  );
}

function useOpenPost(props: Props) {
  const {
    id,
    hash,
    creator,
    onSelectPost,
    selected,
  } = props;
  return useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (window?.getSelection()?.toString()) {
      return;
    }
    if (onSelectPost && !selected) {
      onSelectPost(hash, creator, id);
    }
  }, [onSelectPost, hash, creator, id, selected]);
}

function renderLikedBy(hash: string, creator: string): ReactNode {
  const followings = useCurrentFollowings();
  const users = useUsersMap();

  const likedBys = Object.keys(followings)
    .reduce((acc: string[], name: string) => {
      const user = users[name];
      const { likes = {} } = user || {};
      if (likes[hash]) {
        acc.push(`@${parseUsername(name).tld}`);
      }
      return acc;
    }, []);

  const names: ReactNode[] = [];

  if (!likedBys.length) {
    return null;
  } else if (likedBys.length <= 2) {
    likedBys.forEach((text, i) => {
      names.push(
        <div
          key={'liked-by' + text + i}
          className="post-card__liked-by__username"
        >
          {text}
        </div>
      );
      if (i < likedBys.length - 1) {
        names.push(<div key='liked-by-and' className="post-card__liked-by__username__separator"> and </div>)
      }
    });
  } else if (likedBys.length === 3) {
    likedBys.forEach((text, i) => {
      names.push(
        <div
          key={'liked-by' + text + i}
          className="post-card__liked-by__username"
        >
          {text}
        </div>
      );

      if (i === 1) {
        names.push(<div key={i} className="post-card__liked-by__username__separator">and</div>)
      } else if (i < likedBys.length - 1) {
        names.push(<div key={i} className="post-card__liked-by__username__separator">,</div>)
      }
    });
  } else if (likedBys.length > 3) {
    const rest = `${likedBys.length - 2} more`;
    const firstTwo = [likedBys[0], likedBys[1], rest];
    firstTwo.forEach((text, i) => {
      names.push(
        <div
          key={text + i}
          className="post-card__liked-by__username"
        >
          {text}
        </div>
      );

      if (i === 1) {
        names.push(<div key={i} className="post-card__liked-by__username__separator">and</div>)
      } else if (i < firstTwo.length - 1) {
        names.push(<div key={i} className="post-card__liked-by__username__separator">,</div>)
      }
    });
  }

  return (
    <div className="post-card__liked-by">
      {(
        // @ts-ignore
        <Icon
          width={14}
          url={HeartIcon}
        />
      )}

      <div className="post-card__liked-by__text">by</div>
      {names}
    </div>
  )
}


export function renderQuickReplyEditor(
  hash: string,
  isShowingReply: boolean,
  setShowingReply: (isShowing: boolean) => void,
  onSendReply?: (hash: string) => void,
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>,
  // @ts-ignore
  props: Props,
): ReactNode {
  const { isSendingReplies } = useReplies();
  const replyDraft = useReplyId(hash);
  const content = replyDraft.content;
  const { identities, currentUser } = useIdentity();
  const hasIdentity = !!Object.keys(identities).length;


  const onAddUser = useCallback(() => {
    // postIPCMain({ type: IPCMessageRequestType.OPEN_NEW_USER_WINDOW });
  }, []);

  if (!currentUser) {
    return (
      <div
        className={classNames('post__no-user-container', {
          'post__no-user-container--replying': isShowingReply,
        })}
      >
        <div className="post__no-user">
          {
            hasIdentity
              ? (
                <>
                  <div className="post__no-user-text">Please login to leave a comment</div>
                </>
              )
              : (
                <>
                  <div className="post__no-user-text">Please add a user to leave a comment</div>
                  <button
                    className="button post__no-user-btn"
                    onClick={onAddUser}
                  >
                    Add User
                  </button>
                </>
              )
          }
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames('post__reply-editor-container', {
        'post__reply-editor-container--replying': isShowingReply,
      })}
      onClick={e => e.stopPropagation()}
    >
      {
        isShowingReply && (
          <ReplyModal
            hash={hash}
            onClose={() => setShowingReply(false)}
            onOpenLink={props.onOpenLink}
            onSendReply={props?.onSendReply}
            onFileUpload={props?.onFileUpload}
          />
        )
      }
    </div>
  )
}
