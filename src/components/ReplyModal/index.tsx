import React, {ChangeEvent, MouseEvent, ReactElement, useCallback, useEffect, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import {FullScreenModal} from "../FullScreenModal";
import Icon from "../Icon";
import RTEActions from "../RichTextEditor/RTEActions";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import TextEditor from "../TextEditor";
import Input from "../Input";
import LinkPreview from "../LinkPreview";
import Button from "../Button";
import SkynetLogo from '../../static/assets/icons/skynet-logo.svg';
import classNames from "classnames";
import {ModerationType} from "fn-client/lib/application/Moderation";
import {updateReplies, useReplyId} from "../../ducks/drafts/replies";
import {useDispatch} from "react-redux";
import {usePostId} from "../../ducks/posts";
import {useUser} from "../../ducks/users";

type Props = {
  hash: string;
  onClose: (e?: MouseEvent) => void;
  onOpenLink: (url: string) => void;
  onSendReply?: (hash: string) => void;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps;

export default withRouter(ReplyModal);

function ReplyModal(props: Props): ReactElement {
  const {hash} = props;
  const post = usePostId(hash);
  const user = useUser(post.creator);

  const draft = useReplyId(hash);
  const dispatch = useDispatch();


  const [isPreviewing, setPreviewing] = useState(false);
  const [isSending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [subtype, setSubtype] = useState<''|'LINK'|'VIDEO'>(draft.subtype);
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [modType, setModType] = useState<ModerationType|null>(null);

  useEffect(() => {
    dispatch(updateReplies(createNewDraft({
      title,
      content,
      subtype,
      parent: hash,
    })));
  }, [title, content, subtype, hash]);

  const togglePreview = useCallback(() => {
    setPreviewing(!isPreviewing);
  }, [
    isPreviewing,
  ]);

  const removePreview = useCallback(() => {
    setTitle('');
    setSubtype('');
  }, []);

  const onDraftChange = useCallback((draftPost: DraftPost ) => {
    setContent(draftPost.content);
    setErrorMessage('');
  }, []);

  const onAddLink = useCallback((url: string) => {
    setTitle(url);
    setSubtype('LINK');
  }, []);

  const send = useCallback(async () => {
    if (isSending || success) return;

    setSending(true);

    try {
      await props.onSendReply!(hash);
      setSuccess(true);
      setErrorMessage('');
      dispatch(updateReplies(createNewDraft({
        parent: hash,
      })));
      setContent('');
      setTitle('');
      setSubtype('');
      props.onClose();
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setSending(false);
    }
  }, [
    isSending,
    success,
    title,
    subtype,
    content,
    modType,
    hash,
  ]);

  const [showURLInput, setURLInput] = useState(false);
  const [showImageUpload, setImageUpload] = useState(false);
  const [showModeration, setModeration] = useState(false);

  let disabled = false;

  if (subtype === 'LINK') {
    disabled = !content && !title;
  } else {
    disabled = !content;
  }

  if (showURLInput) {
    return (
      <URLInputModal
        {...props}
        onAddLink={onAddLink}
        onBack={() => setURLInput(false)}
      />
    )
  }

  if (showImageUpload) {
    return (
      <ImageUploadModal
        {...props}
        onAddLink={onAddLink}
        onBack={() => setImageUpload(false)}
      />
    )
  }

  if (showModeration) {
    return (
      <ModerationSettingModal
        {...props}
        onBack={() => setModeration(false)}
        onSelectModerationType={setModType}
        currentModerationType={modType}
      />
    );
  }

  return (
    <FullScreenModal
      onClose={props.onClose}
    >
      <div
        className="compose-modal"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="compose-modal__header">
          <div className="compose-modal__header__label">
            Reply to {user?.displayName || post.creator}'s post
          </div>
          <div className="compose-modal__header__switch" onClick={togglePreview}>
            { isPreviewing ? "Editor Mode" : "Markdown Mode" }
          </div>
          <Icon
            material="close"
            onClick={props.onClose}
          />
        </div>
        <div className="compose-modal__content">
          <TextEditor
            onChange={onDraftChange}
            mode={isPreviewing ? "markdown" : "editor"}
            defaultContent={content}
          />
        </div>
        {
          subtype === 'LINK' && title && (
            <div className="compose-modal__link-preview">
              <LinkPreview
                url={title.trim()}
                onOpenLink={props.onOpenLink}
              />
              <div
                className="compose-modal__link-preview__close-btn"
              >
                <Icon
                  material="delete_outline"
                  onClick={removePreview}
                />
              </div>
            </div>
          )
        }
        <div className="compose-modal__footer">
          <div className="compose-modal__footer__l">
            <RTEActions
              onInsertLinkClick={() => setURLInput(!showURLInput)}
              onInsertFileClick={() => setImageUpload(!showURLInput)}
              onModerationClick={() => setModeration(!showModeration)}
              moderationType={modType}
            />
          </div>
          <div className="compose-modal__footer__r">
            <Button
              onClick={send}
              loading={isSending}
              disabled={disabled}
            >
              <Icon
                material="send"
              />
            </Button>
          </div>
        </div>
      </div>
    </FullScreenModal>
  )
}

function URLInputModal(
  props: Props & {
    onBack: () => void;
    onAddLink: (link: string) => void;
  },
): ReactElement {
  const [inputVal, setInputVal] = useState('');
  const [link, setLink] = useState('');

  const onURLChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputVal(value);
    try {
      new URL(e.target.value);
      setLink(value);
    } catch (e) {
      setLink('');
    }
  }, []);

  const confirm = useCallback((e) => {
    try {
      new URL(link);
      props.onAddLink(link);
    } catch (e) {
      props.onAddLink('');
    } finally {
      props.onBack();
    }
  }, [
    link,
  ]);

  const cancel = useCallback((e) => {
    props.onAddLink('');
    setLink('');
    setInputVal('');
  }, []);

  return (
    <FullScreenModal onClose={props.onClose}>
      <div
        className="compose-modal"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="compose-modal__header">
          <Icon
            material="keyboard_backspace"
            onClick={props.onBack}
          />
          <div className="compose-modal__header__label url-input-modal__header__label">
            Insert Link
          </div>
          <Icon
            material="close"
            onClick={props.onClose}
          />
        </div>
        <div className="compose-modal__content">
          <Input
            type="text"
            onChange={onURLChange}
            placeholder="Link"
            value={inputVal}
          />
        </div>
        {
          link && (
            <div className="compose-modal__link-preview">
              <LinkPreview
                url={link}
                onOpenLink={() => null}
              />
              <div
                className="compose-modal__link-preview__close-btn"
              >
                <Icon
                  material="delete_outline"
                  onClick={cancel}
                />
              </div>
            </div>
          )
        }
        <div className="compose-modal__footer">
          <div className="compose-modal__footer__l" />
          <div className="compose-modal__footer__r">
            {
              link && (
                <Icon
                  material="check"
                  onClick={confirm}
                />
              )
            }
          </div>
        </div>
      </div>
    </FullScreenModal>
  )
}

function ImageUploadModal(
  props: Props & {
    onBack: () => void;
    onAddLink: (link: string) => void;
  },
): ReactElement {
  const [inputVal, setInputVal] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);

  const onFileUpload = useCallback(async () => {
    if (!props.onFileUpload) return;
    setUploading(true);
    await props.onFileUpload(async (file, skylink, progress) => {
      setLink(skylink);
      setUploading(false);
    });
  }, [props.onFileUpload]);

  const confirm = useCallback((e) => {
    try {
      new URL(link);
      props.onAddLink(link);
    } catch (e) {
      props.onAddLink('');
    } finally {
      props.onBack();
    }
  }, [
    link,
  ]);

  const cancel = useCallback((e) => {
    props.onAddLink('');
    setLink('');
    setInputVal('');
  }, []);

  return (
    <FullScreenModal onClose={props.onClose}>
      <div
        className="compose-modal"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="compose-modal__header">
          <Icon
            material="keyboard_backspace"
            onClick={props.onBack}
          />
          <div className="compose-modal__header__label url-input-modal__header__label">
            Upload via...
          </div>
          <Icon
            material="close"
            onClick={props.onClose}
          />
        </div>
        <div className="compose-modal__content">
          <div
            className={classNames("compose-modal__file-upload-options", {
              'compose-modal__file-upload-options--disabled': uploading,
            })}
          >
            <div
              className="compose-modal__file-upload-option"
              onClick={onFileUpload}
            >
              <Icon
                url={SkynetLogo}
              />
              <div
                className="compose-modal__file-upload-option__label"
              >
                Sia Skynet
              </div>
              {
                uploading && (
                  <div className="loader" />
                )
              }
            </div>
          </div>
        </div>
        {
          link && (
            <div className="compose-modal__link-preview">
              <LinkPreview
                url={link}
                onOpenLink={() => null}
              />
              <div
                className="compose-modal__link-preview__close-btn"
              >
                <Icon
                  material="delete_outline"
                  onClick={cancel}
                />
              </div>
            </div>
          )
        }
        <div className="compose-modal__footer">
          <div className="compose-modal__footer__l" />
          <div className="compose-modal__footer__r">
            {
              link && (
                <Icon
                  material="check"
                  onClick={confirm}
                />
              )
            }
          </div>
        </div>
      </div>
    </FullScreenModal>
  )
}

