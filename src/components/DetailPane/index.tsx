import React, {ReactElement, useCallback, useEffect, useState} from 'react';
import './detail.scss';
import {RouteComponentProps, withRouter} from "react-router";
import {Envelope as DomainEnvelope} from 'fn-client/lib/application/Envelope';
import {Post as DomainPost} from 'fn-client/lib/application/Post';
import {
  updateComments,
  useCommentsFromParentId,
  useFetchMoreComments, usePostId,
} from "../../ducks/posts";
import {RegularPost} from "../CustomView/CustomViewPosts";
import {mapDomainEnvelopeToPost} from "../../utils/posts";
import Thread from "../Thread";
import {INDEXER_API} from "../../utils/api";
import {NapiResponse} from "../../utils/types";
import {useDispatch} from "react-redux";

type Props = {
  postHash?: string;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  onLikePost?: (hash: string) => void;
  onSendReply?: (hash: string) => void;
  onBlockUser?: (hash: string) => void;
  onFollowUser?: (hash: string) => void;
  onOpenLink: (url: string) => void;
} & RouteComponentProps<{ username?: string; postHash: string }>;

function DetailPane (props: Props): ReactElement {
  const postHash = props.postHash || '';

  const [isLoading, setLoading] = useState(false);
  const [parents, setParents] = useState<string[]>([]);
  const comments = useCommentsFromParentId(postHash);
  const post = usePostId(postHash);

  useEffect(() => {
    (async function onDetailPaneUpdate() {
      setLoading(true);
      const results = await queryParents(postHash);
      await loadMore();
      setParents(results);
      setLoading(false);
    }())
  }, [postHash]);

  const onSelectPost = (hash: string) => {
    props.history.push(`/posts/${hash}`);
  };

  const onNameClick = (username: string) => {
    props.history.push(`/users/${username}/timeline`);
  };

  const onTagClick = (tag: string) => {
    props.history.push(`/tags/${tag}`);
  };

  const [removeModeration, setRemoveModeration] = useState(false);
  const _loadMore = useFetchMoreComments(
    postHash,
    removeModeration,
  );
  const loadMore = useCallback(() => {
    return _loadMore(post?.next);
  }, [post?.next, _loadMore]);
  const dispatch = useDispatch();

  const toggle = useCallback(() => {
    (async function() {
      dispatch(updateComments(postHash));
      setRemoveModeration(!removeModeration);
    })();
  }, [removeModeration, dispatch]);

  const [lastMod, setLastMod] = useState(false);
  useEffect(() => {
    (async function() {
      if (lastMod !== removeModeration) {
        setLoading(true);
        setLastMod(removeModeration);
        await _loadMore();
        setLoading(false);
      }
    })();
  }, [removeModeration, _loadMore, lastMod]);

  return !postHash ? <noscript /> : (
    <div className="detail">
      <div className="detail__header" />
      <div className="detail__content">
        {
          !!parents.length && !isLoading && (
            <div className="detail__parents">
              {parents.map((parentHash: string) => (
                <RegularPost
                  key={parentHash}
                  hash={parentHash}
                  onLikePost={props.onLikePost}
                  onSendReply={props.onSendReply}
                  onBlockUser={props.onBlockUser}
                  onFollowUser={props.onFollowUser}
                  onSelectPost={onSelectPost}
                  onNameClick={onNameClick}
                  onTagClick={onTagClick}
                  onOpenLink={props.onOpenLink}
                  onFileUpload={props.onFileUpload}
                  canReply
                />
              ))}
            </div>
          )
        }
        {
          !isLoading && (
            <RegularPost
              key={postHash}
              hash={postHash}
              onLikePost={props.onLikePost}
              onSendReply={props.onSendReply}
              onBlockUser={props.onBlockUser}
              onFollowUser={props.onFollowUser}
              onSelectPost={onSelectPost}
              onNameClick={onNameClick}
              onTagClick={onTagClick}
              onOpenLink={props.onOpenLink}
              onFileUpload={props.onFileUpload}
              onRemoveModeration={toggle}
              shouldRemoveModeration={removeModeration}
              // shouldFetchCommentsOnMount
              canReply
              selected
            />
          )
        }
        <div className="detail__header" />
        <div className="detail__content__thread">
          {
            !isLoading && comments.map(hash => (
              <Thread
                key={hash}
                hash={hash}
                onOpenLink={props.onOpenLink}
                onLikePost={props.onLikePost}
                onSendReply={props.onSendReply}
                onBlockUser={props.onBlockUser}
                onFollowUser={props.onFollowUser}
                onFileUpload={props.onFileUpload}
                onRemoveModeration={toggle}
                shouldRemoveModeration={removeModeration}
              />
            ))
          }
          {
            !!comments.length && !(comments.length % 20) && (
              <button
                className="button detail__load-more-btn"
                disabled={isLoading}
                onClick={loadMore}
              >
                Load More
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default withRouter(DetailPane);

const queryParents = async (postHash: string, ret: string[] = []): Promise<string[]> => {
  const resp = await fetch(`${INDEXER_API}/posts/${postHash}`);
  const json: NapiResponse<DomainEnvelope<DomainPost> | null> = await resp.json();

  if (json.error || !json.payload) {
    return ret;
  }

  const post = mapDomainEnvelopeToPost(json.payload);

  if (post.parent && parent.length < 25) {
    const newRet = [post.parent, ...ret];
    return queryParents(post.parent, newRet);
  }

  return ret;
};
