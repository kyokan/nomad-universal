// @ts-ignore
import React, {ReactElement} from "react";
import { withRouter, RouteComponentProps } from "react-router";
import CustomFilterView from "../CustomFilterView";
import {extendFilter} from "../../utils/filter";

type Props = {
  onLikePost: (postHash: string) => void;
  onSendReply: (postHash: string) => void;
  onBlockUser: (postHash: string) => void;
  onFollowUser: (postHash: string) => void;
  onOpenLink: (url: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps<{tagName: string}>;

function TagView(props: Props): ReactElement {
  const {
    match: { params: { tagName } },
    onLikePost,
    onSendReply,
    onBlockUser,
    onFollowUser,
    onFileUpload,
  } = props;

  return (
    <CustomFilterView
      title={`#${tagName}`}
      heroImageUrl=""
      filter={extendFilter({
        postedBy: ['*'],
        repliedBy: ['*'],
        likedBy: ['*'],
        allowedTags: [tagName],
      })}
      headerActions={[]}
      onOpenLink={props.onOpenLink}
      onLikePost={onLikePost}
      onSendReply={onSendReply}
      onBlockUser={onBlockUser}
      onFollowUser={onFollowUser}
      onFileUpload={onFileUpload}
    />
  )
}

export default withRouter(TagView);
