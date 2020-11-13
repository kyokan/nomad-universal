import React, {
  ReactElement,
} from "react";
import { withRouter} from "react-router";
import "./index.scss";

function ComposeViewPanels(): ReactElement {

  return (
    <div className="compose-panels">
      <div className="compose-panel">
        <div className="compose-panel__title">Choose Topic</div>

      </div>
    </div>
  );
}

export default withRouter(ComposeViewPanels);
