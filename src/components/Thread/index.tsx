import React, {ReactElement, useCallback, useEffect, useState} from 'react';
import AddIcon from '../../static/assets/icons/add.svg';
import MinusIcon from '../../static/assets/icons/minus.svg';
import c from 'classnames';
import './thread.scss';
import {
  updateComments,
  useCommentsFromParentId,
  useFetchMoreComments,
  usePostId,
} from "../../ducks/posts";
import { withRouter, RouteComponentProps } from "react-router";
import {RegularPost} from "../CustomView/CustomViewPosts";
import Icon from "../Icon";
import {useDispatch} from "react-redux";

type OwnProps = {
  hash: string;
  level?: number;
  onLikePost?: (hash: string) => void;
  onSendReply?: (hash: string) => void;
  onBlockUser?: (hash: string) => void;
  onFollowUser?: (hash: string) => void;
  onOpenLink: (url: string) => void;
  onSelectPost?: (hash: string, creator: string, id: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  onRemoveModeration?: () => void;
  shouldRemoveModeration?: boolean;
}

type Props = OwnProps & RouteComponentProps;

function _Thread(props: Props): ReactElement {
  const { hash, level = 0 } = props;
  const [ opened, setOpened ] = useState<boolean>(level < 4);

  const comments = useCommentsFromParentId(hash);

  const toggleReply = useCallback(() => {
    setOpened(!opened);
  }, [opened, setOpened]);

  const { creator } = usePostId(hash);

  const onNameClick = useCallback((username) => {
    props.history.push(`/users/${username}/timeline`);
  }, [creator]);

  const onSelectPost = props.onSelectPost || useCallback((hash) => {
    props.history.push(`/posts/${hash}`);
  }, []);

  const onTagClick = useCallback((tag) => {
    props.history.push(`/tags/${tag}`);
  }, []);

  const post = usePostId(hash);
  const _loadMore = useFetchMoreComments(hash);
  const loadMore = useCallback(() => {
    return _loadMore(post?.next);
  }, [post?.next, _loadMore]);

  const [lastMod, setLastMod] = useState(!!props.shouldRemoveModeration);
  const dispatch = useDispatch();
  useEffect(() => {
    (async function() {
      if (lastMod !== props.shouldRemoveModeration) {
        dispatch(updateComments(hash));
        setLastMod(!!props.shouldRemoveModeration);
        await _loadMore();
      }
    })();
  }, [props.shouldRemoveModeration, _loadMore, lastMod, dispatch, hash]);

  return (
    <div className={c('thread', {
      'thread--with-comments': comments.length,
    })}>
      {
        !!comments.length && (
          opened
            ? <Icon width={10} className="thread__toggle" url={MinusIcon} onClick={toggleReply} />
            : <Icon width={10} className="thread__toggle" url={AddIcon} onClick={toggleReply} />
        )
      }
      <RegularPost
        className={comments.length ? 'post-with-comments' : ''}
        hash={hash}
        onLikePost={props.onLikePost}
        onSendReply={props.onSendReply}
        onBlockUser={props.onBlockUser}
        onFollowUser={props.onFollowUser}
        onOpenLink={props.onOpenLink}
        onFileUpload={props.onFileUpload}
        onSelectPost={onSelectPost}
        onNameClick={onNameClick}
        onTagClick={onTagClick}
        shouldRemoveModeration={props.shouldRemoveModeration}
        onRemoveModeration={props.onRemoveModeration}
        canReply
        shouldFetchCommentsOnMount
      />
      {
        opened && comments.map(commentId => {
          return (
            <Thread
              key={commentId}
              hash={commentId}
              level={level + 1}
              onOpenLink={props.onOpenLink}
              onLikePost={props.onLikePost}
              onSendReply={props.onSendReply}
              onBlockUser={props.onBlockUser}
              onFollowUser={props.onFollowUser}
              onFileUpload={props.onFileUpload}
              onSelectPost={onSelectPost}
              shouldRemoveModeration={props.shouldRemoveModeration}
              onRemoveModeration={props.onRemoveModeration}
            />
          );
        })
      }
      {
        opened && !!comments.length && !(comments.length % 20) && (
          <button
            className="button thread__load-more-btn"
            onClick={loadMore}
          >
            Load More
          </button>
        )
      }
    </div>
  )
}

const Thread = withRouter(_Thread);

export default Thread;
