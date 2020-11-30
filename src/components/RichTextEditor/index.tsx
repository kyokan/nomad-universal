import React, {
  ButtonHTMLAttributes,
  memo,
  MouseEventHandler,
  ReactElement,
  useCallback,
  useState
} from 'react';
import {
  convertToRaw,
  DraftHandleValue,
  Editor,
  EditorState,
  RichUtils,
  DefaultDraftBlockRenderMap, convertFromRaw,
} from "draft-js";
import c from "classnames";
import Icon from "../Icon";
import BoldIcon from '../../static/assets/icons/bold.svg';
import ItalicIcon from "../../static/assets/icons/italic.svg";
import UnderlineIcon from "../../static/assets/icons/underline.svg";
import StrikethroughIcon from "../../static/assets/icons/strikethrough.svg";
import CodeBlockIcon from "../../static/assets/icons/code.png";
import CodeIcon from "../../static/assets/icons/code.svg";
import OrderedListIcon from "../../static/assets/icons/list.svg";
import UnorderedListIcon from "../../static/assets/icons/list-2.svg";
import './rich-text-editor.scss';
import {DraftPost} from "../../ducks/drafts/type";
import {useDraftPost} from "../../ducks/drafts";
import {PostType} from "../../types/posts";
import {customStyleMap, mapDraftToEditorState, markdownConvertOptions} from "../../utils/rte";
import {markdownToDraft} from "markdown-draft-js";

const hljs = require('highlight.js');
const TableUtils = require('draft-js-table');

const { draftToMarkdown } = require('markdown-draft-js');

type Props = {
  className?: string;
  onChange: (post: DraftPost) => void;
  disabled?: boolean;
  embedded?: boolean;
  onSecondaryClick?: MouseEventHandler;
  onPrimaryClick?: MouseEventHandler;
  primaryBtnProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

function RichTextEditor(props: Props): ReactElement {
  const {
    className = '',
    disabled,
    onChange,
    embedded,
    onPrimaryClick,
    onSecondaryClick,
    primaryBtnProps,
  } = props;

  const draftPost = useDraftPost();

  const [ref, setRef] = useState<Editor|null>(null);
  const [editorState, _setEditorState] = useState<EditorState>(mapDraftToEditorState(draftPost));
  const [title, setTitle] = useState<string>(draftPost?.title || '');

  const setEditorState = useCallback((newEditorState: EditorState) => {
    _setEditorState(newEditorState);
    const currentContent = newEditorState.getCurrentContent();
    const markdown = draftToMarkdown(convertToRaw(currentContent), markdownConvertOptions);

    onChange({
      type: PostType.ORIGINAL,
      timestamp: new Date().getTime(),
      title,
      content: currentContent.hasText() ? markdown : '',
      topic: '',
      context: '',
      parent: '',
      tags: [],
      attachments: [],
    });
  }, [onChange, editorState]);

  const handleKeyCommand: (command: string) => DraftHandleValue = useCallback((command: string): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  }, [editorState]);

  const onBoldClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'BOLD',
    setEditorState,
    [editorState, ref],
  );
  const onItalicClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'ITALIC',
    setEditorState,
    [editorState],
    );
  const onUnderlineClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'UNDERLINE',
    setEditorState,
    [editorState, ref],
    );
  const onStrikethroughClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'STRIKETHROUGH',
    setEditorState,
    [editorState, ref],
    );
  const onCodeClick = useRTEInlineStyleCallback(
    editorState,
    ref,
    'CODE',
    setEditorState,
    [editorState, ref],
    );

  const onCodeBlockClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'code-block',
    setEditorState,
    [editorState, ref],
    );
  const onOrderedListClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'ordered-list-item',
    setEditorState,
    [editorState, ref],
    );
  const onUnorderedListClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'unordered-list-item',
    setEditorState,
    [editorState, ref],
    );
  const onBlockquoteClick = useRTEInBlockTypeCallback(
    editorState,
    ref,
    'blockquote',
    setEditorState,
    [editorState, ref],
    );


  return (
    <div
      className={c('rich-text-editor', className, {
        'rich-text-editor--disabled': disabled,
        'rich-text-editor--embedded': embedded,
      })}
    >
      <RTEControls
        editorState={editorState}
        onBoldClick={onBoldClick}
        onItalicClick={onItalicClick}
        onUnderlineClick={onUnderlineClick}
        onStrikethroughClick={onStrikethroughClick}
        onCodeClick={onCodeClick}
        onCodeBlockClick={onCodeBlockClick}
        onOrderedListClick={onOrderedListClick}
        onUnorderedListClick={onUnorderedListClick}
        onBlockquoteClick={onBlockquoteClick}
        onPrimaryClick={onPrimaryClick}
        onSecondaryClick={onSecondaryClick}
        embedded={embedded}
        primaryBtnProps={primaryBtnProps}
      />
      <Editor
        ref={setRef}
        editorState={editorState}
        onChange={setEditorState}
        handleKeyCommand={handleKeyCommand}
        customStyleMap={customStyleMap}
        blockRenderMap={DefaultDraftBlockRenderMap.merge(TableUtils.DraftBlockRenderMap)}
        placeholder="Write here..."
      />
    </div>
  );
}

