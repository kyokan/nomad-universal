import React, {ReactElement} from "react";
import { withRouter, RouteComponentProps} from "react-router";
import "./index.scss";
import {useCurrentUsername, useUser} from "../../ducks/users";
import {UserFollowingRow} from "../UserPanels";

function HomePanels(props: RouteComponentProps): ReactElement {
  const currentUsername = useCurrentUsername();

  return (
    <div className="home-panels">
      <div className="home-panel">
        <div className="home-panel__header">
          <div className="home-panel__header__title">
            Home Feed
          </div>
        </div>
        <UserFollowingRow username={currentUsername} />
      </div>
    </div>
  );
}

export default withRouter(HomePanels);
