import React, {
  ChangeEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import MarkdownEditor from "../../components/MarkdownEditor";
import "./compose.scss";
import {useDraftPost, useUpdateDraft} from "../../ducks/drafts";
import Button from "../../components/Button";
import RTE from "../../components/RichTextEditor";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import { markdownToDraft } from 'markdown-draft-js';
import {EditorState, convertFromRaw} from 'draft-js';
import "./drafts.scss";
import {markup} from "../../utils/rte";
import LinkPreview from "../LinkPreview";
import Icon from "../Icon";
import classNames from "classnames";
import Input from "../Input";
import {replaceLink} from "../../utils/posts";
import Menuable from "../Menuable";

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

  const [postType, setPostType] = useState<'POST' | 'LINK' | 'MEDIA'>('POST');
  const switchType = useCallback((type: 'POST' | 'LINK' | 'MEDIA') => {
    setPostType(type);
    updateDraft({
      ...draft,
      subtype: type === 'POST' ? '' : 'LINK',
      title: '',
    });
  }, [draft]);

  useEffect(() => {
    if (postType !== 'LINK') {
      return;
    }
    setPreviewUrl(replaceLink(draft.title));
  }, [postType, draft.title]);

  useEffect(() => {
    if (postType !== 'MEDIA') {
      return;
    }
    setPreviewUrl(replaceLink(draft.title));
  }, [postType, draft.title]);


  useEffect(() => {
    if (postType !== 'POST') {
      return;
    }

    const parser = new DOMParser();
    const html = markup(draft.content);
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a');
    const link = links && links[0];
    if (link?.href !== previewUrl) {
      setPreviewUrl(link?.href);
    }
  }, [draft.content, previewUrl, postType]);

  let disabled = false;

  if (postType === 'LINK') {
    try {
      new URL(draft.title);
      disabled = false;
    } catch (e) {
      disabled = true;
    }
  } else if (postType === 'POST') {
    disabled = !draft.content;
  } else if (postType === 'MEDIA') {
    try {
      new URL(draft.title);
      disabled = false;
    } catch (e) {
      disabled = true;
    }
  }

  return (
    <div className="compose-container">
      <div className="compose">
        <div className="compose__header">
          <div className="compose__selectors">
            {renderSelector(
              'Post',
              'message',
              'POST',
              postType,
              () => switchType('POST'),
            )}
            {renderSelector(
              'Link',
              'link',
              'LINK',
              postType,
              () => switchType('LINK'),
            )}
            {renderSelector(
              'Media',
              'image',
              'MEDIA',
              postType,
              () => switchType('MEDIA'),
            )}
          </div>
        </div>
        {renderTitle(props, postType)}
        {
          !isPreviewing
            ? (
              <div className="rte">
                <RTE
                  content={draft.content}
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
              disabled={isSending || (disabled && !truncate)}
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


function renderTitle(props: Props, postType: 'POST'|'LINK'|'MEDIA'): ReactNode {
  const draft = useDraftPost();
  const updateDraft = useUpdateDraft();

  const onTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    updateDraft({
      ...draft,
      title: e.target.value,
    });
  }, [
    draft.title,
    draft.content,
    draft.subtype,
  ]);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileUpload = useCallback(() => {
    setUploading(true);
    if (props.onFileUpload) {
      props.onFileUpload(async (file, skylink, progress) => {
        updateDraft({
          ...draft,
          title: skylink,
        });
        setFile(file);
        setUploading(false);
      });
    }
  }, [
    draft.title,
    draft.content,
    draft.subtype,
  ]);

  const onClearFile = useCallback(() => {
    updateDraft({
      ...draft,
      title: '',
    });
    setFile(file);
  }, [
    draft.title,
    draft.content,
    draft.subtype,
  ]);

  if (postType === 'MEDIA') {
    return file
      ? (
        <div
          className="compose__media compose__media--selected"
        >
          <div className="compose__media__label">
            {file?.name}
          </div>
          <div
            className="compose__media__button"
          >
            <Icon
              material="cancel"
              width={20}
              onClick={onClearFile}
            />
          </div>
        </div>
      )
      : (
        <div
          className="compose__media"
        >
          <div className="compose__media__label">
            No File Selected
          </div>
          <Menuable
            items={[
              { text: "Upload via Sia Skynet", onClick: onFileUpload }
            ]}
          >
            <Button
              // onClick={onFileUpload}
              loading={uploading}
              disabled={uploading}
            >
              Choose Upload Option
            </Button>
          </Menuable>

        </div>
      );
  }

  if (postType === 'LINK') {
    return (
      <div
        className="compose__title-input"
      >
        <Input
          type="text"
          placeholder="URL"
          onChange={onTitleChange}
          value={draft.title}
        />
      </div>
    );
  }

  return (
    <div
      className="compose__title-input"
    >
      <Input
        type="text"
        placeholder="Title (Optional)"
        onChange={onTitleChange}
        value={draft.title}
      />
    </div>
  );
}

type RichTextEditorProps = {
  className?: string;
  onFileUpload?: (cb: (file: File, skylink: string, prog: number) => Promise<void>) => Promise<void>;
  content: string;
  onChange: (draftPost: DraftPost) => void;
  isShowingMarkdown?: boolean;
  disabled?: boolean;
  embedded?: boolean;
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
    embedded,
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
                embedded={embedded}
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

function renderSelector(
  text: string,
  material: string,
  ownType: 'POST'|'LINK'|'MEDIA',
  currentType: 'POST'|'LINK'|'MEDIA',
  onClick: () => void,
): ReactNode {
  return (
    <div
      className={classNames('compose__selector', {
        'compose__selector--active': ownType === currentType,
      })}
      onClick={onClick}
    >
      <Icon material={material} width={20} />
      <div>{text}</div>
    </div>
  )
}
