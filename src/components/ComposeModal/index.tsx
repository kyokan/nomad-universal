import React, {ChangeEvent, MouseEventHandler, ReactElement, useCallback, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import {FullScreenModal} from "../FullScreenModal";
import "./compose-modal.scss";
import Icon from "../Icon";
import RTEActions from "../RichTextEditor/RTEActions";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import TextEditor from "../TextEditor";
import {useDraftPost, useUpdateDraft} from "../../ducks/drafts";

type Props = {
  onClose: MouseEventHandler;
  onSendPost: (draft: DraftPost, truncate?: boolean) => Promise<RelayerNewPostResponse>;
  onFileUpload: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
} & RouteComponentProps;

export default withRouter(ComposeModal);

function ComposeModal(props: Props): ReactElement {
  const draft = useDraftPost();
  const updateDraft = useUpdateDraft();

  const rows = draft.content.split('\n').length;

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
        <div className="compose-modal__footer">
          <div className="compose-modal__footer__l">
            <RTEActions

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
