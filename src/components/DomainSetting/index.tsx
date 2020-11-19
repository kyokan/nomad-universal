import React, {ReactElement, ReactNode} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import copy from "copy-to-clipboard";
import "./domain-setting.scss";
import Button from "../Button";
import {DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import {useCurrentUser} from "../../ducks/users";
import classNames = require("classnames");
import FootnoteRecordInput from "../FoonoteRecordInput";

type Props = {
  sendPost?: (post: DraftPost) => Promise<RelayerNewPostResponse>
} & RouteComponentProps;

function ProfileSetting(props: Props): ReactElement {

  return (
    <div className="domain-setting">
      <div className="setting__group">
        <div className="setting__group__content">
          {renderRegistrationStatus(props)}
          {renderFootnotePublicKey(props)}
        </div>
      </div>
    </div>
  );
}

export default withRouter(ProfileSetting);

function renderFootnotePublicKey(props: Props): ReactNode {
  const user = useCurrentUser();

  return (
    <div className="setting__group__content__row">
      <div className="setting__group__content__row__label">
        Footnote Record:
      </div>
      <div
        className="setting__group__content__row__value"
      >
        <FootnoteRecordInput
          pubkey={Buffer.from(user?.publicKey, 'hex').toString('base64')}
        />
      </div>
    </div>
  )
}


function renderRegistrationStatus(props: Props): ReactNode {
  const user = useCurrentUser();
  const {registered, confirmed} = user;

  return (
    <div className="setting__group__content__row">
      <div className="setting__group__content__row__label">
        Name Status:
      </div>
      <div
        className={classNames("setting__group__content__row__value name-status", {
          'name-status--not-registered': !registered && !confirmed,
          'name-status--pending': registered && !confirmed,
          'name-status--confirmed': confirmed,
        })}
      >
        {
          confirmed
            ? 'Confirmed'
            : registered
              ? 'Pending Confirmation'
              : 'Not Registered'
        }
      </div>
    </div>
  )
}
