import React, {ReactElement, useEffect, useCallback} from "react";
import { withRouter, RouteComponentProps } from "react-router";
import { useDispatch } from 'react-redux';
import CustomFilterView from "../CustomFilterView";
import {extendFilter} from "../../utils/filter";
import {userCurrentUserData} from "../../ducks/users";
import {addTagToView, useViewOverrideByIndex, useViewSubtractByIndex} from "../../ducks/views";

type Props = {
  onLikePost: (postHash: string) => void;
  onSendReply: (postHash: string) => void;
  onBlockUser: (postHash: string) => void;
  onFollowUser: (postHash: string) => void;
} & RouteComponentProps<{viewIndex: string}>;

function SavedView (props: Props): ReactElement {
  const viewIndex = Number(props.match.params.viewIndex);
  const dispatch = useDispatch();

  const currentUserData = userCurrentUserData();
  const override = useViewOverrideByIndex(viewIndex);
  const subtract = useViewSubtractByIndex(viewIndex);

  const { savedViews = [] } = currentUserData || {};
  const savedView = savedViews[viewIndex];
  const filter = savedView?.filter;

  const overrideUsers = override.users || [];
  const overrideTags = override.tags || [];

  const userSet = new Set(overrideUsers);
  const tagSet = new Set(overrideTags);

  filter?.postedBy?.forEach((u: string) => userSet.add(u));
  filter?.allowedTags?.forEach((t: string) => tagSet.add(t));
  subtract.users.forEach(u => userSet.delete(u));
  subtract.tags.forEach(t => tagSet.delete(t));

  const users = Array.from(userSet);
  const tags = Array.from(tagSet);

  useEffect(() => {
    return () => {
      // dispatch(resetSearchParams());

    };
  }, []);

  const onTagClick = useCallback((tag: string) => {
    dispatch(addTagToView(tag, viewIndex));
  }, [dispatch]);

  return (
    <CustomFilterView
      title=""
      heroImageUrl=""
      filter={extendFilter({
        postedBy: users.length
          ? users
          : tags.length ? ['*'] : [],
        repliedBy: [],
        likedBy: [],
        allowedTags: tags,
      })}
      headerActions={[]}
      onLikePost={props.onLikePost}
      onSendReply={props.onSendReply}
      onBlockUser={props.onBlockUser}
      onFollowUser={props.onFollowUser}
      onTagClick={onTagClick}
    />
  )
}

export default withRouter(SavedView);
