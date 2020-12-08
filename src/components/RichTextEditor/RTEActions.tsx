import React, {MouseEventHandler, ReactElement} from "react";
import {withRouter} from "react-router";
import Icon from "../Icon";
import "./rte-actions.scss";
import Menuable from "../Menuable";

type Props = {
  className?: string;
  onInsertLinkClick: MouseEventHandler;
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
        onClick={() => null}
      />
      <Icon
        material="public"
        onClick={() => null}
      />
    </div>
  )
}
