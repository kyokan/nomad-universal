import React, {ReactElement, useCallback, useEffect, useState} from 'react';
import {RouteComponentProps, withRouter} from 'react-router';
import {Envelope as DomainEnvelope} from 'fn-client/lib/application/Envelope';
import {Post as DomainPost} from 'fn-client/lib/application/Post';
import CustomView from "../CustomView";
import {
  useCurrentFollowings,
  useCurrentUser, useCurrentUsername, userCurrentMutedNames,
} from "../../ducks/users";
import {updateRawPost, usePostsMap} from "../../ducks/posts";
import {useDispatch} from "react-redux";
import uniq from "lodash.uniq";
import {CustomViewPanelType} from "../CustomView/CustomViewPanel";
import {mapDomainEnvelopeToPost} from "../../utils/posts";
import {INDEXER_API} from "../../utils/api";
import {Filter} from "../../utils/filter";
import {addTag} from "../../ducks/search";
import {Pageable} from "../../types/Pageable";
import {useBlocklist} from "../../ducks/blocklist";
import Button from "../Button";
type Props = {
  onLikePost: (hash: string) => void;
  onSendReply: (hash: string) => void;
  onBlockUser: (hash: string) => void;
  onFollowUser: (hash: string) => void;
  onOpenLink: (hash: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps;

function HomeView(props: Props): ReactElement {
  const currentUsername = useCurrentUsername();
  const dispatch = useDispatch();

  const onSelectPost = useCallback((postHash: string) => {
    props.history.push(`/posts/${postHash}`);
  }, [props.history]);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const [next, setNext] = useState<number | null>(0);
  const [showPosts, setShowPosts] = useState(true);
  const [showLikes, setShowLikes] = useState(true);
  const [showReplies, setShowReplies] = useState(true);
  const postMap = usePostsMap();
  const blocklist = useBlocklist();
  const followings = useCurrentFollowings();

  const query = useCallback(async (reset?: boolean) => {
    if (loading && !reset) return;

    setLoading(true);
    if (typeof next !== "number" && !reset) {
      setLoading(false);
      return;
    }

    if (!Object.keys(followings).length) {
      setList([]);
      setLoading(false);
      return ;
    }

    if (!showReplies && !showLikes && !showPosts)  {
      setLoading(false);
      setList([]);
      return
    }

    const payload = await queryNext(
      {
        postedBy: showPosts ? Object.keys(followings) : [],
        likedBy: [],
        repliedBy: [],
        postHashes: [],
        parentHashes: [],
        allowedTags: [],
      },
      next,
      [],
      blocklist,
      [currentUsername],
    );
    setLoading(false);
    const hashes: string[] = [];

    payload.items.map((envelope: DomainEnvelope<DomainPost>) => {
      const post = mapDomainEnvelopeToPost(envelope);
      if (!postMap[post.hash]) {
        dispatch(updateRawPost(post));
      }
      hashes.push(post.hash);
    });

    if (reset) {
      setList(uniq(hashes));
    } else {
      setList(uniq(list.concat(hashes)));
    }
    setNext(payload.next);
  }, [
    loading,
    list,
    currentUsername,
    next,
    followings,
    showPosts,
    showLikes,
    showReplies,
    blocklist.join(),
  ]);

  // useEffect(() => {
  //   (async function onHomeViewMount() {
  //     // dispatch(fetchUserFollowings(currentUser));
  //     // dispatch(fetchCurrentUserLikes());
  //   }())
  // }, [currentUsername]);
  //
  // useEffect(() => {
  //   (async function onFollowingsUpdateMount() {
  //     Object.keys(followings)
  //       .forEach(name => {
  //         // dispatch(fetchUserLikes(name));
  //       })
  //   }())
  // }, [followings, showPosts, showLikes, showReplies]);

  useEffect(() => {
    (function onListRefresh() {
      setTimeout(() => query(true), 0);
    }())
  }, [currentUsername, showPosts, showLikes, showReplies, followings, blocklist.join(',')]);

  const onTagClick = useCallback((tagName: string) => {
    dispatch(addTag(tagName));
    props.history.push(`/search`);
  }, [dispatch]);

  return (
    <CustomView
      title="Home"
      placeholderContent={(
        <span className="custom-view__content__posts__empty-text">
          <div className="custom-view__content__posts__empty-text__title">
            Welcome to Nomad!
          </div>
          <div className="custom-view__content__posts__empty-text__subtitle">
            Get started by following others. You will see posts from people you follow.
          </div>
          <Button onClick={() => props.history.push('/discover')}>
            Browse Posts
          </Button>
        </span>
      )}
      hashes={list}
      onLikePost={props.onLikePost}
      onSendReply={props.onSendReply}
      onBlockUser={props.onBlockUser}
      onFollowUser={props.onFollowUser}
      onFileUpload={props.onFileUpload}
      onOpenLink={props.onOpenLink}
      onSelectPost={onSelectPost}
      onTagClick={onTagClick}
      onScrolledToBottom={typeof next === 'number' ? query : undefined}
      loading={loading}
      panels={[
        {
          type: CustomViewPanelType.FEED_CONTROL,
          // @ts-ignore
          panelProps: {
            isShowingReplies: showReplies,
            isShowingPosts: showPosts,
            isShowingLikes: showLikes,
            onToggleReplies: () => {
              setShowReplies(!showReplies);
              setNext(0);
            },
            onTogglePosts: () => {
              setShowPosts(!showPosts);
              setNext(0);
            },
            onToggleLikes: () => {
              setShowLikes(!showLikes);
              setNext(0);
            },
          },
        },
      ]}
    />
  );
}

export default withRouter(HomeView);

async function queryNext(
  filter: Filter,
  next: number | null,
  list: DomainEnvelope<DomainPost>[] = [],
  blocklist: string[] = [],
  followlist: string[] = [],
): Promise<Pageable<DomainEnvelope<DomainPost>, number>> {
  const extendBlockQuery = blocklist.map(tld => `&extendBlockSrc=${tld}`).join('');
  const extendFollowSrcQuery = followlist.map(tld => `&extendFollowSrc=${tld}`).join('');
  const resp = await fetch(`${INDEXER_API}/posts?order=DESC&limit=20${next ? '&offset=' + next : ''}${extendFollowSrcQuery}${extendBlockQuery}`);
  const json = await resp.json();

  if (json.error) {
    return Promise.reject(json.error);
  }

  const payload = json.payload as Pageable<DomainEnvelope<DomainPost>, number>;
  list = list.concat(payload.items)
    .filter((env) => {
      return (
        !env.message.reference &&
        (!env.message.topic || env.message.topic[0] !== '.')
      );
    });

  if (list.length < 20 && payload.next && payload.next > -1) {
    return await queryNext(filter, payload.next, list, blocklist, followlist);
  } else {
    return {
      items: list,
      next: payload.next,
    };
  }
}
