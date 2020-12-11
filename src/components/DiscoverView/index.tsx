import React, {ReactElement, useCallback, useEffect, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import {Envelope as DomainEnvelope} from 'fn-client/lib/application/Envelope';
import {Post as DomainPost} from 'fn-client/lib/application/Post';
import CustomView from "../CustomView";
import {useDispatch} from "react-redux";
import {updateRawPost, usePostsMap} from "../../ducks/posts";
import uniq from "lodash.uniq";
import {useCurrentBlocks, userCurrentUserData} from "../../ducks/users";
import {mapDomainEnvelopeToPost} from "../../utils/posts";
import {serializeUsername} from "../../utils/user";
import {INDEXER_API} from "../../utils/api";
import {addTag, addUser} from "../../ducks/search";
import {Pageable} from "../../types/Pageable";
import {useBlocklist} from "../../ducks/blocklist";

type DiscoverViewProps = {
  onLikePost: (postHash: string) => void;
  onSendReply: (postHash: string) => void;
  onBlockUser: (postHash: string) => void;
  onFollowUser: (postHash: string) => void;
  onOpenLink: (url: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps<{ postHash?: string }>;

function DiscoverView(props: DiscoverViewProps): ReactElement {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const [next, setNext] = useState<number | null>(0);
  const postMap = usePostsMap();

  const dispatch = useDispatch();

  const blocklist = useBlocklist();

  const query = useCallback(async (reset?: boolean) => {
    setLoading(true);

    if (typeof next !== 'number') {
      setLoading(false);
      return;
    }

    const payload = await queryNext(reset ? null : next ,[], blocklist);
    setLoading(false);

    const hashes: string[] = [];

    payload.items.map((postWithMeta: DomainEnvelope<DomainPost>) => {
      const post = mapDomainEnvelopeToPost(postWithMeta);
      if (!postMap[post.hash]) {
        dispatch(updateRawPost(post));
      }
      hashes.push(post.hash);
    });

    const newList = reset ? uniq(hashes) : uniq(list.concat(hashes));
    setList(newList);
    setNext(payload.next);
  }, [
    list,
    next,
  ]);

  const onSelectPost = useCallback((hash: string) => {
    props.history.push(`/posts/${hash}`);
  }, []);

  const onTagClick = useCallback((tag: string) => {
    dispatch(addTag(tag));
    dispatch(addUser('*'));
    props.history.push(`/search`);
  }, [dispatch]);

  useEffect(() => {
    (function onDiscoveryViewMount() {
      setTimeout(() => query(true), 0);
    }())
  }, [blocklist.join(',')]);

  return (
    <CustomView
      loading={loading}
      title="Explore Nomad"
      selectedHash={props.match.params.postHash}
      hashes={list}
      onSelectPost={onSelectPost}
      onLikePost={props.onLikePost}
      onSendReply={props.onSendReply}
      onBlockUser={props.onBlockUser}
      onFollowUser={props.onFollowUser}
      onFileUpload={props.onFileUpload}
      onOpenLink={props.onOpenLink}
      onScrolledToBottom={typeof next === 'number' && next > -1 ? query : undefined}
      onTagClick={onTagClick}
      // onUpdateAvatarUrl={() => null}
      // onAvatarUrlChange={() => null}
      panels={[]}
      // hideCoverImage
    />
  );
}

export default withRouter(DiscoverView);

async function queryNext(
  next: number | null,
  list: DomainEnvelope<DomainPost>[] = [],
  blocklist: string[] = [],
): Promise<Pageable<DomainEnvelope<DomainPost>, number>> {
  if (next !== null &&  next < 0) {
    return {
      items: [],
      next: -1,
    };
  }
  const extendBlockQuery = blocklist.map(tld => `&extendBlockSrc=${tld}`).join('');
  const resp = await fetch(`${INDEXER_API}/posts?order=DESC&limit=20${next ? '&offset=' + next : ''}${extendBlockQuery}`);
  const json = await resp.json();

  if (json.error) {
    return Promise.reject(json.error);
  }

  const payload = json.payload as Pageable<DomainEnvelope<DomainPost>, number>;
  list = list.concat(payload.items)
    .filter(env => {
      return (
        !env.message.reference &&
        (!env.message.topic || env.message.topic[0] !== '.')
      );
    });

  if (list.length < 20 && payload.next && payload.next > -1) {
    return await queryNext(payload.next, list, blocklist);
  } else {
    return {
      items: list,
      next: payload.next,
    };
  }
}
