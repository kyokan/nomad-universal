import React, {ChangeEvent, MouseEventHandler, ReactElement, ReactNode, useCallback, useState} from "react";
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

type Props = {
  onClose: MouseEventHandler;
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
  const [previewUrl, setPreviewUrl] = useState('');

  const togglePreview = useCallback(() => {
    setPreviewing(!isPreviewing);
  }, [isPreviewing]);

  const onDraftChange = useCallback(async (draftPost: DraftPost ) => {
    updateDraft({
      ...draft,
      content: draftPost.content,
    });
    setErrorMessage('');
  }, [draft]);

  const removePreview = useCallback((e) => {
    updateDraft({
      ...draft,
      subtype: '',
      title: '',
    });
  }, [
    draft.title,
    draft.content,
    draft.subtype,
  ]);

  const send = useCallback(async () => {
    if (isSending || success) return;

    setSending(true);

    try {
      await props.onSendPost(draft, truncate);
      setSuccess(true);
      setErrorMessage('');
      updateDraft(createNewDraft());
      setTimeout(() => {
        props.history.push('/');
      }, 500);
    } catch (e) {
      setErrorMessage(e.message);
    } finally {
      setSending(false);
    }
  }, [
    isSending,
    success,
    draft.content,
    draft.attachments.join(','),
    draft.tags.join(','),
    truncate,
  ]);

  const [showURLInput, setURLInput] = useState(false);

  if (showURLInput) {
    return (
      <URLInputModal
        {...props}
        onBack={() => setURLInput(false)}
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
            defaultContent={draft.content}
          />
        </div>
        {
          draft.subtype === 'LINK' && draft.title && (
            <div className="compose-modal__link-preview">
              <LinkPreview
                url={draft.title.trim()}
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
            />
          </div>
          <div className="compose-modal__footer__r">
            <Icon
              material="send"
              onClick={() => null}
            />
          </div>
        </div>
      </div>
    </FullScreenModal>
  )
}



function URLInputModal(
  props: Props & {
    onBack: () => void;
  },
): ReactElement {
  const draft = useDraftPost();
  const updateDraft = useUpdateDraft();
  const [inputVal, setInputVal] = useState(draft.title);
  const [link, setLink] = useState(draft.title);

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
      updateDraft({
        ...draft,
        subtype: 'LINK',
        title: link
      });
    } catch (e) {
      updateDraft({
        ...draft,
        subtype: '',
        title: '',
      });
    } finally {
      props.onBack();
    }
  }, [
    draft.title,
    draft.content,
    draft.subtype,
    link,
  ]);

  const cancel = useCallback((e) => {
    updateDraft({
      ...draft,
      subtype: '',
      title: '',
    });
    setLink('');
    setInputVal('');
  }, [
    draft.title,
    draft.content,
    draft.subtype,
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
                onOpenLink={props.onOpenLink}
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