export default memo(RichTextEditor);

type RTEButtonProps = {
  material: string;
  onClick: MouseEventHandler;
  width?: number;
  active?: boolean;
}

function RTEButton(props: RTEButtonProps): ReactElement {
  return (
    <button
      className={c("rich-text-editor__controls__button", {
        "rich-text-editor__controls__button--active": props.active,
      })}
      onClick={props.onClick}
    >
      <Icon
        material={props.material}
        width={props.width}
      />
    </button>
  )
}

type RETControlsProps = {
  editorState: EditorState;
  onBoldClick: () => void;
  onItalicClick: () => void;
  onUnderlineClick: () => void;
  onStrikethroughClick: () => void;
  onCodeClick: () => void;
  onCodeBlockClick: () => void;
  onOrderedListClick: () => void;
  onUnorderedListClick: () => void;
  onBlockquoteClick: () => void;
  onSecondaryClick?: MouseEventHandler;
  onPrimaryClick?: MouseEventHandler;
  embedded?: boolean;
  primaryBtnProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

function RTEControls(props: RETControlsProps): ReactElement {
  const {
    onBoldClick,
    onItalicClick,
    onUnderlineClick,
    onStrikethroughClick,
    onCodeClick,
    onCodeBlockClick,
    onOrderedListClick,
    onUnorderedListClick,
    onBlockquoteClick,
    onSecondaryClick,
    onPrimaryClick,
    embedded,
    primaryBtnProps = {},
    editorState,
  } = props;

  const currentInlineStyle = editorState.getCurrentInlineStyle()?.toJS();
  const selection = editorState.getSelection();
  const currentType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  console.log(currentInlineStyle, currentType);

  return (
    <div className="rich-text-editor__controls">
      <RTEButton
        material="format_bold"
        onClick={onBoldClick}
        active={currentInlineStyle.includes('BOLD')}
      />
      <RTEButton
        material="format_italic"
        onClick={onItalicClick}
        active={currentInlineStyle.includes('ITALIC')}
      />
      <RTEButton
        material="format_underline"
        onClick={onUnderlineClick}
        active={currentInlineStyle.includes('UNDERLINE')}
      />
      <RTEButton
        material="format_strikethrough"
        onClick={onStrikethroughClick}
        active={currentInlineStyle.includes('STRIKETHROUGH')}
      />
      <RTEButton
        material="format_list_numbered"
        onClick={onOrderedListClick}
        width={16}
        active={currentType === "ordered-list-item"}
      />
      <RTEButton
        material="format_list_bulleted"
        onClick={onUnorderedListClick}
        width={16}
        active={currentType === "unordered-list-item"}
      />
      <RTEButton
        material="format_quote"
        onClick={onBlockquoteClick}
        width={16}
        active={currentType === "blockquote"}
      />
      {
        embedded && (
          <div className="rich-text-editor__controls__actions">
            <button className="button" onClick={onSecondaryClick}>Cancel</button>
            <button
              {...primaryBtnProps}
              className={`button ${primaryBtnProps.className}`}
              onClick={onPrimaryClick}
            >
              Send
            </button>
          </div>
        )
      }
    </div>
  );
}

function useRTEInlineStyleCallback(
  editorState: EditorState,
  editor: Editor|null,
  cmd: string,
  cb?: (s: EditorState) => void,
  dep?: any[],
): () => void {
  return useCallback(() => {
    const newState = RichUtils.toggleInlineStyle(editorState, cmd);
    if (cb) cb(newState);
    // if (editor) editor.focus();
  }, dep || []);
}

function useRTEInBlockTypeCallback(
  editorState: EditorState,
  editor: Editor|null,
  cmd: string,
  cb?: (s: EditorState) => void,
  dep?: any[],
): () => void {
  return useCallback(() => {
    const newState = RichUtils.toggleBlockType(editorState, cmd);
    if (cb) cb(newState);
    // if (editor) editor.focus();
  }, dep || []);
}
