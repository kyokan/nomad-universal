import React, {MouseEventHandler, ReactElement} from "react";
import Icon from "../Icon";
import "./rte-actions.scss";
import {ModerationType} from "fn-client/lib/application/Moderation";
import {getModIcon} from "../../utils/posts";

type Props = {
  className?: string;
  onInsertLinkClick: MouseEventHandler;
  onInsertFileClick: MouseEventHandler;
  onModerationClick: MouseEventHandler;
  moderationType: ModerationType|null;
};

export default function RTEActions(props: Props): ReactElement {
  return (
    <div className={`rte-actions ${props.className}`}>
      <Icon
        material="insert_link"
        onClick={props.onInsertLinkClick}
      />
      <Icon
        material="insert_photo"
        onClick={props.onInsertFileClick}
      />
      <Icon
        material={getModIcon(props.moderationType)}
        onClick={props.onModerationClick}
      />
    </div>
  )
}
