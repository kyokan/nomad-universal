import React, {ChangeEvent, ReactElement, useCallback, useEffect, useState} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import MarkdownEditor from "../../components/MarkdownEditor";
import "./compose.scss";
import {addTag, useDraftPost, useUpdateDraft} from "../../ducks/drafts";
import Button from "../../components/Button";
import RTE from "../../components/RichTextEditor";
import {useDispatch} from "react-redux";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import {INDEXER_API} from "../../utils/api";
import { markdownToDraft, draftToMarkdown } from 'markdown-draft-js';
import {Editor, EditorState, convertToRaw, convertFromRaw, RichUtils} from 'draft-js';
import "./drafts.scss";
import classNames from "classnames";
import {markup} from "../../utils/rte";
import LinkPreview from "../LinkPreview";

type Props = {
  onSendPost: (draft: DraftPost, truncate?: boolean) => Promise<RelayerNewPostResponse>;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  onFileUploadButtonClick?: () => any;
  onOpenLink: (url: string) => void;
} & RouteComponentProps;

function ComposeView(props: Props): ReactElement {
  const updateDraft = useUpdateDraft();

  const draft = useDraftPost();
  const rows = draft.content.split('\n').length;

  const [isPreviewing, setPreviewing] = useState(false);
  const [isSending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [truncate, setTruncate] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const parser = new DOMParser();
    const html = markup(draft.content);
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');
    const link = links && links[0];
    console.log(link);
    if (link?.href !== previewUrl) {
      setPreviewUrl(link?.href);
    }
  }, [draft, previewUrl]);

  const togglePreview = useCallback(() => {
    setPreviewing(!isPreviewing)
  }, [isPreviewing]);

  const onDraftChange = useCallback(async (draftPost: DraftPost ) => {
    updateDraft(draftPost);
    setErrorMessage('');
  }, []);

  const onMarkdownChangeChange = useCallback(async (e: ChangeEvent<HTMLTextAreaElement> ) => {
    const markdownString = e.target.value;
    updateDraft({
      ...draft,
      content: markdownString,
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
    <div className="compose-container">
      <div className="compose">
        <div className="compose__header">

        </div>
        {
          !isPreviewing
            ? (
              <div className="rte">
                <RTE
                  onFileUpload={props.onFileUpload}
                  onChange={onDraftChange}
                />
              </div>
            )
            : (
              <MarkdownEditor
                onChange={onMarkdownChangeChange}
                value={draft.content}
                isShowingMarkdownPreview={!isPreviewing}
                rows={Math.max(rows, 12)}
                attachments={[]}
                disabled={isSending || success || truncate}
              />
            )
        }
        {
          previewUrl && (
            <LinkPreview
              onOpenLink={props.onOpenLink}
              className="compose__preview"
              url={previewUrl}
            />
          )
        }
        <div className="compose__error-message">{errorMessage}</div>
        <div className="compose__actions">
          <div className="compose__actions__l">
            <div className="compose__actions__truncate">
              <input
                type="checkbox"
                onChange={e => setTruncate(e.target.checked)}
                checked={truncate}
              />
              <div className="compose__actions__truncate-label">
                Rewrite?
              </div>
            </div>
          </div>
          <div className="compose__actions__r">
            <a onClick={togglePreview}>
              {isPreviewing ? 'Switch to Editor' : 'Switch to Markdown' }
            </a>
            <Button
              color={success ? "green" : undefined}
              onClick={send}
              loading={isSending}
              disabled={isSending || (!draft.content && !truncate)}
            >
              { success ? "Posted" : "Post" }
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withRouter(ComposeView);

type RichTextEditorProps = {
  className?: string;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  content: string;
  onChange: (draftPost: DraftPost) => void;
  isShowingMarkdown?: boolean;
  disabled?: boolean;
} & RouteComponentProps;

export const RichTextEditor = withRouter(_RichTextEditor);

function _RichTextEditor(props: RichTextEditorProps): ReactElement {
  const {
    className = '',
    content = '',
    isShowingMarkdown,
    disabled,
    onChange,
    onFileUpload,
  } = props;
  const rows = content.split('\n').length;
  const markdownString = content;

  const rawData = markdownToDraft(markdownString);
  const contentState = convertFromRaw(rawData);
  const editorState = EditorState.createWithContent(contentState);
  const [draftState, setDraftState] = useState(editorState);

  const onDraftChange = useCallback(async (draftPost: DraftPost ) => {
    const markdownString = draftPost.content;
    const rawData = markdownToDraft(markdownString);
    const contentState = convertFromRaw(rawData);
    const newEditorState = EditorState.createWithContent(contentState);
    setDraftState(newEditorState);
    onChange(draftPost);
  }, [draftState]);

  const onMarkdownChangeChange = useCallback(async (e: ChangeEvent<HTMLTextAreaElement> ) => {
    const markdownString = e.target.value;
    const rawData = markdownToDraft(markdownString);
    const contentState = convertFromRaw(rawData);
    const newEditorState = EditorState.createWithContent(contentState);

    setDraftState(newEditorState);
  }, [draftState]);

  return (
    <div className={`rte-wrapper ${className}`}>
      {
        !isShowingMarkdown
          ? (
            <div className="rte">
              <RTE
                onFileUpload={onFileUpload}
                onChange={onDraftChange}
              />
            </div>
          )
          : (
            <MarkdownEditor
              onChange={onMarkdownChangeChange}
              value={content}
              isShowingMarkdownPreview={!isShowingMarkdown}
              rows={Math.max(rows, 12)}
              attachments={[]}
              disabled={disabled}
            />
          )
      }
    </div>
  );
}
