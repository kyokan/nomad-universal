import React, {ReactElement, ReactNode, useCallback, useState} from "react";
import {RouteComponentProps, withRouter} from "react-router-dom";
import copy from "copy-to-clipboard";
import "./domain-setting.scss";
import Button from "../Button";
import {createNewDraft, DraftPost} from "../../ducks/drafts/type";
import {RelayerNewPostResponse} from "../../utils/types";
import {useCurrentUser, useCurrentUsername, useUser} from "../../ducks/users";
import classNames = require("classnames");
import FootnoteRecordInput from "../FoonoteRecordInput";
import {FullScreenModal} from "../FullScreenModal";
import Icon from "../Icon";

type Props = {
  sendPost: (draft: DraftPost, truncate?: boolean) => Promise<RelayerNewPostResponse>;
} & RouteComponentProps;

function ProfileSetting(props: Props): ReactElement {

  return (
    <div className="domain-setting">
      <div className="setting__group">
        <div className="setting__group__content">
          {renderRegistrationStatus(props)}
          {renderFootnotePublicKey(props)}
          {renderClearBlob(props)}
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

function renderClearBlob(props: Props): ReactNode {
  const [showResetBlobModal, setShowReset] = useState(false);
  const [sending, setSending] = useState(false);
  const currentUsername = useCurrentUsername();

  const truncate = useCallback(async () => {
    setSending(true);
    await props.sendPost(createNewDraft(), true);
    setSending(false);
    setShowReset(false);
  }, [props.sendPost]);

  return (
    <div className="setting__group__content__row">
      <div className="setting__group__content__row__label">
        Available Blob Space:
      </div>
      <div
        className="setting__group__content__row__value"
      >
        <Button
          onClick={() => setShowReset(true)}
          disabled={!currentUsername || sending}
        >
          Reset Blob
        </Button>
      </div>
      {showResetBlobModal && (
        <FullScreenModal
          onClose={() => setShowReset(false)}
        >
         <div
           className="clear-modal"
           onClick={e => {
             e.preventDefault();
             e.stopPropagation();
           }}
         >
           <div className="clear-modal__header">
             <div className="clear-modal__header__label">
               Reset your blob
             </div>
             <Icon
               material="close"
               onClick={() => setShowReset(false)}
             />
           </div>
           <div className="clear-modal__content">
             This will remove all content from your Footnote storage. Are you sure you want to continue?
           </div>
           <div className="clear-modal__footer">
             <div className="clear-modal__footer__r">
               <Button
                 onClick={truncate}
                 loading={sending}
                 disabled={!currentUsername || sending}
               >
                 Reset Blob
               </Button>
             </div>
           </div>
         </div>
        </FullScreenModal>
      )}
    </div>
  )
}
