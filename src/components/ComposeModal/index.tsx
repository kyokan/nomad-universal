import React, {ChangeEvent, MouseEvent, ReactElement, useCallback, useEffect, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import {FullScreenModal} from "../FullScreenModal";
import "./compose-modal.scss";
import Icon from "../Icon";
import RTEActions from "../RichTextEditor/RTEActions";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import TextEditor from "../TextEditor";
import {useDraftPost, useUpdateDraft} from "../../ducks/drafts";
import Input from "../Input";
import LinkPreview from "../LinkPreview";
import Button from "../Button";
import SkynetLogo from '../../static/assets/icons/skynet-logo.svg';
import classNames from "classnames";

type Props = {
  onClose: (e?: MouseEvent) => void;
  onOpenLink: (url: string) => void;
  onSendPost: (draft: DraftPost, truncate?: boolean) => Promise<RelayerNewPostResponse>;
  onFileUpload: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps;

export default withRouter(ComposeModal);

function ComposeModal(props: Props): ReactElement {
  const draft = useDraftPost();
  const updateDraft = useUpdateDraft();

  const [isPreviewing, setPreviewing] = useState(false);
  const [isSending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [truncate, setTruncate] = useState(false);

  const [subtype, setSubtype] = useState<''|'LINK'>(draft.subtype);
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);

  useEffect(() => {
    return () => {
      updateDraft(createNewDraft({ title, content, subtype }));
    }
  }, [title, content, subtype]);

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
      await props.onSendPost(createNewDraft({
        title, content, subtype,
      }), truncate);
      setSuccess(true);
      setErrorMessage('');
      updateDraft(createNewDraft());
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
    truncate,
  ]);

  const [showURLInput, setURLInput] = useState(false);
  const [showImageUpload, setImageUpload] = useState(false);

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
            Write a post
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
