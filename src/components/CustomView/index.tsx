import React, {MouseEventHandler, ReactElement, ReactNode, useState, useCallback, UIEvent} from 'react';
import './custom-view.scss';
import CustomViewHeader, {CustomViewHeaderActionProps, CustomViewHeaderItemProps} from "./CustomViewHeader";
import {CustomViewPanelProps} from "./CustomViewPanel";
import CustomViewPosts from "./CustomViewPosts";
import DetailPane from "../DetailPane";
import debounce from "lodash.debounce";

type Props = {
  className?: string;
  children?: ReactNode;
  selectedHash?: string;
  indexerAPI?: string;

  // Header
  heroImageUrl?: string;
  nameDecoration?: string;
  title?: string;
  titleFn?: () => ReactElement;
  avatarUrl?: string;
  canUploadHero?: boolean;
  canUploadAvatar?: boolean;
  hideCoverImage?: boolean;
  onUpdateAvatarUrl?: MouseEventHandler;
  onAvatarUrlChange?: (newAvatarUrl: string) => void;
  onUpdateCoverImage?: MouseEventHandler;
  onCoverImageChange?: (newAvatarUrl: string) => void;
  headerItems?: CustomViewHeaderItemProps[];
  headerActions?: CustomViewHeaderActionProps[];
  titleEditable?: boolean;
  onTitleUpdate?: (title: string) => void;

  // List
  hashes: string[];
  onSelectPost?: (hash: string, creator: string, id: string) => void;
  onLikePost?: (hash: string) => void;
  onSendReply?: (hash: string) => void;
  onBlockUser?: (hash: string) => void;
  onFollowUser?: (hash: string) => void;
  onOpenLink: (url: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  onScrolledToBottom?: () => void;
  onTagClick?: (tagName: string) => void;
  loading: boolean;
  placeholderContent?: ReactNode;

  // Panels
  panels: CustomViewPanelProps[];
}

function CustomView(props: Props): ReactElement {
  const {
    className = '',
    heroImageUrl,
    titleEditable,
    nameDecoration,
    avatarUrl,
    canUploadHero,
    canUploadAvatar,
    hideCoverImage,
    headerItems,
    headerActions,
    title,
    titleFn,
    onUpdateAvatarUrl,
    onAvatarUrlChange,
    onUpdateCoverImage,
    onCoverImageChange,
    onTitleUpdate,
    selectedHash,
    hashes,
    onSelectPost,
    onLikePost,
    onSendReply,
    onBlockUser,
    onFollowUser,
    onFileUpload,
    onScrolledToBottom,
    loading,
    panels,
    children,
    onTagClick,
    indexerAPI,
  } = props;

  const [scrollLoading, setScrollLoading] = useState(false);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement>();

  const _onScroll = useCallback(async (e: UIEvent<HTMLDivElement>) => {
    if (scrollLoading || !scrollEl || !onScrolledToBottom) {
      return;
    }

    // @ts-ignore
    if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight * .65) {
      setScrollLoading(true);
      await onScrolledToBottom();
      setScrollLoading(false);
    }
  }, [scrollLoading, scrollEl, onScrolledToBottom]);

  const onScroll = debounce(_onScroll, 50, { leading: true });

  if (selectedHash) {
    return (
      <div className={`custom-view custom-view--selected ${className}`}>
        <div className="custom-view__content">
          <>
            <div className="custom-view__content__selected-post">
              <CustomViewHeader
                title=""
                titleFn={titleFn}
                heroImageUrl={heroImageUrl}
              />
              <DetailPane
                postHash={selectedHash}
                onLikePost={onLikePost}
                onSendReply={onSendReply}
                onBlockUser={onBlockUser}
                onFollowUser={onFollowUser}
                onOpenLink={props.onOpenLink}
                onFileUpload={props.onFileUpload}
              />
            </div>
          </>
        </div>
      </div>
    )
  }

  const list = (
    <div
      // @ts-ignore
      ref={setScrollEl}
      className="custom-view__list"
      onScroll={onScroll}
    >
      <CustomViewHeader
        title={title}
        titleFn={titleFn}
        heroImageUrl={heroImageUrl}
        nameDecoration={nameDecoration}
        avatarUrl={avatarUrl}
        canUploadHero={canUploadHero}
        canUploadAvatar={canUploadAvatar}
        onAvatarUrlChange={onAvatarUrlChange}
        onUpdateAvatarUrl={onUpdateAvatarUrl}
        onUpdateCoverImage={onUpdateCoverImage}
        onCoverImageChange={onCoverImageChange}
        onTitleUpdate={onTitleUpdate}
        hideCoverImage={hideCoverImage}
        items={headerItems}
        actions={headerActions}
        titleEditable={titleEditable}
      />
      <CustomViewPosts
        indexerAPI={indexerAPI}
        hashes={hashes}
        loading={loading}
        onSelectPost={onSelectPost}
        onLikePost={onLikePost}
        onSendReply={onSendReply}
        onBlockUser={onBlockUser}
        onFollowUser={onFollowUser}
        onFileUpload={onFileUpload}
        onScrolledToBottom={onScrolledToBottom}
        onTagClick={onTagClick}
        onOpenLink={props.onOpenLink}
        placeholderContent={props.placeholderContent}
      >
        {children}
      </CustomViewPosts>
    </div>
  );

  return (
    <div className={`custom-view ${className}`}>
      <div className="custom-view__content">
        {list}
      </div>
    </div>
  )
}

export default CustomView;
