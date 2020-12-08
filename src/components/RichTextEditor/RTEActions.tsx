import React, {ReactElement} from "react";
import {withRouter} from "react-router";
import Icon from "../Icon";
import "./rte-actions.scss";

type Props = {
  className?: string;
};

export default function RTEActions(props: Props): ReactElement {
  return (
    <div className={`rte-actions ${props.className}`}>
      <Icon
        material="insert_link"
        onClick={() => null}
      />
      <Icon
        material="storage"
        onClick={() => null}
      />
      <Icon
        material="public"
        onClick={() => null}
      />
    </div>
  )
}