function ModerationSettingModal(
  props: Props & {
    onBack: () => void;
    onSelectModerationType: (type: ModerationType|null) => void;
    currentModerationType: ModerationType|null;
  },
): ReactElement {
  const onSelectModerationType = useCallback((type: ModerationType|null) => {
    props.onSelectModerationType(type);
    props.onBack();
  }, [
    props.onSelectModerationType,
    props.onBack,
  ]);

  return (
    <FullScreenModal onClose={props.onClose}>
      <div
        className="compose-modal"
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="compose-modal__header">
          <Icon
            material="keyboard_backspace"
            onClick={props.onBack}
          />
          <div className="compose-modal__header__label url-input-modal__header__label">
            Moderation Settings
          </div>
          <Icon
            material="close"
            onClick={props.onClose}
          />
        </div>
        <div className="compose-modal__content">
          <div className="compose-modal__content__title">
            Choose whose replies will show up on your post by default
          </div>
          <div className="compose-modal__selectors">
            {
              renderSelector(
                'public',
                'Everyone',
                'Show replies from everyone',
                () => onSelectModerationType(null),
                !props.currentModerationType,
              )
            }
            {
              renderSelector(
                'admin_panel_settings',
                'No Blocks',
                'Hide replies from people you block',
                () => onSelectModerationType('SETTINGS__NO_BLOCKS'),
                props.currentModerationType === 'SETTINGS__NO_BLOCKS',
              )
            }
            {
              renderSelector(
                'lock',
                'Follows Only',
                'Only show replies from people you follow',
                () => onSelectModerationType('SETTINGS__FOLLOWS_ONLY'),
                props.currentModerationType === 'SETTINGS__FOLLOWS_ONLY',
              )
            }
          </div>
        </div>
        <div className="compose-modal__footer">
          <div className="compose-modal__footer__l" />
          <div className="compose-modal__footer__r">
          </div>
        </div>
      </div>
    </FullScreenModal>
  )
}

function renderSelector(
  material: string,
  text: string,
  subtext: string,
  onClick: () => void,
  selected: boolean,
) {
  return (
    <div
      className={classNames("compose-modal__selector", {
        'compose-modal__selector--selected': selected,
      })}
      onClick={onClick}
    >
      <Icon
        className="compose-modal__selector__icon"
        material={material}
      />
      <div className="compose-modal__selector__content">
        <div className="compose-modal__selector__content__text">
          {text}
        </div>
        <div className="compose-modal__selector__content__subtext">
          {subtext}
        </div>
      </div>
      { selected && <Icon className="compose-modal__selector__icon" material="check" /> }
    </div>
  );
}
