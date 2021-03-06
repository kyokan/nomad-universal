import {useCallback, useState} from "react";
import {updateRawPost, usePostsMap} from "../../ducks/posts";
import uniq from "lodash.uniq";
import {useCurrentUser, userCurrentUserData} from "../../ducks/users";
import {useDispatch} from "react-redux";
import {CustomFilterViewProps} from "../CustomFilterView";
import {mapDomainEnvelopeToPost} from "../../utils/posts";
import {INDEXER_API} from "../../utils/api";
import {Envelope as DomainEnvelope} from 'fn-client/lib/application/Envelope';
import {Post as DomainPost} from 'fn-client/lib/application/Post';
import {Pageable} from "../../types/Pageable";
import {Filter} from "../../utils/filter";

export type QueryCustomFilterRetType = {
  loading: boolean;
  list: string[];
  next: number | null;
  setLoading: (b: boolean) => void;
  setNext: (n: number | null) => void;
  setList: (l: string[]) => void;
  query: (reset?: boolean) => Promise<void>;
}

export const useQueryCustomFilter = (filter: CustomFilterViewProps["filter"]): QueryCustomFilterRetType => {
  const {
    postedBy,
    repliedBy,
    likedBy,
    postHashes,
    parentHashes,
    allowedTags,
  } = filter;
  const { name: currentUser } = useCurrentUser();
  const userData = userCurrentUserData();
  const muted = (userData?.mutedNames || []).reduce((acc: {[n: string]: boolean}, name: string) => {
    acc[name] = !!name;
    return acc;
  }, {});
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const [next, setNext] = useState<number | null>(0);
  const postMap = usePostsMap();

  const query = useCallback(async (reset?: boolean) => {
    setLoading(true);

    if (typeof next !== "number" && !reset) {
      setLoading(false);
      return;
    }

    if (
      !postedBy.length
      && !repliedBy.length
      && !likedBy.length
      && !postHashes.length
      && !parentHashes.length
      && !allowedTags.length
    ) {
      setList([]);
      setLoading(false);
      return ;
    }

    const payload = await queryNext({
      postedBy: postedBy,
      likedBy: likedBy,
      repliedBy: repliedBy,
      postHashes: postHashes,
      parentHashes: parentHashes,
      allowedTags: allowedTags,
    }, next, [], muted);

    setLoading(false);

    const hashes: string[] = [];

    payload.items.map((env: DomainEnvelope<DomainPost>) => {
      const post = mapDomainEnvelopeToPost(env);
      if (!postMap[post.hash]) {
        dispatch(updateRawPost(post));
      }
      // setTimeout(() => {
      //   dispatch(updateRawPost(post));
      // }, 0);
      hashes.push(post.hash);
    });

    if (reset) {
      setList(uniq(hashes));
    } else {
      setList(uniq(list.concat(hashes)));
    }
    setNext(payload.next);

  }, [
    list,
    currentUser,
    next,
    userData,
    postedBy.join(','),
    repliedBy.join(','),
    likedBy.join(','),
    allowedTags.join(','),
  ]);

  return {
    query,
    list,
    next,
    loading,
    setList,
    setNext,
    setLoading,
  };
};

async function queryNext(
  filter: Filter,
  next: number | null,
  list: DomainEnvelope<DomainPost>[] = [],
  muted: {[u: string]: boolean} = {},
): Promise<Pageable<DomainEnvelope<DomainPost>, number>> {
  const resp = await fetch(`${INDEXER_API}/filter?order=DESC${next ? '&offset=' + next : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({filter}),
  });
  const json = await resp.json();

  if (json.error) {
    return Promise.reject(json.error);
  }

  const payload = json.payload as Pageable<DomainEnvelope<DomainPost>, number>;
  list = list.concat(payload.items || [])
    .filter((env) => {
      return (!env.message.topic || env.message.topic[0] !== '.');
    });

  if (list.length < 20 && payload.next && payload.next > -1) {
    return await queryNext(filter, payload.next, list);
  } else {
    return {
      items: list,
      next: payload.next,
    };
  }
}

type FullControlPanelRetType = {
  showPosts: boolean;
  setShowPosts: (b: boolean) => void;
  showLikes: boolean;
  setShowLikes: (b: boolean) => void;
  showReplies: boolean;
  setShowReplies: (b: boolean) => void;
  userOverrides: {[name: string]: boolean};
  setUserOverride: (userOverrides: {[name: string]: boolean}) => void;
  tagOverrides: {[tagName: string]: boolean};
  setTagOverride: (tagOverrides: {[tagName: string]: boolean}) => void;
  modifiedFilter: CustomFilterViewProps["filter"];
}

export const useFullControlPanel = (filter: CustomFilterViewProps["filter"]): FullControlPanelRetType => {
  const {
    postedBy = [],
    repliedBy = [],
    likedBy = [],
    postHashes = [],
    parentHashes = [],
    allowedTags = [],
  } = filter;
  const [showPosts, setShowPosts] = useState(true);
  const [showLikes, setShowLikes] = useState(true);
  const [showReplies, setShowReplies] = useState(true);
  const [userOverrides, setUserOverride] = useState<{[k: string]: boolean}>({});
  const [tagOverrides, setTagOverride] = useState<{[k: string]: boolean}>({});

  return {
    showPosts,
    showLikes,
    showReplies,
    userOverrides,
    tagOverrides,
    setShowPosts,
    setShowLikes,
    setShowReplies,
    setUserOverride,
    setTagOverride,
    modifiedFilter: {
      postedBy: showPosts
        ? postedBy.filter((name: string) => typeof userOverrides[name] === "undefined" ? true : userOverrides[name])
        : [],
      repliedBy: showReplies
        ? repliedBy.filter((name: string) => typeof userOverrides[name] === "undefined" ? true : userOverrides[name])
        : [],
      likedBy: showLikes
        ? likedBy.filter((name: string) => typeof userOverrides[name] === "undefined" ? true : userOverrides[name])
        : [],
      parentHashes: showReplies
        ? parentHashes
        : [],
      postHashes: showPosts
        ? postHashes
        : [],
      allowedTags: allowedTags.filter((tagName: string) => typeof tagOverrides[tagName] === "undefined" ? true : tagOverrides[tagName]),
    },
  };
};
