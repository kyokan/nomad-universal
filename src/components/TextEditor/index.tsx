import React, {
  ChangeEvent,
  ReactElement,
  ReactNode,
  useCallback, useEffect,
  useState,
} from "react";
import {withRouter, RouteComponentProps} from "react-router";
import MarkdownEditor from "../../components/MarkdownEditor";
import RTE from "../../components/RichTextEditor";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import { markdownToDraft } from 'markdown-draft-js';
import {EditorState, convertFromRaw} from 'draft-js';
import Icon from "../Icon";
import classNames from "classnames";
import "./text-editor.scss";

type Props = {
  disabled?: boolean;
  onChange?: (post: DraftPost) => void;
  mode: "editor" | "markdown";
  defaultContent?: string;
} & RouteComponentProps;

function TextEditor(props: Props): ReactElement {
  const {disabled, mode} = props;
  const [draft, updateDraft] = useState<DraftPost>(createNewDraft({ content: props.defaultContent }));
  const rows = draft.content.split('\n').length;
  const [defaultRTEContent, setDefaultRTEContent] = useState(props.defaultContent);
  const [markdown, setMarkdown] = useState(props.defaultContent);

  const onDraftChange = useCallback(async (draftPost: DraftPost ) => {
    updateDraft({
      ...draft,
      content: draftPost.content,
    });
    setMarkdown(draftPost.content);
    if (props.onChange) {
      props.onChange({
        ...draft,
        content: draftPost.content,
      });
    }
  }, [draft]);

  const onMarkdownChangeChange = useCallback(async (e: ChangeEvent<HTMLTextAreaElement> ) => {
    const markdownString = e.target.value;
    setDefaultRTEContent(markdownString);
    updateDraft({
      ...draft,
      content: markdownString,
    });
    setMarkdown(markdownString);
    if (props.onChange) {
      props.onChange({
        ...draft,
        content: markdownString,
      });
    }
  }, [draft]);

  useEffect(() => {
    if (mode === "markdown") {
      setDefaultRTEContent(markdown);
    }
  }, [mode, markdown]);

  return (
    <div className="text-editor">
      {
        mode === "editor"
          ? (
            <RTE
              content={draft.content}
              onChange={onDraftChange}
              disabled={disabled}
              defaultContent={defaultRTEContent}
            />
          )
          : (
            <MarkdownEditor
              onChange={onMarkdownChangeChange}
              value={markdown}
              isShowingMarkdownPreview={false}
              rows={Math.max(rows, 12)}
              attachments={[]}
              disabled={disabled}
            />
          )
      }
    </div>
  )
}

export default withRouter(TextEditor);

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
