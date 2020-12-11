import React, {ReactElement, useEffect, useState} from 'react';
import './detail.scss';
import {RouteComponentProps, withRouter} from "react-router";
import {Envelope as DomainEnvelope} from 'fn-client/lib/application/Envelope';
import {Post as DomainPost} from 'fn-client/lib/application/Post';
import {
  _updateComments, updateComments,
  useCommentsFromParentId,
  useFetchMoreComments,
} from "../../ducks/posts";
import {RegularPost} from "../CustomView/CustomViewPosts";
import {mapDomainEnvelopeToPost} from "../../utils/posts";
import Thread from "../Thread";
import {INDEXER_API} from "../../utils/api";
import {NapiResponse} from "../../utils/types";
import {useBlocklist} from "../../ducks/blocklist";
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
  const blocklist = useBlocklist();
  // const post = usePostId(postHash);
  // const postsMap = usePostsMap();
  // const dispatch = useDispatch();
  const loadMore = useFetchMoreComments(postHash);

  useEffect(() => {
    (async function onDetailPaneUpdate() {
      setLoading(true);
      const results = await queryParents(postHash);
      await loadMore();
      setParents(results);
      setLoading(false);
    }())
  }, [postHash]);

  const dispatch = useDispatch();
  const [lastBlocklist, setLastBlocklast] = useState<string[]>([]);

  // useEffect(() => {
  //   (async function onBlocklistUpdated() {
  //     if (lastBlocklist.join() !== blocklist.join()) {
  //       setLoading(true);
  //       setLastBlocklast(blocklist);
  //       dispatch(_updateComments(postHash, undefined, []));
  //       await loadMore();
  //       setLoading(false);
  //     }
  //   })();
  // }, [blocklist, lastBlocklist, dispatch, postHash]);

  const onSelectPost = (hash: string) => {
    props.history.push(`/posts/${hash}`);
  };

  const onNameClick = (username: string) => {
    props.history.push(`/users/${username}/timeline`);
  };

  const onTagClick = (tag: string) => {
    props.history.push(`/tags/${tag}`);
  };

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
              shouldFetchCommentsOnMount
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
